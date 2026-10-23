// tgcloud/handlers/callback_query.js
// Handles inline button presses from staff notification messages
// (approve order, reject order, approve payment, waiter acknowledgment, etc.)
// https://core.telegram.org/bots/serverless#handlers

import { api, db } from 'sdk';
import { eq, and } from 'sdk/db';
import { waiterCalls } from '../schema.js';
import { updateFirestoreOrder, updateFirestorePayment, getFirestoreOrder, getCafeTelegramSettings } from '../lib/firestore.js';
import { notifyKitchen } from '../lib/notify.js';

export default async function (callbackQuery) {
  const { data: callbackData, message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    if (callbackData.startsWith('approve_order_')) {
      const orderId = callbackData.replace('approve_order_', '');
      await handleApproveOrder(orderId, chatId);

    } else if (callbackData.startsWith('reject_order_')) {
      const orderId = callbackData.replace('reject_order_', '');
      await handleRejectOrder(orderId, chatId);

    } else if (callbackData.startsWith('approve_payment_')) {
      const confirmationId = callbackData.replace('approve_payment_', '');
      await handleApprovePayment(confirmationId, chatId);

    } else if (callbackData.startsWith('reject_payment_')) {
      const confirmationId = callbackData.replace('reject_payment_', '');
      await handleRejectPayment(confirmationId, chatId);

    } else if (callbackData.startsWith('waiter_ack_')) {
      // waiter_ack_<tableId>_<waiterId>
      const [, , tableId, waiterId] = callbackData.split('_');
      await handleWaiterAck(tableId, waiterId, chatId, from);

    } else if (callbackData.startsWith('waiter_delay_')) {
      // waiter_delay_<tableId>_<waiterId>
      const [, , tableId, waiterId] = callbackData.split('_');
      await handleWaiterDelay(tableId, waiterId, chatId, from);

    } else if (callbackData.startsWith('ready_')) {
      // ready_<departmentId>_<orderId>
      const [, departmentId, orderId] = callbackData.split('_');
      await handleOrderReady(orderId, departmentId, chatId);

    } else if (callbackData.startsWith('delay_')) {
      // delay_<departmentId>_<orderId>
      const [, departmentId, orderId] = callbackData.split('_');
      await handleOrderDelay(orderId, departmentId, chatId);
    }

    // Remove the loading spinner on the button
    if (callbackQuery?.id) {
      try {
        await api.answerCallbackQuery({ callback_query_id: callbackQuery.id });
      } catch (_) {}
    }

  } catch (error) {
    console.error('Callback query error:', error);
    if (callbackQuery?.id) {
      try {
        await api.answerCallbackQuery({
          callback_query_id: callbackQuery.id,
          text: '❌ Error processing request',
        });
      } catch (_) {}
    }
  }
}

// ─── Order Handlers ───────────────────────────────────────────────────────────

async function handleApproveOrder(orderId, chatId) {
  try {
    await updateFirestoreOrder(orderId, { status: 'approved', paymentStatus: 'pending' });
    await api.sendMessage({
      chat_id: chatId,
      text: `✅ <b>Order #${orderId.slice(-6)} approved!</b>\n\nThe kitchen and bar will be notified to start preparation.`,
      parse_mode: 'HTML',
    });

    // Notify specific kitchen and bar departments for this cafe
    const order = await getFirestoreOrder(orderId);
    if (order) {
      const cafeId = order.userId || order.cafeId;
      if (cafeId) {
        const settings = await getCafeTelegramSettings(cafeId);
        // Dispatch to kitchen chat
        if (settings.kitchenChatId) {
          await notifyKitchen(order, 'kitchen', settings.kitchenChatId);
        }
        // Dispatch to bar chat if order has bar items or bar department exists
        if (settings.barChatId) {
          await notifyKitchen(order, 'bar', settings.barChatId);
        }
      }
    }
  } catch (err) {
    console.error('Error approving order:', err);
    await api.sendMessage({ chat_id: chatId, text: '❌ Order not found or already processed.' });
  }
}

async function handleRejectOrder(orderId, chatId) {
  try {
    await updateFirestoreOrder(orderId, { status: 'rejected' });
    await api.sendMessage({
      chat_id: chatId,
      text: `❌ <b>Order #${orderId.slice(-6)} rejected.</b>\n\nThe customer will be notified.`,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Error rejecting order:', err);
    await api.sendMessage({ chat_id: chatId, text: '❌ Could not reject order.' });
  }
}

// ─── Payment Handlers ─────────────────────────────────────────────────────────

async function handleApprovePayment(confirmationId, chatId) {
  try {
    await updateFirestorePayment(confirmationId, 'approved');
    await api.sendMessage({
      chat_id: chatId,
      text: `✅ <b>Payment approved!</b>\n\nConfirmation ID: ${confirmationId.slice(-8)}\n\nThe table will be cleared for the next guests.`,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Error approving payment:', err);
    await api.sendMessage({ chat_id: chatId, text: '❌ Could not approve payment.' });
  }
}

async function handleRejectPayment(confirmationId, chatId) {
  try {
    await updateFirestorePayment(confirmationId, 'rejected');
    await api.sendMessage({
      chat_id: chatId,
      text: `❌ <b>Payment verification failed.</b>\n\nID: ${confirmationId.slice(-8)}\n\nPlease check with the customer.`,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Error rejecting payment:', err);
    await api.sendMessage({ chat_id: chatId, text: '❌ Could not reject payment.' });
  }
}

// ─── Waiter Call Handlers ─────────────────────────────────────────────────────

async function handleWaiterAck(tableId, waiterId, chatId, from) {
  await db.update(waiterCalls)
    .set({ status: 'acked' })
    .where(and(
      eq(waiterCalls.tableId, tableId),
      eq(waiterCalls.status, 'pending')
    ))
    .run();

  await api.sendMessage({
    chat_id: chatId,
    text: `✅ <b>On my way to Table #${tableId}!</b>\n\n👤 <b>Waiter:</b> ${from.first_name || 'Staff'}`,
    parse_mode: 'HTML',
  });
}

async function handleWaiterDelay(tableId, waiterId, chatId, from) {
  await db.update(waiterCalls)
    .set({ status: 'delayed' })
    .where(and(
      eq(waiterCalls.tableId, tableId),
      eq(waiterCalls.status, 'pending')
    ))
    .run();

  await api.sendMessage({
    chat_id: chatId,
    text: `⏰ <b>Table #${tableId}: I'll be there in ~5 minutes.</b>\n\n👤 <b>Waiter:</b> ${from.first_name || 'Staff'}`,
    parse_mode: 'HTML',
  });
}

// ─── Kitchen Handlers ─────────────────────────────────────────────────────────

async function handleOrderReady(orderId, departmentId, chatId) {
  try {
    await updateFirestoreOrder(orderId, { [`departments.${departmentId}.status`]: 'ready' });
    await api.sendMessage({
      chat_id: chatId,
      text: `✅ <b>Order ready for pickup!</b>\n\nOrder: ${orderId.slice(-6)}\nDepartment: ${departmentId}`,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Error marking order ready:', err);
  }
}

async function handleOrderDelay(orderId, departmentId, chatId) {
  try {
    await updateFirestoreOrder(orderId, { [`departments.${departmentId}.status`]: 'delayed' });
    await api.sendMessage({
      chat_id: chatId,
      text: `⏰ <b>Order delayed.</b>\n\nOrder: ${orderId.slice(-6)}\nDepartment: ${departmentId}`,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Error delaying order:', err);
  }
}
