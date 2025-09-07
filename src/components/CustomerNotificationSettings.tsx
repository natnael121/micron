import React from 'react';
import { Bell, BellOff, TestTube, Check, X, AlertCircle, Smartphone } from 'lucide-react';
import { useCustomerNotifications } from '../hooks/useCustomerNotifications';
import { useTranslation } from '../utils/translations';

interface CustomerNotificationSettingsProps {
  tableNumber: string;
  userId?: string;
  language: 'en' | 'am';
}

export const CustomerNotificationSettings: React.FC<CustomerNotificationSettingsProps> = ({
  tableNumber,
  userId,
  language,
}) => {
  const { 
    isSupported, 
    isEnabled, 
    permission, 
    requestPermission, 
    testNotification 
  } = useCustomerNotifications(tableNumber, userId);
  const t = useTranslation(language);

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

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium text-sm">
            {language === 'en' 
              ? 'Web notifications are not supported in this browser'
              : 'በዚህ አሳሽ ውስጥ የድር ማሳወቂያዎች አይደገፉም'
            }
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isEnabled ? (
            <Bell className="w-5 h-5 text-green-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'Order Notifications' : 'የትዕዛዝ ማሳወቂያዎች'}
            </h3>
            <p className="text-sm text-gray-600">
              {language === 'en' 
                ? 'Get instant alerts about your orders and payments'
                : 'ስለ ትዕዛዝዎ እና ክፍያዎች ፈጣን ማሳወቂያ ይቀበሉ'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEnabled && (
            <button
              onClick={handleTestNotification}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <TestTube className="w-4 h-4" />
              <span>{language === 'en' ? 'Test' : 'ሞክር'}</span>
            </button>
          )}
          
          {!isEnabled && (
            <button
              onClick={handleEnableNotifications}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Bell className="w-4 h-4" />
              <span>{language === 'en' ? 'Enable' : 'አንቃ'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {language === 'en' ? 'Status:' : 'ሁኔታ:'}
          </span>
          <div className="flex items-center space-x-2">
            {isEnabled ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {language === 'en' ? 'Enabled' : 'ተንቅቷል'}
                </span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">
                  {permission === 'denied' 
                    ? (language === 'en' ? 'Blocked' : 'ታግዷል')
                    : (language === 'en' ? 'Disabled' : 'ተዘግቷል')
                  }
                </span>
              </>
            )}
          </div>
        </div>
        
        {permission === 'denied' && (
          <div className="mt-3 text-sm text-gray-600">
            <p className="mb-2">
              {language === 'en' 
                ? 'Notifications are blocked. To enable them:'
                : 'ማሳወቂያዎች ታግደዋል። ለማንቃት:'
              }
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>
                {language === 'en' 
                  ? 'Click the lock icon in your browser\'s address bar'
                  : 'በአሳሽዎ አድራሻ አሞሌ ውስጥ ያለውን የመቆለፊያ አዶ ይጫኑ'
                }
              </li>
              <li>
                {language === 'en' 
                  ? 'Change notifications from "Block" to "Allow"'
                  : 'ማሳወቂያዎችን ከ"አትፍቀድ" ወደ "ፍቀድ" ይቀይሩ'
                }
              </li>
              <li>
                {language === 'en' 
                  ? 'Refresh this page'
                  : 'ይህንን ገጽ ያድሱ'
                }
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">
          {language === 'en' ? 'You\'ll receive notifications for:' : 'ማሳወቂያ የሚቀበሉባቸው:'}
        </h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Order confirmations and approvals' : 'የትዕዛዝ ማረጋገጫዎች እና ፈቃዶች'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Kitchen preparation updates' : 'የኩሽና ዝግጅት ዝማኔዎች'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Food ready notifications' : 'ምግብ ዝግጁ ማሳወቂያዎች'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Payment confirmations' : 'የክፍያ ማረጋገጫዎች'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Waiter response updates' : 'የአስተናጋጅ ምላሽ ዝማኔዎች'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile-specific info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            {language === 'en' 
              ? 'Works on mobile and desktop browsers. Notifications will appear even when the page is closed.'
              : 'በሞባይል እና ዴስክቶፕ አሳሾች ላይ ይሰራል። ገጹ ሲዘጋም ማሳወቂያዎች ይታያሉ።'
            }
          </span>
        </div>
      </div>
    </div>
  );
};