import axios from 'axios';
import { Order, PendingOrder, OrderItem } from '../types';

const BOT_TOKEN = '1941939105:AAHJ9XhL9uRyzQ9uhi3F4rKAQIbQ9D7YRs8'; // Replace with your actual bot token
// Default chat IDs (fallback)
const DEFAULT_ADMIN_CHAT_ID = -1002701066037;
const DEFAULT_KITCHEN_CHAT_ID = -1002660493020;
const DEFAULT_BAR_CHAT_ID = -1002859150516;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBHOOK_URL = 'https://the-last-bot.vercel.app/api/telegram-webhook';

class TelegramService {
  private async getUserTelegramSettings(userId: string) {
    try {
      const { firebaseService } = await import('./firebase');
      const [user, departments] = await Promise.all([
        firebaseService.getUserProfile(userId),
        firebaseService.getDepartments(userId)
      ]);
      
      const cashierDept = departments.find(d => d.role === 'cashier');
      const adminDept = departments.find(d => d.role === 'admin');
      const kitchenDept = departments.find(d => d.role === 'kitchen');
      
      return {
        adminChatId: adminDept?.telegramChatId || cashierDept?.adminChatId || user?.telegramSettings?.adminChatId || user?.telegramChatId || DEFAULT_ADMIN_CHAT_ID,
        cashierChatId: cashierDept?.telegramChatId || DEFAULT_ADMIN_CHAT_ID,
        kitchenChatId: kitchenDept?.telegramChatId || user?.telegramSettings?.kitchenChatId || DEFAULT_KITCHEN_CHAT_ID
      };
    } catch (error) {
      console.error('Error getting user telegram settings:', error);
      return {
        adminChatId: DEFAULT_ADMIN_CHAT_ID,
        cashierChatId: DEFAULT_ADMIN_CHAT_ID,
        kitchenChatId: DEFAULT_KITCHEN_CHAT_ID
      };
    }
  }

  async setupWebhook(): Promise<boolean> {
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/setWebhook`, {
        url: WEBHOOK_URL,
        allowed_updates: ['callback_query', 'message']
      });
      
      console.log('Webhook setup result:', response.data);
      return response.data.ok;
    } catch (error) {
      console.error('Error setting up webhook:', error);
      return false;
    }
  }

  async getWebhookInfo(): Promise<any> {
    try {
      const response = await axios.get(`${TELEGRAM_API_URL}/getWebhookInfo`);
      return response.data;
    } catch (error) {
      console.error('Error getting webhook info:', error);
      return null;
    }
  }

  async sendMessage(message: string, chatId: number): Promise<boolean> {
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
        chat_id: chatId.toString(),
        text: message,
        parse_mode: 'HTML',
      });
      
      return response.data.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendTestMessage(chatId: string): Promise<boolean> {
    const message = `🤖 <b>Test Message</b>\n\n✅ Your Telegram integration is working correctly!\n🕐 ${new Date().toLocaleString()}`;
    return this.sendMessage(message, parseInt(chatId));
  }

  async sendPhoto(photo: File, caption: string, chatId: number): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('chat_id', chatId.toString());
      formData.append('photo', photo);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');

      const response = await axios.post(`${TELEGRAM_API_URL}/sendPhoto`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.ok;
    } catch (error) {
      console.error('Error sending Telegram photo:', error);
      return false;
    }
  }

  async sendPendingOrderWithButtons(pendingOrder: PendingOrder): Promise<boolean> {
    const telegramSettings = await this.getUserTelegramSettings(pendingOrder.userId);
    
    const orderItems = pendingOrder.items
      .map(item => `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}`)
      .join('\n');

    const message = `
🍽️ <b>New Order Pending Approval - Table ${pendingOrder.tableNumber}</b>

${orderItems}

💰 <b>Total: $${pendingOrder.totalAmount.toFixed(2)}</b>
🕐 <b>Time:</b> ${new Date(pendingOrder.timestamp).toLocaleString()}

⚠️ <b>Awaiting approval...</b>
    `.trim();

    const buttons = [
      [
        { text: '✅ Approve Order', callback_data: `approve_order_${pendingOrder.id}` },
        { text: '❌ Reject Order', callback_data: `reject_order_${pendingOrder.id}` }
      ]
    ];

    // Send to cashier for order confirmation
    return this.sendMessageWithButtons(telegramSettings.cashierChatId, message, buttons);
  }

  async sendOrderToDepartment(order: Order, department: any, departmentItems: OrderItem[]): Promise<boolean> {
    if (departmentItems.length === 0) return true;

    const telegramSettings = await this.getUserTelegramSettings(order.userId);
    const chatId = department.telegramChatId;
    const emoji = department.icon || '👨‍🍳';
    const departmentName = department.name;

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

    return this.sendMessageWithButtons(chatId, message, buttons);
  }

  async sendOrderNotification(order: Order): Promise<boolean> {
    const telegramSettings = await this.getUserTelegramSettings(order.userId);
    
    const orderItems = order.items
      .map(item => `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}`)
      .join('\n');

    const message = `
🍽️ <b>New Order - Table ${order.tableNumber}</b>

${orderItems}

💰 <b>Total: $${order.totalAmount.toFixed(2)}</b>
🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}
    `.trim();

    return this.sendMessage(message, telegramSettings.adminChatId);
  }

  async sendPaymentConfirmation(order: Order, paymentMethod: string, screenshot: File): Promise<boolean> {
    const telegramSettings = await this.getUserTelegramSettings(order.userId);
    
    const orderItems = order.items
      .map(item => `• ${item.name} x${item.quantity} - $${item.total.toFixed(2)}`)
      .join('\n');

    const caption = `
💳 <b>Payment Confirmation - Table ${order.tableNumber}</b>

${orderItems}

💰 <b>Total: $${order.totalAmount.toFixed(2)}</b>
💳 <b>Method:</b> ${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}

📸 <b>Payment Screenshot Attached</b>
    `.trim();

    // Send photo first
    await this.sendPhoto(screenshot, caption, telegramSettings.adminChatId);
    
    // Then send message with approve/reject buttons
    const paymentMessage = `
💳 <b>Payment Verification Needed - Table ${order.tableNumber}</b>

💰 <b>Amount: $${order.totalAmount.toFixed(2)}</b>
💳 <b>Method:</b> ${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
🕐 <b>Time:</b> ${new Date(order.timestamp).toLocaleString()}
    `.trim();

    const buttons = [
      [
        { text: '✅ Accept Payment', callback_data: `approve_payment_${order.id}` },
        { text: '❌ Reject Payment', callback_data: `reject_payment_${order.id}` }
      ]
    ];
    
    return this.sendMessageWithButtons(telegramSettings.adminChatId, paymentMessage, buttons);
  }

  async sendWaiterCall(tableNumber: string, userId?: string): Promise<boolean> {
    try {
      const telegramSettings = userId ? await this.getUserTelegramSettings(userId) : { cashierChatId: DEFAULT_ADMIN_CHAT_ID };
      
      // Try to find assigned waiter for this table
      let waiterChatId = telegramSettings.cashierChatId;
      let waiterName = 'Staff';
      
      if (userId) {
        const { firebaseService } = await import('./firebase');
        const waiterAssignment = await firebaseService.getWaiterForTable(userId, parseInt(tableNumber));
        
        if (waiterAssignment && waiterAssignment.telegramChatId && waiterAssignment.isActive) {
          waiterChatId = parseInt(waiterAssignment.telegramChatId);
          waiterName = waiterAssignment.waiterName;
          
          const waiterMessage = `📞 <b>Table ${tableNumber} is calling you!</b>\n\n👤 <b>Waiter:</b> ${waiterAssignment.waiterName}\n🕐 <b>Time:</b> ${new Date().toLocaleString()}\n\n⚡ <b>Please attend to this table immediately</b>`;
          
          // Send to assigned waiter
          const waiterSuccess = await this.sendMessageWithButtons(waiterChatId, waiterMessage, [
            [
              { text: '✅ On My Way', callback_data: `waiter_ack_${tableNumber}_${waiterAssignment.id}` },
              { text: '⏰ Busy - 5 min', callback_data: `waiter_delay_${tableNumber}_${waiterAssignment.id}` }
            ]
          ]);
          
          // Also notify cashier/admin
          const adminMessage = `📞 <b>Table ${tableNumber} called waiter</b>\n👤 <b>Assigned to:</b> ${waiterAssignment.waiterName}\n🕐 ${new Date().toLocaleString()}`;
          await this.sendMessage(adminMessage, telegramSettings.cashierChatId);
          
          return waiterSuccess;
        }
      }
      
      // Fallback to cashier if no waiter assigned
      const message = `📞 <b>Table ${tableNumber} is calling the waiter</b>\n🕐 ${new Date().toLocaleString()}\n\n⚠️ <b>No waiter assigned to this table</b>`;
      
      const buttons = [
        [
          { text: '✅ Acknowledged', callback_data: `waiter_ack_${tableNumber}_general` },
          { text: '👤 Assign Waiter', callback_data: `assign_waiter_${tableNumber}` }
        ]
      ];
      
      return this.sendMessageWithButtons(telegramSettings.cashierChatId, message, buttons);
    } catch (error) {
      console.error('Error sending waiter call:', error);
      return false;
    }
  }

  async sendBillRequest(tableNumber: string, userId?: string): Promise<boolean> {
    const telegramSettings = userId ? await this.getUserTelegramSettings(userId) : { cashierChatId: DEFAULT_ADMIN_CHAT_ID };
    const message = `💸 <b>Table ${tableNumber} is requesting the bill</b>\n🕐 ${new Date().toLocaleString()}`;
    return this.sendMessage(message, telegramSettings.cashierChatId);
  }

  async sendDayReport(report: {
    date: string;
    cashierInfo: {
      name: string;
      shift: string;
      notes: string;
    };
    totalOrders: number;
    totalRevenue: number;
    totalPayments: number;
    waiterCalls: number;
    mostOrderedItems: Array<{ name: string; count: number }>;
    mostActiveTable: string;
    departmentStats: {
      kitchen: { orders: number; avgPrepTime: number };
    };
  }, userId?: string): Promise<boolean> {
    const telegramSettings = userId ? await this.getUserTelegramSettings(userId) : { adminChatId: DEFAULT_ADMIN_CHAT_ID };
    
    const topItems = report.mostOrderedItems
      .slice(0, 5)
      .map((item, index) => `${index + 1}. ${item.name} (${item.count} orders)`)
      .join('\n');

    const message = `
📊 <b>Day Closing Report</b>
📅 ${report.date}
👤 <b>Cashier:</b> ${report.cashierInfo.name} (${report.cashierInfo.shift} shift)

📈 <b>Orders:</b> ${report.totalOrders}
💰 <b>Revenue:</b> $${report.totalRevenue.toFixed(2)}
💳 <b>Payments Processed:</b> ${report.totalPayments}
🏆 <b>Most Active Table:</b> ${report.mostActiveTable}
📞 <b>Waiter Calls:</b> ${report.waiterCalls}

🍽️ <b>Top Ordered Items:</b>
${topItems || 'No orders today'}

👨‍🍳 <b>Kitchen:</b> ${report.departmentStats.kitchen.orders} orders (Avg: ${report.departmentStats.kitchen.avgPrepTime}min)

${report.cashierInfo.notes ? `📝 <b>Notes:</b> ${report.cashierInfo.notes}\n\n` : ''}
✅ <b>Day closed successfully!</b>
    `.trim();
    
    return this.sendMessage(message, telegramSettings.adminChatId);
  }

  async sendFeedback(feedback: {
    orderId: string;
    tableNumber: string;
    rating: number;
    comment: string;
    timestamp: string;
    customerInfo?: {
      name?: string;
      telegramUsername?: string;
    };
  }, userId?: string): Promise<boolean> {
    const telegramSettings = userId ? await this.getUserTelegramSettings(userId) : { adminChatId: DEFAULT_ADMIN_CHAT_ID };
    
    const stars = '⭐'.repeat(feedback.rating);
    const customerName = feedback.customerInfo?.name || 
                       feedback.customerInfo?.telegramUsername || 
                       'Anonymous Customer';
    
    const message = `
📝 <b>Customer Feedback - Table ${feedback.tableNumber}</b>

👤 <b>Customer:</b> ${customerName}
⭐ <b>Rating:</b> ${stars} (${feedback.rating}/5)
📋 <b>Order ID:</b> ${feedback.orderId.slice(0, 8)}
🕐 <b>Time:</b> ${new Date(feedback.timestamp).toLocaleString()}

${feedback.comment ? `💬 <b>Comment:</b>\n"${feedback.comment}"\n\n` : ''}
📊 <b>Keep up the great work!</b>
    `.trim();
    
    return this.sendMessage(message, telegramSettings.adminChatId);
  }

  async sendEnhancedFeedback(feedback: {
    orderId: string;
    tableNumber: string;
    rating: number;
    comment: string;
    timestamp: string;
    sessionId?: string;
    customerInfo?: {
      name?: string;
      telegramUsername?: string;
      telegramPhoto?: string;
    };
  }, userId?: string): Promise<boolean> {
    const telegramSettings = userId ? await this.getUserTelegramSettings(userId) : { adminChatId: DEFAULT_ADMIN_CHAT_ID };
    
    const stars = '⭐'.repeat(feedback.rating);
    const emptyStars = '☆'.repeat(5 - feedback.rating);
    const customerName = feedback.customerInfo?.name || 
                       feedback.customerInfo?.telegramUsername || 
                       'Anonymous Customer';
    
    // Enhanced message with better formatting
    const message = `
📝 <b>New Customer Feedback</b>

🏷️ <b>Table ${feedback.tableNumber}</b>
👤 <b>Customer:</b> ${customerName}

⭐ <b>Rating:</b> ${stars}${emptyStars} (${feedback.rating}/5)

${feedback.comment ? `💬 <b>Comment:</b>\n<i>"${feedback.comment}"</i>\n` : ''}
📋 <b>Order:</b> ${feedback.orderId.slice(0, 8)}...
🕐 <b>Submitted:</b> ${new Date(feedback.timestamp).toLocaleString()}
${feedback.sessionId ? `🔗 <b>Session:</b> ${feedback.sessionId.slice(0, 8)}...\n` : ''}
${feedback.rating >= 4 ? '🎉 <b>Great feedback! Keep it up!</b>' : 
  feedback.rating >= 3 ? '👍 <b>Good feedback. Room for improvement.</b>' : 
  '⚠️ <b>Low rating. Consider following up with customer.</b>'}
    `.trim();
    
    return this.sendMessage(message, telegramSettings.adminChatId);
  }
  async sendPaymentConfirmationWithButtons(confirmationId: string, tableNumber: string, total: number, method: string, userId?: string): Promise<boolean> {
    const telegramSettings = userId ? await this.getUserTelegramSettings(userId) : { cashierChatId: DEFAULT_ADMIN_CHAT_ID };
    
    // Get the payment confirmation to access the screenshot and send it first
    try {
      const { firebaseService } = await import('./firebase');
      const confirmations = await firebaseService.getPaymentConfirmations(userId || '');
      const confirmation = confirmations.find(c => c.id === confirmationId);
      
      if (confirmation && confirmation.screenshotUrl) {
        // Send photo with detailed caption first
        const caption = `
💳 <b>Payment Verification Needed - Table ${tableNumber}</b>

💰 <b>Amount: $${total.toFixed(2)}</b>
💳 <b>Method:</b> ${method === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
🕐 <b>Time:</b> ${new Date().toLocaleString()}
📋 <b>Confirmation ID:</b> ${confirmationId.slice(0, 8)}

📸 <b>Payment Screenshot:</b>
        `.trim();
        
        try {
          // Convert image URL to blob and send as photo
          const response = await fetch(confirmation.screenshotUrl);
          const blob = await response.blob();
          const file = new File([blob], `payment-${confirmationId}.png`, { type: 'image/png' });
          
          await this.sendPhoto(file, caption, telegramSettings.cashierChatId);
        } catch (error) {
          console.error('Error sending payment photo:', error);
          // Fallback to text message with link
          const fallbackMessage = `${caption}\n\n🔗 <a href="${confirmation.screenshotUrl}">View Payment Screenshot</a>`;
          await this.sendMessage(fallbackMessage, telegramSettings.cashierChatId);
        }
      }
    } catch (error) {
      console.error('Error getting payment confirmation:', error);
    }
    
    // Then send the message with approve/reject buttons
    const message = `
💳 <b>Payment Verification Needed - Table ${tableNumber}</b>

💰 <b>Amount: $${total.toFixed(2)}</b>
💳 <b>Method:</b> ${method === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
🕐 <b>Time:</b> ${new Date().toLocaleString()}
📋 <b>Confirmation ID:</b> ${confirmationId.slice(0, 8)}

⚠️ <b>Please verify the payment screenshot above and take action:</b>
    `.trim();
    
    const buttons = [
      [
        { text: '✅ Accept Payment', callback_data: `approve_payment_${confirmationId}` },
        { text: '❌ Reject Payment', callback_data: `reject_payment_${confirmationId}` }
      ]
    ];
    
    return this.sendMessageWithButtons(telegramSettings.cashierChatId, message, buttons);
  }

  async sendBillPhoto(billImageUrl: string, tableNumber: string, total: number, userId?: string): Promise<boolean> {
    const telegramSettings = userId ? await this.getUserTelegramSettings(userId) : { cashierChatId: DEFAULT_ADMIN_CHAT_ID };
    
    const caption = `
💸 <b>Bill Generated - Table ${tableNumber}</b>

💰 <b>Total Amount: $${total.toFixed(2)}</b>
🕐 <b>Time:</b> ${new Date().toLocaleString()}

📄 <b>Bill Details Attached</b>
    `.trim();

    try {
      // Convert image URL to blob and send as photo
      const response = await fetch(billImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `bill-table-${tableNumber}.png`, { type: 'image/png' });
      
      return this.sendPhoto(file, caption, telegramSettings.cashierChatId);
    } catch (error) {
      console.error('Error sending bill photo:', error);
      // Fallback to text message with link
      const message = `${caption}\n\n🔗 <a href="${billImageUrl}">View Bill Image</a>`;
      return this.sendMessage(message, telegramSettings.cashierChatId);
    }
  }

  // New method to handle Telegram callback responses (for bot webhook)
  async handleTelegramCallback(callbackData: string, pendingOrders: any[], firebaseService: any): Promise<boolean> {
    try {
      if (callbackData.startsWith('approve_order_')) {
        const orderId = callbackData.replace('approve_order_', '');
        const pendingOrder = pendingOrders.find(p => p.id === orderId);
        
        if (pendingOrder) {
          await firebaseService.approvePendingOrder(orderId, pendingOrder);
          return true;
        }
      } else if (callbackData.startsWith('reject_order_')) {
        const orderId = callbackData.replace('reject_order_', '');
        await firebaseService.rejectPendingOrder(orderId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error handling Telegram callback:', error);
      return false;
    }
  }

  private async sendMessageWithButtons(chatId: number | string, message: string, buttons: any[]): Promise<boolean> {
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
        chat_id: chatId.toString(),
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons
        }
      });
      return response.data.ok;
    } catch (error) {
      console.error('Error sending message with buttons:', error);
      return false;
    }
  }
}

export const telegramService = new TelegramService();