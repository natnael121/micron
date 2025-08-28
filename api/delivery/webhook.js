// Delivery Company Webhook Handler
// Receives orders and events from delivery companies

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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Delivery-Company');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const deliveryCompany = req.headers['x-delivery-company'];
    const { type, data } = req.body;

    if (!deliveryCompany || !type || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['X-Delivery-Company header', 'type', 'data']
      });
    }

    // Log webhook event
    const webhookEvent = {
      type,
      deliveryCompany,
      restaurantId: data.restaurantId,
      orderId: data.orderId || data.id,
      data,
      timestamp: new Date().toISOString(),
      processed: false
    };

    const eventRef = await db.collection('deliveryWebhookEvents').add(webhookEvent);

    // Process the event
    const result = await processWebhookEvent(type, data, deliveryCompany);

    if (result.success) {
      // Mark as processed
      await eventRef.update({
        processed: true,
        processedAt: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        eventId: eventRef.id
      });
    } else {
      // Mark as failed
      await eventRef.update({
        processed: false,
        errorMessage: result.error
      });

      res.status(400).json({
        success: false,
        error: result.error,
        eventId: eventRef.id
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function processWebhookEvent(type, data, deliveryCompany) {
  try {
    switch (type) {
      case 'order_placed':
        return await handleNewOrder(data, deliveryCompany);
      case 'order_cancelled':
        return await handleOrderCancellation(data, deliveryCompany);
      case 'payment_confirmed':
        return await handlePaymentConfirmation(data, deliveryCompany);
      case 'delivery_assigned':
        return await handleDeliveryAssignment(data, deliveryCompany);
      default:
        return { success: false, error: `Unknown event type: ${type}` };
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return { success: false, error: error.message };
  }
}

async function handleNewOrder(orderData, deliveryCompany) {
  try {
    // Validate required fields
    const required = ['restaurantId', 'customer', 'items', 'subtotal'];
    for (const field of required) {
      if (!orderData[field]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    // Convert to internal order format
    const internalOrder = {
      tableNumber: 'DELIVERY',
      userId: orderData.restaurantId,
      items: orderData.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      totalAmount: orderData.subtotal,
      status: 'pending',
      paymentStatus: orderData.paymentStatus === 'paid' ? 'paid' : 'pending',
      timestamp: new Date().toISOString(),
      customerInfo: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        email: orderData.customer.email,
      },
      notes: orderData.specialInstructions,
      deliveryInfo: {
        company: deliveryCompany,
        orderId: orderData.id,
        address: orderData.customer.deliveryAddress,
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
      }
    };

    // Add to orders collection
    const orderRef = await db.collection('orders').add(internalOrder);

    // Send notification to restaurant via Telegram
    await notifyRestaurantOfNewDeliveryOrder(internalOrder, deliveryCompany, orderRef.id);

    // Check if auto-accept is enabled
    const integrationQuery = await db.collection('deliveryIntegrations')
      .where('userId', '==', orderData.restaurantId)
      .where('deliveryCompanyId', '==', deliveryCompany)
      .where('isActive', '==', true)
      .get();

    if (!integrationQuery.empty) {
      const integration = integrationQuery.docs[0].data();
      if (integration.settings?.autoAcceptOrders) {
        // Auto-accept the order
        await updateOrderStatusInDeliveryCompany(
          orderRef.id,
          'accepted',
          deliveryCompany,
          integration.settings.defaultPrepTime
        );
        
        // Update internal status
        await orderRef.update({ status: 'confirmed' });
      }
    }

    return { success: true, orderId: orderRef.id };
  } catch (error) {
    console.error('Error handling new order:', error);
    return { success: false, error: error.message };
  }
}

async function handleOrderCancellation(data, deliveryCompany) {
  try {
    // Find the order by delivery company order ID
    const orderQuery = await db.collection('orders')
      .where('deliveryInfo.orderId', '==', data.orderId)
      .where('deliveryInfo.company', '==', deliveryCompany)
      .get();

    if (orderQuery.empty) {
      return { success: false, error: 'Order not found' };
    }

    const orderDoc = orderQuery.docs[0];
    await orderDoc.ref.update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: data.reason || 'Cancelled by delivery company'
    });

    // Notify restaurant
    const order = orderDoc.data();
    await notifyRestaurantOfOrderCancellation(order, deliveryCompany, data.reason);

    return { success: true };
  } catch (error) {
    console.error('Error handling order cancellation:', error);
    return { success: false, error: error.message };
  }
}

async function handlePaymentConfirmation(data, deliveryCompany) {
  try {
    const orderQuery = await db.collection('orders')
      .where('deliveryInfo.orderId', '==', data.orderId)
      .where('deliveryInfo.company', '==', deliveryCompany)
      .get();

    if (!orderQuery.empty) {
      await orderQuery.docs[0].ref.update({
        paymentStatus: 'paid',
        paidAt: new Date().toISOString()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling payment confirmation:', error);
    return { success: false, error: error.message };
  }
}

async function handleDeliveryAssignment(data, deliveryCompany) {
  try {
    const orderQuery = await db.collection('orders')
      .where('deliveryInfo.orderId', '==', data.orderId)
      .where('deliveryInfo.company', '==', deliveryCompany)
      .get();

    if (!orderQuery.empty) {
      const orderDoc = orderQuery.docs[0];
      await orderDoc.ref.update({
        'deliveryInfo.driverName': data.driverName,
        'deliveryInfo.driverPhone': data.driverPhone,
        'deliveryInfo.estimatedPickupTime': data.estimatedPickupTime,
        driverAssignedAt: new Date().toISOString()
      });

      // Notify restaurant
      const order = orderDoc.data();
      await notifyRestaurantOfDriverAssignment(order, data);
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling delivery assignment:', error);
    return { success: false, error: error.message };
  }
}

async function notifyRestaurantOfNewDeliveryOrder(order, deliveryCompany, orderId) {
  try {
    // Get restaurant's Telegram settings
    const userDoc = await db.collection('users').doc(order.userId).get();
    if (!userDoc.exists) return;

    const user = userDoc.data();
    
    // Get cashier department for notifications
    const departmentsQuery = await db.collection('departments')
      .where('userId', '==', order.userId)
      .where('role', '==', 'cashier')
      .get();

    let chatId = user.telegramChatId || -1002701066037; // Fallback
    
    if (!departmentsQuery.empty) {
      chatId = departmentsQuery.docs[0].data().telegramChatId;
    }

    const message = `
🚚 <b>New Delivery Order - ${deliveryCompany}</b>

👤 <b>Customer:</b> ${order.customerInfo.name}
📞 <b>Phone:</b> ${order.customerInfo.phone}
📍 <b>Address:</b> ${order.deliveryInfo.address.line1}

🍽️ <b>Items:</b>
${order.items.map(item => `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}`).join('\n')}

💰 <b>Restaurant Total:</b> $${order.totalAmount.toFixed(2)}
🕐 <b>Order Time:</b> ${new Date(order.timestamp).toLocaleString()}

${order.notes ? `📝 <b>Special Instructions:</b> ${order.notes}\n` : ''}
⚠️ <b>Please accept or reject this order promptly</b>
    `.trim();

    const buttons = [
      [
        { text: '✅ Accept Order', callback_data: `accept_delivery_${orderId}` },
        { text: '❌ Reject Order', callback_data: `reject_delivery_${orderId}` }
      ]
    ];

    await sendTelegramMessageWithButtons(chatId, message, buttons);
  } catch (error) {
    console.error('Error notifying restaurant of new delivery order:', error);
  }
}

async function notifyRestaurantOfOrderCancellation(order, deliveryCompany, reason) {
  try {
    const userDoc = await db.collection('users').doc(order.userId).get();
    if (!userDoc.exists) return;

    const user = userDoc.data();
    const chatId = user.telegramChatId || -1002701066037;

    const message = `
❌ <b>Delivery Order Cancelled - ${deliveryCompany}</b>

📋 <b>Order:</b> ${order.id.slice(0, 8)}
👤 <b>Customer:</b> ${order.customerInfo.name}
💰 <b>Amount:</b> $${order.totalAmount.toFixed(2)}
${reason ? `📝 <b>Reason:</b> ${reason}\n` : ''}
🕐 <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    await sendTelegramMessage(chatId, message);
  } catch (error) {
    console.error('Error notifying restaurant of order cancellation:', error);
  }
}

async function notifyRestaurantOfDriverAssignment(order, driverData) {
  try {
    const userDoc = await db.collection('users').doc(order.userId).get();
    if (!userDoc.exists) return;

    const user = userDoc.data();
    const chatId = user.telegramChatId || -1002701066037;

    const message = `
🚗 <b>Driver Assigned - ${order.deliveryInfo.company}</b>

📋 <b>Order:</b> ${order.id.slice(0, 8)}
👤 <b>Driver:</b> ${driverData.driverName}
📞 <b>Driver Phone:</b> ${driverData.driverPhone}
🕐 <b>Pickup ETA:</b> ${driverData.estimatedPickupTime}

📦 <b>Please prepare the order for pickup</b>
    `.trim();

    await sendTelegramMessage(chatId, message);
  } catch (error) {
    console.error('Error notifying restaurant of driver assignment:', error);
  }
}

async function updateOrderStatusInDeliveryCompany(orderId, status, deliveryCompany, estimatedTime) {
  try {
    // This would make an API call to the delivery company
    // For now, we'll just log it
    console.log(`Updating order ${orderId} status to ${status} for ${deliveryCompany}`);
    
    // In a real implementation, you would:
    // 1. Get the delivery company's API credentials
    // 2. Make an authenticated API call to update the order status
    // 3. Handle any errors or retries
    
    return true;
  } catch (error) {
    console.error('Error updating order status in delivery company:', error);
    return false;
  }
}

async function sendTelegramMessage(chatId, message) {
  try {
    const BOT_TOKEN = '1941939105:AAHJ9XhL9uRyzQ9uhi3F4rKAQIbQ9D7YRs8';
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

async function sendTelegramMessageWithButtons(chatId, message, buttons) {
  try {
    const BOT_TOKEN = '1941939105:AAHJ9XhL9uRyzQ9uhi3F4rKAQIbQ9D7YRs8';
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons
        }
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending Telegram message with buttons:', error);
    return false;
  }
}