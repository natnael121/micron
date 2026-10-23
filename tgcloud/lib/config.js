// tgcloud/lib/config.js
// Platform configuration for Telegram Serverless modules

export const CONFIG = {
  // Primary: Vercel deployment (where the React app is actually hosted)
  // Fallback: tgcloud hosted frontend (https://app8620497591.tgcloud.ai)
  APP_URL: 'https://micron-dusky.vercel.app',
  FIREBASE_PROJECT_ID: 'menu-ordering-app-fe429',
  DEFAULT_ADMIN_CHAT_ID: -1002701066037,
  DEFAULT_KITCHEN_CHAT_ID: -1002660493020,
  DEFAULT_BAR_CHAT_ID: -1002859150516,
};
