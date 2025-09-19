import React from 'react';
import { X, Globe, Utensils, Bell, BellOff, TestTube } from 'lucide-react';
import { AppSettings } from '../types';
import { useTranslation } from '../utils/translations';
import { useCustomerNotifications } from '../hooks/useCustomerNotifications';
import { CustomerNotificationSettings } from './CustomerNotificationSettings';

interface SettingsModalProps {
  settings: AppSettings;
  tableNumber: string;
  userId?: string;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  tableNumber,
  userId,
  onClose,
  onUpdateSettings,
}) => {
  const t = useTranslation(settings.language);
  const { 
    isSupported: notificationsSupported, 
    isEnabled: notificationsEnabled, 
    requestPermission,
    testNotification 
  } = useCustomerNotifications(tableNumber, userId);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert(t('notificationsEnabled') || 'Notifications enabled successfully!');
    } else {
      alert('Notification permission denied. You can enable it in your browser settings.');
    }
  };

  const handleTestNotification = async () => {
    const success = await testNotification();
    if (!success) {
      alert('Failed to send test notification. Please check your browser settings.');
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t('settings')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="flex items-center text-gray-700 font-medium mb-3">
              <Globe className="w-5 h-5 mr-2" />
              {t('language')}
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  settings.language === 'en'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'am' })}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  settings.language === 'am'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                አማርኛ
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          {notificationsSupported && (
            <div>
              <label className="flex items-center text-gray-700 font-medium mb-3">
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 mr-2 text-green-600" />
                ) : (
                  <BellOff className="w-5 h-5 mr-2 text-gray-400" />
                )}
                {settings.language === 'en' ? 'Notifications' : 'ማሳወቂያዎች'}
              </label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {settings.language === 'en' ? 'Order Updates' : 'የትዕዛዝ ዝማኔዎች'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {settings.language === 'en' 
                        ? 'Get notified about order status changes'
                        : 'ስለ ትዕዛዝ ሁኔታ ለውጦች ማሳወቂያ ይቀበሉ'
                      }
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    notificationsEnabled ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                
                <div className="flex space-x-2">
                  {!notificationsEnabled ? (
                    <button
                      onClick={handleEnableNotifications}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Bell className="w-4 h-4" />
                      <span>{settings.language === 'en' ? 'Enable' : 'አንቃ'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleTestNotification}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <TestTube className="w-4 h-4" />
                      <span>{settings.language === 'en' ? 'Test' : 'ሞክር'}</span>
                    </button>
                  )}
                </div>
                
                {notificationsEnabled && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-800">
                      {settings.language === 'en' 
                        ? '✅ You\'ll receive notifications about your orders, payments, and waiter responses.'
                        : '✅ ስለ ትዕዛዝዎ፣ ክፍያዎች እና የአስተናጋጅ ምላሾች ማሳወቂያ ይቀበላሉ።'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Notifications Section */}
          <CustomerNotificationSettings
            tableNumber={tableNumber}
            userId={userId}
            language={settings.language}
          />
          <div>
            <label className="flex items-center text-gray-700 font-medium mb-3">
              <Utensils className="w-5 h-5 mr-2" />
              {t('orderType')}
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => onUpdateSettings({ orderType: 'dine-in' })}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  settings.orderType === 'dine-in'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('dineIn')}
              </button>
              <button
                onClick={() => onUpdateSettings({ orderType: 'takeaway' })}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  settings.orderType === 'takeaway'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('takeaway')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};