import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TelegramDeepLinkService } from '../utils/telegramDeepLink';
import { UtensilsCrossed, Send, Globe, ArrowRight, Sparkles } from 'lucide-react';

export const ScanGateway: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cafeId = searchParams.get('cafe') || searchParams.get('userId') || '';
  const tableNumber = searchParams.get('table') || searchParams.get('tableNumber') || '';
  const customBot = searchParams.get('bot') || undefined;

  const [_status, setStatus] = useState<'checking' | 'redirecting_tg' | 'fallback_web'>('checking');
  const [progress, setProgress] = useState(0);
  const [hasTriggeredTg, setHasTriggeredTg] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const botUsername = customBot || TelegramDeepLinkService.getBotUsername();
  const miniAppName = TelegramDeepLinkService.getMiniAppName();

  const tgDirectLink = TelegramDeepLinkService.generateMiniAppDirectLink(cafeId, tableNumber, botUsername, miniAppName);
  const tgNativeScheme = TelegramDeepLinkService.generateNativeScheme(cafeId, tableNumber, botUsername, miniAppName);
  const tgBotLink = TelegramDeepLinkService.generateDeepLink(cafeId, tableNumber, botUsername);
  const tgBotScheme = TelegramDeepLinkService.generateBotStartScheme(cafeId, tableNumber, botUsername);
  const webFallbackUrl = `/menu/${cafeId}/table/${tableNumber}?web=true`;

  const goToWeb = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(webFallbackUrl, { replace: true });
  };

  const openTelegram = () => {
    setStatus('redirecting_tg');
    // Try native app scheme first, then direct link
    window.location.href = tgNativeScheme;
    setTimeout(() => {
      window.location.href = tgBotScheme;
    }, 400);
    setTimeout(() => {
      window.location.href = tgDirectLink;
    }, 800);
    setTimeout(() => {
      window.location.href = tgBotLink;
    }, 1200);
  };

  useEffect(() => {
    // If no cafeId or tableNumber, redirect to home
    if (!cafeId || !tableNumber) {
      navigate('/', { replace: true });
      return;
    }

    // 1. If already inside Telegram WebApp, skip gateway and open menu immediately!
    if (TelegramDeepLinkService.isOpenedInTelegram()) {
      navigate(webFallbackUrl, { replace: true });
      return;
    }

    // 2. If opened in a regular mobile browser from a QR scan:
    // Try to launch Telegram Mini App automatically once
    if (!hasTriggeredTg) {
      setHasTriggeredTg(true);
      setStatus('redirecting_tg');

      // Attempt to invoke Telegram app
      try {
        window.location.href = tgNativeScheme;
      } catch (err) {
        console.warn('Could not launch tg scheme directly:', err);
      }

      // If user switches to Telegram, document becomes hidden
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Telegram opened! Stop timer
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Start a smooth countdown to Web Menu fallback
      // If Telegram is not installed, or user doesn't switch, automatically proceed to web
      const startTime = Date.now();
      const duration = 2000; // 2.0 seconds fallback

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(100, Math.round((elapsed / duration) * 100));
        setProgress(currentProgress);

        if (elapsed >= duration) {
          if (timerRef.current) clearInterval(timerRef.current);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          goToWeb();
        }
      }, 50);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [cafeId, tableNumber, hasTriggeredTg]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-center">
        {/* Table Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-medium mb-6">
          <UtensilsCrossed className="w-4 h-4" />
          <span>Table #{tableNumber}</span>
        </div>

        {/* Dynamic Icon Animation */}
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-500 to-blue-500 opacity-20 animate-ping" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <Send className="w-10 h-10 text-white transform -rotate-12 translate-x-0.5" />
          </div>
        </div>

        {/* Headings */}
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Opening Restaurant Menu
        </h1>
        <p className="text-gray-300 text-sm mb-6">
          Checking for Telegram on your device to load your interactive Mini App...
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-6">
          <span>Launching Telegram</span>
          <span>Web fallback in {Math.max(0, Math.ceil((100 - progress) * 0.02))}s</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={openTelegram}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>Open in Telegram Mini App</span>
          </button>

          <button
            onClick={goToWeb}
            className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer"
          >
            <Globe className="w-5 h-5 text-gray-300" />
            <span>Continue in Web Browser</span>
            <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-white/10 text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>If Telegram isn't installed, the web menu opens automatically.</span>
        </div>
      </div>
    </div>
  );
};
