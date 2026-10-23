// tgcloud/handlers/message.js
// Handles all incoming messages (commands from customers and staff)
// https://core.telegram.org/bots/serverless#handlers

import { api, db } from 'sdk';
import { sql } from 'sdk/db';
import { sessions } from '../schema.js';
import { CONFIG } from '../lib/config.js';

export default async function (message) {
  const { text, chat, from } = message;

  if (!text?.startsWith('/')) return;

  const parts = text.split(' ');
  const command = parts[0];
  const payload = parts.length > 1 ? parts.slice(1).join(' ') : null;

  switch (command) {
    case '/start':
      await handleStart(chat.id, from, payload);
      break;

    case '/menu':
      await handleMenu(chat.id, from);
      break;

    case '/status':
      await api.sendMessage({
        chat_id: chat.id,
        text: [
          '📊 <b>Bot Status</b>',
          '',
          '✅ <b>Online and operational</b>',
          `🤖 <b>Bot:</b> @tikur_menu_bot`,
          '🔗 <b>Platform:</b> Telegram Serverless (tgcloud)',
          `📱 <b>Mini App:</b> ${appUrl()}`,
        ].join('\n'),
        parse_mode: 'HTML',
      });
      break;

    case '/help':
      await api.sendMessage({
        chat_id: chat.id,
        text: [
          '🆘 <b>Help &amp; Commands</b>',
          '',
          '<b>Available Commands:</b>',
          '/start — Open the restaurant menu',
          '/menu — Open full menu',
          '/status — Check bot status',
          '/help — Show this help',
          '',
          '<b>Staff Notifications:</b>',
          '• Order approvals with ✅/❌ buttons',
          '• Payment confirmations with approve/reject',
          '• Waiter calls with acknowledgment',
          '• Kitchen orders with ready/delay buttons',
          '',
          '<b>Support:</b>',
          'Contact your restaurant admin for assistance.',
        ].join('\n'),
        parse_mode: 'HTML',
      });
      break;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function handleStart(chatId, from, payload) {
  let menuUrl = `${appUrl()}/menu`;
  let tableInfo = '';

  if (payload) {
    // payload format: cafeId_tableId  (set by QR code / deep link)
    const parts = payload.split('_');
    if (parts.length >= 2) {
      const cafeId  = parts[0];
      const tableId = parts.slice(1).join('_');
      menuUrl   = `${appUrl()}/menu/${cafeId}/table/${tableId}`;
      tableInfo = ` – Table #${tableId}`;

      // Save session in tgcloud DB
      await db.insert(sessions)
        .values({
          telegramId: from.id,
          cafeId,
          tableId,
          firstName:  from.first_name || '',
          username:   from.username   || '',
        })
        .onConflictDoUpdate({
          // Re-use existing row if same user+cafe+table
          target:    [sessions.telegramId, sessions.cafeId, sessions.tableId],
          set: {
            updatedAt: sql`(unixepoch())`,
          },
        })
        .run();
    }
  }

  const name = from?.first_name || 'there';

  await api.sendMessage({
    chat_id: chatId,
    text: [
      `👋 <b>Welcome ${name}!</b>`,
      '',
      `Tap the button below to open your interactive restaurant menu${tableInfo} and place your order right here inside Telegram.`,
    ].join('\n'),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        {
          text: `🍽️ Open Menu${tableInfo}`,
          web_app: { url: menuUrl },
        },
      ]],
    },
  });
}

async function handleMenu(chatId, from) {
  await api.sendMessage({
    chat_id: chatId,
    text: '🍽️ <b>Restaurant Menu</b>\n\nTap below to browse and order:',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📖 Open Full Menu',
          web_app: { url: `${appUrl()}/menu` },
        },
      ]],
    },
  });
}

function appUrl() {
  return CONFIG.APP_URL;
}
