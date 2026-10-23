import { DeepLinkParams, CafeTableSession, TelegramUser } from '../types';

export class TelegramDeepLinkService {
  private static readonly BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'the_last_micron_bot';
  private static readonly MINI_APP_NAME = import.meta.env.VITE_TELEGRAM_MINI_APP_NAME || 'menu';

  /**
   * Get configured bot username
   */
  static getBotUsername(): string {
    return this.BOT_USERNAME;
  }

  /**
   * Get configured mini app short name
   */
  static getMiniAppName(): string {
    return this.MINI_APP_NAME;
  }

  /**
   * Generate a Telegram Mini App direct link (https://t.me/bot/app?startapp=cafeId_tableId)
   */
  static generateMiniAppDirectLink(cafeId: string, tableId: string, botUsername?: string, appName?: string): string {
    const bot = (botUsername || this.BOT_USERNAME).replace(/^@/, '');
    const app = appName || this.MINI_APP_NAME;
    const startParam = `${cafeId}_${tableId}`;
    if (app) {
      return `https://t.me/${bot}/${app}?startapp=${startParam}`;
    }
    return `https://t.me/${bot}?start=${startParam}`;
  }

  /**
   * Generate a Telegram deep link protocol URL (tg://resolve?...)
   * This is what triggers the native Telegram app on iOS / Android
   */
  static generateNativeScheme(cafeId: string, tableId: string, botUsername?: string, appName?: string): string {
    const bot = (botUsername || this.BOT_USERNAME).replace(/^@/, '');
    const app = appName || this.MINI_APP_NAME;
    const startParam = `${cafeId}_${tableId}`;
    if (app) {
      return `tg://resolve?domain=${bot}&appname=${app}&startapp=${startParam}`;
    }
    return `tg://resolve?domain=${bot}&start=${startParam}`;
  }

  /**
   * Generate a standard Telegram bot deep link (https://t.me/bot?start=cafeId_tableId)
   * This is universal and works on ANY bot immediately without needing /newapp
   */
  static generateDeepLink(cafeId: string, tableId: string, botUsername?: string): string {
    const bot = (botUsername || this.BOT_USERNAME).replace(/^@/, '');
    const startParam = `${cafeId}_${tableId}`;
    return `https://t.me/${bot}?start=${startParam}`;
  }

  /**
   * Generate a Telegram native scheme bot link (tg://resolve?domain=bot&start=cafeId_tableId)
   */
  static generateBotStartScheme(cafeId: string, tableId: string, botUsername?: string): string {
    const bot = (botUsername || this.BOT_USERNAME).replace(/^@/, '');
    const startParam = `${cafeId}_${tableId}`;
    return `tg://resolve?domain=${bot}&start=${startParam}`;
  }

  /**
   * Generate fallback Web URL with café and table parameters
   */
  static generateFallbackUrl(cafeId: string, tableId: string, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/menu/${cafeId}/table/${tableId}`;
  }

  /**
   * Parse deep link start parameter to extract café and table IDs
   */
  static parseStartParameter(startParam: string): DeepLinkParams | null {
    if (!startParam) return null;
    
    const parts = startParam.split('_');
    if (parts.length < 2) return null;
    
    const cafeId = parts[0];
    const tableId = parts.slice(1).join('_');
    if (!cafeId || !tableId) return null;
    
    return { cafeId, tableId };
  }

  /**
   * Parse URL query parameters to extract café and table info
   */
  static parseUrlParams(url: string): DeepLinkParams | null {
    try {
      const urlObj = new URL(url);
      const cafeId = urlObj.searchParams.get('cafe') || urlObj.searchParams.get('userId');
      const tableId = urlObj.searchParams.get('table') || urlObj.searchParams.get('tableNumber');
      
      if (!cafeId || !tableId) return null;
      
      return { cafeId, tableId };
    } catch {
      return null;
    }
  }

  /**
   * Detect if the page is opened inside Telegram (Telegram WebApp or In-App Browser)
   */
  static isOpenedInTelegram(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for Telegram WebApp environment
    const tg = (window as any).Telegram?.WebApp;
    if (tg && (tg.initData || tg.platform || tg.version)) {
      return true;
    }
    
    // Check user agent for Telegram
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('telegram') || userAgent.includes('telegrambot')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get Telegram User if available inside Telegram WebApp
   */
  static getTelegramWebAppUser(): TelegramUser | null {
    if (typeof window === 'undefined') return null;
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser) return null;

    return {
      id: tgUser.id,
      first_name: tgUser.first_name || 'Guest',
      last_name: tgUser.last_name || '',
      username: tgUser.username || '',
      photo_url: tgUser.photo_url || '',
      auth_date: Math.floor(Date.now() / 1000),
      hash: '',
    };
  }

  /**
   * Get start parameter passed to Telegram WebApp (via ?startapp=... or WebApp initData)
   */
  static getTelegramStartParam(): string | null {
    if (typeof window === 'undefined') return null;

    // 1. From Telegram WebApp SDK
    const tgParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (tgParam) return tgParam;

    // 2. From URL search parameters (?tgWebAppStartParam=... or ?startapp=... or ?start=...)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlParam = searchParams.get('tgWebAppStartParam') ||
                       searchParams.get('startapp') ||
                       searchParams.get('start');
      if (urlParam) return urlParam;

      // 3. From URL hash parameters (#tgWebAppData=... or hash query)
      if (window.location.hash) {
        const hashStr = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashStr);
        const hashParam = hashParams.get('tgWebAppStartParam') || hashParams.get('start_param');
        if (hashParam) return hashParam;
      }
    } catch {
      // Fallback
    }

    return null;
  }

  /**
   * Initialize Telegram WebApp properties (ready, expand, viewport)
   */
  static initTelegramWebApp(): void {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        // Set header color to match app theme if supported
        if (tg.setHeaderColor) {
          tg.setHeaderColor('#16a34a');
        }
      } catch (e) {
        console.warn('Could not initialize Telegram WebApp API:', e);
      }
    }
  }

  /**
   * Create a session for café/table visit
   */
  static createSession(cafeId: string, tableId: string, telegramUser?: TelegramUser): CafeTableSession {
    return {
      cafeId,
      tableId,
      telegramUser,
      sessionId: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      isGuest: !telegramUser,
    };
  }

  /**
   * Generate a unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate Telegram login data (from widget or auth payload)
   */
  static validateTelegramAuth(authData: TelegramUser): boolean {
    try {
      if (!authData.id || !authData.first_name) {
        return false;
      }
      
      // If auth_date is present, verify freshness (24h)
      if (authData.auth_date) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = currentTime - authData.auth_date;
        if (timeDiff > 86400) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating Telegram auth:', error);
      return false;
    }
  }

  /**
   * Store session data in localStorage
   */
  static storeSession(session: CafeTableSession): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cafeTableSession', JSON.stringify(session));
    }
  }

  /**
   * Retrieve session data from localStorage
   */
  static getStoredSession(): CafeTableSession | null {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('cafeTableSession');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored session
   */
  static clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cafeTableSession');
    }
  }

  /**
   * Check if feedback was already submitted for this session
   */
  static hasFeedbackBeenSubmitted(sessionId: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(`feedback_${sessionId}`) === 'true';
  }

  /**
   * Mark feedback as submitted for this session
   */
  static markFeedbackSubmitted(sessionId: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`feedback_${sessionId}`, 'true');
    }
  }

  /**
   * Get session-based feedback key
   */
  static getFeedbackKey(sessionId: string): string {
    return `feedback_${sessionId}`;
  }
}