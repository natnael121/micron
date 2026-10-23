// tgcloud/endpoints/notifyWaiter.js
// Called from the Mini App when a customer presses "Call Waiter"
// via: Telegram.WebApp.Serverless.call('notifyWaiter', { tableNumber, cafeId })

import { notifyWaiterCall } from '../lib/notify.js';
import { getCafeTelegramSettings } from '../lib/firestore.js';

export default async function (payload, context) {
  const { tableNumber, cafeId, waiterChatId, waiterId, waiterName } = payload;

  if (!tableNumber) {
    return { ok: false, error: 'tableNumber is required' };
  }

  try {
    let fallbackAdminChatId = null;
    if (cafeId) {
      const settings = await getCafeTelegramSettings(cafeId);
      fallbackAdminChatId = settings.adminChatId;
    }

    await notifyWaiterCall(
      tableNumber,
      waiterChatId,
      waiterId || 'unknown',
      waiterName || 'Staff',
      fallbackAdminChatId
    );
    return { ok: true, message: `Waiter notified for table ${tableNumber}` };
  } catch (err) {
    console.error('notifyWaiter endpoint error:', err);
    return { ok: false, error: err.message };
  }
}
