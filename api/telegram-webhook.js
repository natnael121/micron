// Enhanced Telegram webhook handler with POS integration
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const BOT_TOKEN = '1941939105:AAHJ9XhL9uRyzQ9uhi3F4rKAQIbQ9D7YRs8';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCallbackQuery(callbackQuery) {
  const { data: callbackData, message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    if (callbackData.startsWith('approve_order_')) {
      const orderId = callbackData.replace('approve_order_', '');
      await approveOrder(orderId, chatId);
    } else if (callbackData.startsWith('reject_order_')) {
      const orderId = callbackData.replace('reject_order_', '');
      await rejectOrder(orderId, chatId);
    } else if (callbackData.startsWith('approve_payment_')) {
      const confirmationId = callbackData.replace('approve_payment_', '');
      await approvePayment(confirmationId, chatId);
    } else if (callbackData.startsWith('reject_payment_')) {
      const confirmationId = callbackData.replace('reject_payment_', '');
      await rejectPayment(confirmationId, chatId);
    } else if (callbackData.startsWith('waiter_ack_')) {
      const [, , tableNumber, waiterId] = callbackData.split('_');
      await acknowledgeWaiterCall(tableNumber, waiterId, chatId);
    } else if (callbackData.startsWith('waiter_delay_')) {
      const [, , tableNumber, waiterId] = callbackData.split('_');
      await delayWaiterCall(tableNumber, waiterId, chatId);
    } else if (callbackData.startsWith('ready_')) {
      const [, departmentId, orderId] = callbackData.split('_');
      await markOrderReady(orderId, departmentId, chatId);
    } else if (callbackData.startsWith('delay_')) {
      const [, departmentId, orderId] = callbackData.split('_');
      await delayOrder(orderId, departmentId, chatId);
    }

    // Answer callback query to remove loading state
    await answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('Error handling callback query:', error);
    await answerCallbackQuery(callbackQuery.id, 'Error processing request');
  }
}

async function handleMessage(message) {
  const { text, chat, from } = message;
  
  // Handle text commands
  if (text?.startsWith('/')) {
    const command = text.split(' ')[0];
    
    switch (command) {
      case '/start':
        await sendWelcomeMessage(chat.id);
        break;
      case '/status':
        await sendStatusMessage(chat.id);
        break;
      case '/help':
        await sendHelpMessage(chat.id);
        break;
    }
  }
}

async function approveOrder(orderId, chatId) {
  try {
    // Get pending order
    const pendingOrderDoc = await db.collection('pendingOrders').doc(orderId).get();
    if (!pendingOrderDoc.exists) {
      await sendMessage(chatId, '❌ Order not found or already processed');
      return;
    }

    const pendingOrder = { id: orderId, ...pendingOrderDoc.data() };
    
    // Create approved order
    const approvedOrder = {
      ...pendingOrder,
      status: 'approved',
      paymentStatus: 'pending',
      timestamp: new Date().toISOString()
    };
    
    // Add to orders collection
    const orderRef = await db.collection('orders').add(approvedOrder);
    
    // Add to table bill
    const existingBillQuery = await db.collection('tableBills')
      .where('userId', '==', pendingOrder.userId)
      .where('tableNumber', '==', pendingOrder.tableNumber)
      .where('status', '==', 'active')
      .get();
    
    if (!existingBillQuery.empty) {
      const billDoc = existingBillQuery.docs[0];
      const existingBill = billDoc.data();
      const updatedItems = [...existingBill.items];
      
      pendingOrder.items.forEach(newItem => {
        const existingIndex = updatedItems.findIndex(item => item.id === newItem.id);
        if (existingIndex >= 0) {
          updatedItems[existingIndex].quantity += newItem.quantity;
          updatedItems[existingIndex].total += newItem.total;
        } else {
          updatedItems.push(newItem);
        }
      });
      
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.15;
      const total = subtotal + tax;
      
      await billDoc.ref.update({
        items: updatedItems,
        subtotal,
        tax,
        total,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new table bill
      const subtotal = pendingOrder.items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.15;
      const total = subtotal + tax;
      
      await db.collection('tableBills').add({
        tableNumber: pendingOrder.tableNumber,
        userId: pendingOrder.userId,
        cafeId: pendingOrder.cafeId || pendingOrder.userId,
        items: pendingOrder.items,
        subtotal,
        tax,
        total,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Send order to departments
    await sendOrderToDepartments(orderRef.id, approvedOrder);
    
    // Sync to Telegram notifications
    try {
      await syncOrderToTelegram(approvedOrder);
    } catch (telegramError) {
      console.error('Telegram sync failed:', telegramError);
      // Continue even if Telegram sync fails
    }
    
    // Delete pending order
    await db.collection('pendingOrders').doc(orderId).delete();
    
    await sendMessage(chatId, `✅ Order approved for Table ${pendingOrder.tableNumber}!\n\n📋 Order sent to kitchen\n💰 Added to table bill`);
  } catch (error) {
    console.error('Error approving order:', error);
    await sendMessage(chatId, '❌ Failed to approve order. Please try again.');
  }
}

async function rejectOrder(orderId, chatId) {
  try {
    const pendingOrderDoc = await db.collection('pendingOrders').doc(orderId).get();
    if (!pendingOrderDoc.exists) {
      await sendMessage(chatId, '❌ Order not found or already processed');
      return;
    }

    const pendingOrder = pendingOrderDoc.data();
    await db.collection('pendingOrders').doc(orderId).delete();
    
    await sendMessage(chatId, `❌ Order rejected for Table ${pendingOrder.tableNumber}`);
  } catch (error) {
    console.error('Error rejecting order:', error);
    await sendMessage(chatId, '❌ Failed to reject order. Please try again.');
  }
}

async function approvePayment(confirmationId, chatId) {
  try {
    const confirmationDoc = await db.collection('paymentConfirmations').doc(confirmationId).get();
    if (!confirmationDoc.exists) {
      await sendMessage(chatId, '❌ Payment confirmation not found');
      return;
    }

    const confirmation = confirmationDoc.data();
    
    // Update payment confirmation status
    await db.collection('paymentConfirmations').doc(confirmationId).update({
      status: 'approved',
      processedAt: new Date().toISOString()
    });
    
    // Mark table bill as paid
    const tableBillQuery = await db.collection('tableBills')
      .where('userId', '==', confirmation.userId)
      .where('tableNumber', '==', confirmation.tableNumber)
      .where('status', '==', 'active')
      .get();
    
    if (!tableBillQuery.empty) {
      await tableBillQuery.docs[0].ref.update({
        status: 'paid',
        paymentConfirmationId: confirmationId,
        updatedAt: new Date().toISOString()
      });
    }

    // Process payment in Telegram notifications
    try {
      await processPaymentInTelegram({
        orderId: confirmation.orderId || `table_${confirmation.tableNumber}_${Date.now()}`,
        paymentMethod: confirmation.method,
        amount: confirmation.total,
        transactionId: confirmationId,
        tableNumber: confirmation.tableNumber
      });
    } catch (telegramError) {
      console.error('Telegram payment processing failed:', telegramError);
      // Continue even if Telegram processing fails
    }
    
    await sendMessage(chatId, `✅ Payment approved for Table ${confirmation.tableNumber}!\n💰 Amount: $${confirmation.total.toFixed(2)}\n💳 Method: ${confirmation.method.replace('_', ' ')}`);
  } catch (error) {
    console.error('Error approving payment:', error);
    await sendMessage(chatId, '❌ Failed to approve payment. Please try again.');
  }
}

async function rejectPayment(confirmationId, chatId) {
  try {
    const confirmationDoc = await db.collection('paymentConfirmations').doc(confirmationId).get();
    if (!confirmationDoc.exists) {
      await sendMessage(chatId, '❌ Payment confirmation not found');
      return;
    }

    const confirmation = confirmationDoc.data();
    
    await db.collection('paymentConfirmations').doc(confirmationId).update({
      status: 'rejected',
      processedAt: new Date().toISOString()
    });
    
    await sendMessage(chatId, `❌ Payment rejected for Table ${confirmation.tableNumber}\n💰 Amount: $${confirmation.total.toFixed(2)}`);
  } catch (error) {
    console.error('Error rejecting payment:', error);
    await sendMessage(chatId, '❌ Failed to reject payment. Please try again.');
  }
}

async function acknowledgeWaiterCall(tableNumber, waiterId, chatId) {
  try {
    // Update waiter call status
    const waiterCallsQuery = await db.collection('waiterCalls')
      .where('tableNumber', '==', tableNumber)
      .where('status', '==', 'pending')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (!waiterCallsQuery.empty) {
      await waiterCallsQuery.docs[0].ref.update({
        status: 'acknowledged',
        updatedAt: new Date().toISOString()
      });
    }
    
    await sendMessage(chatId, `✅ Acknowledged! On the way to Table ${tableNumber}`);
  } catch (error) {
    console.error('Error acknowledging waiter call:', error);
    await sendMessage(chatId, '❌ Failed to acknowledge call');
  }
}

async function delayWaiterCall(tableNumber, waiterId, chatId) {
  try {
    await sendMessage(chatId, `⏰ Table ${tableNumber} - Will be there in 5 minutes`);
  } catch (error) {
    console.error('Error delaying waiter call:', error);
  }
}

async function markOrderReady(orderId, departmentId, chatId) {
  try {
    await db.collection('orders').doc(orderId).update({
      status: 'ready',
      readyAt: new Date().toISOString()
    });
    
    await sendMessage(chatId, `✅ Order ${orderId.slice(0, 8)} marked as ready!`);
  } catch (error) {
    console.error('Error marking order ready:', error);
    await sendMessage(chatId, '❌ Failed to mark order as ready');
  }
}

async function delayOrder(orderId, departmentId, chatId) {
  try {
    await sendMessage(chatId, `⏰ Order ${orderId.slice(0, 8)} - Additional time needed`);
  } catch (error) {
    console.error('Error delaying order:', error);
  }
}

async function sendOrderToDepartments(orderId, order) {
  try {
    // Get menu items and departments
    const [menuItemsSnapshot, departmentsSnapshot] = await Promise.all([
      db.collection('menuItems').where('userId', '==', order.userId).get(),
      db.collection('departments').where('userId', '==', order.userId).get()
    ]);

    const menuItems = menuItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const departments = departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Group items by department
    const departmentItems = {};
    
    for (const orderItem of order.items) {
      const menuItem = menuItems.find(mi => mi.id === orderItem.id);
      const departmentId = menuItem?.department || 'kitchen';
      
      if (!departmentItems[departmentId]) {
        departmentItems[departmentId] = [];
      }
      departmentItems[departmentId].push(orderItem);
    }
    
    // Send to each department
    for (const [departmentId, items] of Object.entries(departmentItems)) {
      const department = departments.find(d => d.id === departmentId || d.role === departmentId);
      if (department && items.length > 0) {
        await sendOrderToDepartment(order, department, items);
      }
    }
  } catch (error) {
    console.error('Error sending order to departments:', error);
  }
}

async function sendOrderToDepartment(order, department, departmentItems) {
  const emoji = department.icon || '👨‍🍳';
  const departmentName = department.name;
  const chatId = department.telegramChatId;

  const orderItems = departmentItems
    .map(item => `• ${item.name} x${item.quantity}`)
    .join('\n');

  const message = `
${emoji} <b>${departmentName} Order - Table ${order.tableNumber}</b>

${orderItems}

🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}
📋 <b>Order ID:</b> ${order.id.slice(0, 8)}

<b>Status: APPROVED - Start Preparation</b>
  `.trim();

  const buttons = [
    [
      { text: '✅ Ready', callback_data: `ready_${department.id}_${order.id}` },
      { text: '⏰ Delay', callback_data: `delay_${department.id}_${order.id}` }
    ]
  ];

  await sendMessageWithButtons(chatId, message, buttons);
}

// POS Integration Functions
async function syncOrderToPOS(order) {
  try {
    const posData = {
      id: order.id,
      table: order.tableNumber,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal: order.totalAmount,
      tax: order.totalAmount * 0.15,
      total: order.totalAmount * 1.15,
      timestamp: order.timestamp,
      status: 'pending',
      source: 'restaurant_app'
    };

    // Here you would send to your POS system
    // For now, we'll just log it
    console.log('Order synced to POS:', posData);
    
    // Update order with POS sync status
    await db.collection('orders').doc(order.id).update({
      telegramSynced: true,
      telegramSyncedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error syncing order to Telegram:', error);
    return false;
  }
}

async function processPaymentInTelegram(paymentData) {
  try {
    // Here you would process payment through Telegram notifications
    console.log('Payment processed in Telegram:', paymentData);
    
    // Create payment record
    await db.collection('payments').add({
      ...paymentData,
      timestamp: new Date().toISOString(),
      status: 'completed',
      source: 'telegram_notification'
    });
    
    return true;
  } catch (error) {
    console.error('Error processing payment in Telegram:', error);
    return false;
  }
}

// Utility functions
async function sendMessage(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function sendMessageWithButtons(chatId, text, buttons) {
  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons
        }
      })
    });
  } catch (error) {
    console.error('Error sending message with buttons:', error);
  }
}

async function answerCallbackQuery(callbackQueryId, text = '') {
  try {
    await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text
      })
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

async function sendWelcomeMessage(chatId) {
  const message = `
🤖 <b>Restaurant Bot</b>

Welcome! This bot will notify you about:
• 🍽️ New orders
• 💳 Payment confirmations  
• 📞 Waiter calls
• 📊 Daily reports

Use /help for more commands.
  `.trim();
  
  await sendMessage(chatId, message);
}

async function sendStatusMessage(chatId) {
  const message = `
📊 <b>Bot Status</b>

✅ <b>Online and operational</b>
🕐 <b>Last update:</b> ${new Date().toLocaleString()}
🔗 <b>Webhook:</b> Active
📱 <b>Notifications:</b> Enabled

All systems running normally!
  `.trim();
  
  await sendMessage(chatId, message);
}

async function sendHelpMessage(chatId) {
  const message = `
🆘 <b>Help & Commands</b>

<b>Available Commands:</b>
/start - Welcome message
/status - Check bot status
/help - Show this help

<b>Notifications:</b>
• Order approvals with ✅/❌ buttons
• Payment confirmations with approve/reject
• Waiter calls with acknowledgment
• Kitchen orders with ready/delay buttons

<b>Support:</b>
Contact your restaurant admin for assistance.
  `.trim();
  
  await sendMessage(chatId, message);
}