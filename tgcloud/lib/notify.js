// tgcloud/lib/notify.js
// Helper functions to send Telegram notifications to staff groups.
// Dynamic multi-tenant support: sends to specific restaurant's chat IDs.
// https://core.telegram.org/bots/serverless#the-sdk

import { api } from 'sdk';
import { CONFIG } from './config.js';

const DEFAULT_ADMIN_CHAT_ID   = CONFIG.DEFAULT_ADMIN_CHAT_ID;
const DEFAULT_KITCHEN_CHAT_ID = CONFIG.DEFAULT_KITCHEN_CHAT_ID;
const DEFAULT_BAR_CHAT_ID     = CONFIG.DEFAULT_BAR_CHAT_ID;

/**
 * Send a new order notification to the specific cafe's cashier/admin group
 * @param {object} order 
 * @param {number|string} [targetChatId] The specific cafe's admin/cashier Telegram chat ID
 */
export async function notifyNewOrder(order, targetChatId) {
  const { id, tableNumber, items = [], totalAmount } = order;
  const chatId = Number(targetChatId) || DEFAULT_ADMIN_CHAT_ID;
  if (!chatId) {
    console.error('No admin/cashier chatId found for new order notification');
    return;
  }

  const itemList = items.map(i => `  • ${i.name} × ${i.quantity}`).join('\n');

  const text = [
    `🍽️ <b>New Order – Table ${tableNumber}</b>`,
    '',
    `<b>Order ID:</b> ${String(id).slice(-6)}`,
    `<b>Items:</b>`,
    itemList,
    `<b>Total:</b> ${totalAmount} ETB`,
  ].join('\n');

  await api.sendMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Approve', callback_data: `approve_order_${id}` },
        { text: '❌ Reject',  callback_data: `reject_order_${id}` },
      ]],
    },
  });
}

/**
 * Send kitchen or bar department notification when an order is routed to preparation
 * @param {object} order
 * @param {string} departmentId
 * @param {number|string} [targetChatId] The specific department's Telegram chat ID
 */
export async function notifyKitchen(order, departmentId, targetChatId) {
  const isBar = departmentId?.toLowerCase().includes('bar');
  const chatId = Number(targetChatId) || (isBar ? DEFAULT_BAR_CHAT_ID : DEFAULT_KITCHEN_CHAT_ID);
  if (!chatId) {
    console.error(`No chatId found for department ${departmentId}`);
    return;
  }

  const deptItems = order.items?.filter(i => i.department === departmentId) || order.items || [];
  const itemList = deptItems.map(i => `  • ${i.name} × ${i.quantity}`).join('\n');
  const emoji = isBar ? '🍹' : '👨‍🍳';

  const text = [
    `${emoji} <b>${isBar ? 'Bar' : 'Kitchen'} Order – Table ${order.tableNumber}</b>`,
    '',
    itemList,
    '',
    `<b>Notes:</b> ${order.notes || '—'}`,
  ].join('\n');

  await api.sendMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Ready',     callback_data: `ready_${departmentId}_${order.id}` },
        { text: '⏰ +10 min',   callback_data: `delay_${departmentId}_${order.id}` },
      ]],
    },
  });
}

/**
 * Notify restaurant cashier/admin about a customer payment submission
 * @param {object} confirmation
 * @param {number|string} [targetChatId] The specific cafe's cashier/admin chat ID
 */
export async function notifyPaymentConfirmation(confirmation, targetChatId) {
  const { id, tableNumber, amount, method, screenshot } = confirmation;
  const chatId = Number(targetChatId) || DEFAULT_ADMIN_CHAT_ID;
  if (!chatId) {
    console.error('No chatId found for payment confirmation');
    return;
  }

  const text = [
    `💳 <b>Payment Confirmation – Table ${tableNumber}</b>`,
    '',
    `<b>Amount:</b> ${amount} ETB`,
    `<b>Method:</b> ${method}`,
    `<b>ID:</b> ${String(id).slice(-8)}`,
  ].join('\n');

  const keyboard = [[
    { text: '✅ Approve', callback_data: `approve_payment_${id}` },
    { text: '❌ Reject',  callback_data: `reject_payment_${id}` },
  ]];

  if (screenshot) {
    await api.sendPhoto({
      chat_id: chatId,
      photo: screenshot,
      caption: text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    });
  } else {
    await api.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    });
  }
}

/**
 * Notify the assigned waiter (or fallback to cafe admin/cashier)
 */
export async function notifyWaiterCall(tableNumber, waiterChatId, waiterId, waiterName, fallbackAdminChatId) {
  const chatId = Number(waiterChatId) || Number(fallbackAdminChatId) || DEFAULT_ADMIN_CHAT_ID;
  if (!chatId) {
    console.error('No chatId available to dispatch waiter call');
    return;
  }

  await api.sendMessage({
    chat_id: chatId,
    text: [
      `📞 <b>Table ${tableNumber} is calling you!</b>`,
      '',
      `👤 <b>Waiter:</b> ${waiterName || 'Staff'}`,
      `🕐 <b>Time:</b> ${new Date().toLocaleString()}`,
      '',
      '⚡ <b>Please attend to this table immediately.</b>',
    ].join('\n'),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ On My Way',    callback_data: `waiter_ack_${tableNumber}_${waiterId}` },
        { text: '⏰ Busy – 5 min', callback_data: `waiter_delay_${tableNumber}_${waiterId}` },
      ]],
    },
  });
}
