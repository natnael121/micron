import { DeepLinkParams, CafeTableSession, TelegramUser } from '../types';

export class TelegramDeepLinkService {
  private static readonly FALLBACK_URL = 'https://yourdomain.com/menu';
  private static readonly BOT_USERNAME = 'YourBot'; // Replace with your actual bot username

  /**
   * Generate a Telegram deep link for a specific café and table
   */
  static generateDeepLink(cafeId: string, tableId: string, botUsername?: string): string {
    const bot = botUsername || this.BOT_USERNAME;
    const startParam = `${cafeId}_${tableId}`;
    return `https://t.me/${bot}?start=${startParam}`;
  }

  /**
   * Generate fallback URL with café and table parameters
   */
  static generateFallbackUrl(cafeId: string, tableId: string, baseUrl?: string): string {
    const base = baseUrl || this.FALLBACK_URL;
    return `${base}?cafe=${cafeId}&table=${tableId}`;
  }

  /**
   * Parse deep link start parameter to extract café and table IDs
   */
  static parseStartParameter(startParam: string): DeepLinkParams | null {
    if (!startParam) return null;
    
    const parts = startParam.split('_');
    if (parts.length !== 2) return null;
    
    const [cafeId, tableId] = parts;
    if (!cafeId || !tableId) return null;
    
    return { cafeId, tableId };
  }

  /**
   * Parse URL query parameters to extract café and table info
   */
  static parseUrlParams(url: string): DeepLinkParams | null {
    try {
      const urlObj = new URL(url);
      const cafeId = urlObj.searchParams.get('cafe');
      const tableId = urlObj.searchParams.get('table');
      
      if (!cafeId || !tableId) return null;
      
      return { cafeId, tableId };
    } catch {
      return null;
    }
  }

  /**
   * Detect if the page is opened inside Telegram
   */
  static isOpenedInTelegram(): boolean {
    // Check for Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      return true;
    }
    
    // Check user agent for Telegram
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      return userAgent.includes('telegram');
    }
    
    return false;
  }

  /**
   * Check if Telegram is installed on the device
   */
  static isTelegramInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      // Try to open Telegram deep link and detect if it succeeds
      const testLink = 'tg://resolve?domain=telegram';
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = testLink;
      
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          document.body.removeChild(iframe);
          resolve(false);
        }
      }, 1000);

      iframe.onload = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          resolve(true);
        }
      };

      document.body.appendChild(iframe);
    });
  }

  /**
   * Redirect to appropriate URL based on Telegram availability
   */
  static async handleRedirect(cafeId: string, tableId: string, botUsername?: string, fallbackUrl?: string): Promise<void> {
    const isTelegramInstalled = await this.isTelegramInstalled();
    
    if (isTelegramInstalled) {
      const deepLink = this.generateDeepLink(cafeId, tableId, botUsername);
      window.location.href = deepLink;
    } else {
      const fallback = this.generateFallbackUrl(cafeId, tableId, fallbackUrl);
      window.location.href = fallback;
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
   * Validate Telegram login data
   */
  static validateTelegramAuth(authData: TelegramUser): boolean {
    try {
      // Basic validation - check required fields and auth_date
      if (!authData.hash || !authData.auth_date || !authData.id || !authData.first_name) {
        return false;
      }
      
      // Check if auth_date is within last 24 hours
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = currentTime - authData.auth_date;
      
      if (timeDiff > 86400) { // 24 hours
        return false;
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
    
    const feedbackStatus = localStorage.getItem(`feedback_${sessionId}`);
    return feedbackStatus === 'true';
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