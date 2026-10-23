// tgcloud/endpoints/confirmPayment.js
// Called from the Mini App when customer submits a payment screenshot
// via: Telegram.WebApp.Serverless.call('confirmPayment', { confirmation })

import { notifyPaymentConfirmation } from '../lib/notify.js';
import { getCafeTelegramSettings } from '../lib/firestore.js';

export default async function (payload, context) {
  const { confirmation } = payload;

  if (!confirmation?.tableNumber || !confirmation?.amount) {
    return { ok: false, error: 'Invalid payment confirmation payload' };
  }

  try {
    const cafeId = confirmation.cafeId || confirmation.userId;
    let targetChatId = null;

    if (cafeId) {
      const settings = await getCafeTelegramSettings(cafeId);
      targetChatId = settings.adminChatId;
    }

    await notifyPaymentConfirmation(confirmation, targetChatId);
    return { ok: true, message: 'Payment confirmation sent to admin' };
  } catch (err) {
    console.error('confirmPayment endpoint error:', err);
    return { ok: false, error: err.message };
  }
}
