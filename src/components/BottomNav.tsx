import React from 'react';
import { Home, ChefHat, Receipt, ShoppingCart, Settings, FileText, Info, Bell, BellOff } from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onWaiterCall: () => void;
  onBillClick: () => void;
  onCartClick: () => void;
  onSettingsClick: () => void;
  onAboutClick: () => void;
  cartItemCount: number;
  language: 'en' | 'am';
  notificationsEnabled?: boolean;
  onNotificationToggle?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onWaiterCall,
  onBillClick,
  onCartClick,
  onSettingsClick,
  onAboutClick,
  cartItemCount,
  language,
  notificationsEnabled = false,
  onNotificationToggle,
}) => {
  const t = useTranslation(language);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
            activeTab === 'home'
              ? 'text-yellow-400 bg-yellow-400/10'
              : 'text-gray-400 hover:text-yellow-400'
          }`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('home')}</span>
        </button>

        <button
          onClick={onAboutClick}
          className="flex flex-col items-center py-2 px-3 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
        >
          <Info className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('about')}</span>
        </button>

        <button
          onClick={onWaiterCall}
          className="flex flex-col items-center py-2 px-3 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
        >
          <ChefHat className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('waiter')}</span>
        </button>

        <button
          onClick={onCartClick}
          className="relative flex flex-col items-center py-2 px-3 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
        >
          <ShoppingCart className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('cart')}</span>
          {cartItemCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </div>
          )}
        </button>

        <button
          onClick={onBillClick}
          className="flex flex-col items-center py-2 px-3 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
        >
          <FileText className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('bill')}</span>
        </button>

        {onNotificationToggle && (
          <button
            onClick={onNotificationToggle}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              notificationsEnabled
                ? 'text-green-400 bg-green-400/10'
                : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
            }`}
          >
            {notificationsEnabled ? (
              <Bell className="w-6 h-6 mb-1" />
            ) : (
              <BellOff className="w-6 h-6 mb-1" />
            )}
            <span className="text-xs font-medium">
              {language === 'en' ? 'Alerts' : 'ማሳወቂያ'}
            </span>
          </button>
        )}

        <button
          onClick={onSettingsClick}
          className="flex flex-col items-center py-2 px-3 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
        >
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{t('settings')}</span>
        </button>
      </div>
    </div>
  );
};