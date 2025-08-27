import React, { useEffect, useRef } from 'react';
import { TelegramUser } from '../types';

interface TelegramLoginWidgetProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  onError?: (error: string) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;
  usePic?: boolean;
  className?: string;
}

export const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  botName,
  onAuth,
  onError,
  buttonSize = 'large',
  cornerRadius = 10,
  requestAccess = true,
  usePic = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing widget
    containerRef.current.innerHTML = '';

    // Create script element for Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess ? 'write' : '');
    script.setAttribute('data-userpic', usePic.toString());
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    // Create global callback function
    (window as any).onTelegramAuth = (user: TelegramUser) => {
      try {
        // Validate the auth data before proceeding
        const { TelegramDeepLinkService } = require('../utils/telegramDeepLink');
        if (TelegramDeepLinkService.validateTelegramAuth(user)) {
          onAuth(user);
        } else {
          onError?.('Invalid authentication data');
        }
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    containerRef.current.appendChild(script);

    // Cleanup function
    return () => {
      if ((window as any).onTelegramAuth) {
        delete (window as any).onTelegramAuth;
      }
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, onAuth, onError]);

  return (
    <div className={`telegram-login-widget ${className}`}>
      <div ref={containerRef} />
    </div>
  );
};