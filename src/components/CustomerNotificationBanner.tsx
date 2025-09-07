import React, { useState } from 'react';
import { Bell, BellOff, X, Check } from 'lucide-react';
import { useCustomerNotifications } from '../hooks/useCustomerNotifications';
import { useTranslation } from '../utils/translations';

interface CustomerNotificationBannerProps {
  tableNumber: string;
  userId?: string;
  language: 'en' | 'am';
  businessName: string;
}

export const CustomerNotificationBanner: React.FC<CustomerNotificationBannerProps> = ({
  tableNumber,
  userId,
  language,
  businessName,
}) => {
  const { isSupported, isEnabled, requestPermission, testNotification } = useCustomerNotifications(tableNumber, userId);
  const [isVisible, setIsVisible] = useState(!isEnabled && isSupported);
  const [isRequesting, setIsRequesting] = useState(false);
  const t = useTranslation(language);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        setIsVisible(false);
        // Send welcome notification
        setTimeout(async () => {
          try {
            await testNotification();
          } catch (error) {
            console.error('Error sending welcome notification:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for this session
    sessionStorage.setItem('notificationBannerDismissed', 'true');
  };

  // Don't show if not supported, already enabled, or previously dismissed
  if (!isSupported || isEnabled || !isVisible) {
    return null;
  }

  // Check if previously dismissed in this session
  if (sessionStorage.getItem('notificationBannerDismissed')) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {language === 'en' ? 'Stay Updated!' : 'ወቅታዊ ይሁኑ!'}
            </h4>
            <p className="text-blue-100 text-xs">
              {language === 'en' 
                ? 'Get notified when your order is ready, payment is approved, and more!'
                : 'ትዕዛዝዎ ሲዘጋጅ፣ ክፍያዎ ሲፀድቅ እና ሌሎችም ማሳወቂያ ይቀበሉ!'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEnableNotifications}
            disabled={isRequesting}
            className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center space-x-1"
          >
            {isRequesting ? (
              <>
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{language === 'en' ? 'Enabling...' : 'በማንቃት ላይ...'}</span>
              </>
            ) : (
              <>
                <Bell className="w-3 h-3" />
                <span>{language === 'en' ? 'Enable' : 'አንቃ'}</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white p-1 rounded transition-colors"
            aria-label="Dismiss notification banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};