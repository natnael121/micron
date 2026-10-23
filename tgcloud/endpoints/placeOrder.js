// tgcloud/endpoints/placeOrder.js
// Called from the Mini App via: Telegram.WebApp.Serverless.call('placeOrder', payload)
// https://core.telegram.org/bots/webapps#serverless

import { notifyNewOrder } from '../lib/notify.js';
import { getCafeTelegramSettings } from '../lib/firestore.js';

export default async function (payload, context) {
  const { order } = payload;

  if (!order || !order.tableNumber || !order.items?.length) {
    return { ok: false, error: 'Invalid order payload' };
  }

  try {
    const cafeId = order.cafeId || order.userId;
    let targetChatId = null;

    if (cafeId) {
      const settings = await getCafeTelegramSettings(cafeId);
      targetChatId = settings.adminChatId;
    }

    // Notify specific cafe's cashier/admin group for approval
    await notifyNewOrder(order, targetChatId);

    return { ok: true, message: 'Order sent for approval' };
  } catch (err) {
    console.error('placeOrder endpoint error:', err);
    return { ok: false, error: err.message };
  }
}
