import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, Shield, X, Check } from 'lucide-react';
import { notificationSystemService } from '../services/notificationSystem';
import { CustomerNotificationPopup } from './CustomerNotificationPopup';
import { 
  CustomerNotificationPreferences, 
  NotificationSettings, 
  LiveNotification 
} from '../types/notifications';
import { useTranslation } from '../utils/translations';

interface CustomerNotificationManagerProps {
  userId: string;
  tableNumber: string;
  sessionId: string;
  language: 'en' | 'am';
}

export const CustomerNotificationManager: React.FC<CustomerNotificationManagerProps> = ({
  userId,
  tableNumber,
  sessionId,
  language,
}) => {
  const [preferences, setPreferences] = useState<CustomerNotificationPreferences | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [hasShownConsent, setHasShownConsent] = useState(false);
  const t = useTranslation(language);

  useEffect(() => {
    loadSettings();
    loadPreferences();
    setupNotificationListener();
  }, [userId, tableNumber, sessionId]);

  useEffect(() => {
    // Show consent modal if required and not already given
    if (settings?.requireConsent && !preferences?.consentGiven && !hasShownConsent) {
      setShowConsentModal(true);
      setHasShownConsent(true);
    }
  }, [settings, preferences, hasShownConsent]);

  const loadSettings = async () => {
    try {
      const settingsData = await notificationSystemService.getNotificationSettings(userId);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const preferencesData = await notificationSystemService.getCustomerPreferences(
        userId, 
        tableNumber, 
        sessionId
      );
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Error loading customer preferences:', error);
    }
  };

  const setupNotificationListener = () => {
    const unsubscribe = notificationSystemService.listenToLiveNotifications(
      userId,
      tableNumber,
      (notification: LiveNotification) => {
        // Check if customer has consented to notifications
        if (settings?.requireConsent && !preferences?.consentGiven) {
          return; // Don't show notification if consent not given
        }

        // Check notification type preferences
        if (preferences && !checkNotificationTypeAllowed(notification.type, preferences.preferences)) {
          return; // Don't show if type is disabled
        }

        setNotifications(prev => [...prev, notification]);
      }
    );

    return unsubscribe;
  };

  const checkNotificationTypeAllowed = (type: string, prefs: any): boolean => {
    switch (type) {
      case 'promotion':
        return prefs.promotions;
      case 'info':
        return prefs.generalInfo;
      case 'success':
      case 'warning':
        return prefs.orderUpdates;
      case 'error':
        return prefs.emergencyAlerts;
      default:
        return true;
    }
  };

  const handleConsentGiven = async (consent: boolean) => {
    try {
      const preferencesData: Omit<CustomerNotificationPreferences, 'id'> = {
        tableNumber,
        userId,
        sessionId,
        notificationsEnabled: consent,
        consentGiven: consent,
        consentTimestamp: new Date().toISOString(),
        preferences: settings?.defaultPreferences || {
          orderUpdates: true,
          promotions: false,
          generalInfo: true,
          emergencyAlerts: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await notificationSystemService.updateCustomerPreferences(preferencesData);
      await loadPreferences();
      setShowConsentModal(false);

      if (consent) {
        // Show welcome notification
        setNotifications([{
          id: 'welcome',
          userId,
          tableNumber,
          title: language === 'en' ? 'Notifications Enabled!' : 'ማሳወቂያዎች ተንቅተዋል!',
          message: language === 'en' 
            ? 'You\'ll receive updates about your orders and restaurant services.'
            : 'ስለ ትዕዛዝዎ እና የሬስቶራንት አገልግሎቶች ዝማኔዎችን ይቀበላሉ።',
          type: 'success',
          timestamp: new Date().toISOString(),
          ttl: new Date(Date.now() + 60000).toISOString(),
        }]);
      }
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const handleUpdatePreferences = async (newPreferences: any) => {
    try {
      if (preferences) {
        await notificationSystemService.updateCustomerPreferences({
          ...preferences,
          preferences: newPreferences,
        });
        await loadPreferences();
        setShowPreferencesModal(false);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <>
      {/* Notification Popups */}
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ top: `${1 + index * 6}rem` }}
          className="fixed right-4 z-50"
        >
          <CustomerNotificationPopup
            notification={notification}
            onDismiss={() => dismissNotification(notification.id)}
            onAction={notification.actionUrl ? () => window.open(notification.actionUrl, '_blank') : undefined}
            language={language}
          />
        </div>
      ))}

      {/* Notification Settings Button */}
      {preferences && (
        <button
          onClick={() => setShowPreferencesModal(true)}
          className="fixed bottom-24 right-4 z-40 bg-white border border-gray-300 rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
        >
          {preferences.notificationsEnabled ? (
            <Bell className="w-5 h-5 text-green-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
        </button>
      )}

      {/* Consent Modal */}
      {showConsentModal && settings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'Stay Updated' : 'ወቅታዊ ይሁኑ'}
              </h2>
              <p className="text-gray-600 text-sm">
                {settings.consentMessage}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {language === 'en' ? 'You\'ll receive notifications for:' : 'ማሳወቂያ የሚቀበሉባቸው:'}
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {language === 'en' ? 'Order confirmations and updates' : 'የትዕዛዝ ማረጋገጫዎች እና ዝማኔዎች'}</li>
                  <li>• {language === 'en' ? 'Payment confirmations' : 'የክፍያ ማረጋገጫዎች'}</li>
                  <li>• {language === 'en' ? 'Service updates' : 'የአገልግሎት ዝማኔዎች'}</li>
                  <li>• {language === 'en' ? 'Special offers (optional)' : 'ልዩ ቅናሾች (አማራጭ)'}</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  {settings.privacyPolicy}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleConsentGiven(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {language === 'en' ? 'No Thanks' : 'አይ አመሰግናለሁ'}
                </button>
                <button
                  onClick={() => handleConsentGiven(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>{language === 'en' ? 'Enable Notifications' : 'ማሳወቂያዎችን አንቃ'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferencesModal && preferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {language === 'en' ? 'Notification Preferences' : 'የማሳወቂያ ምርጫዎች'}
              </h2>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {language === 'en' ? 'Notifications' : 'ማሳወቂያዎች'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Enable or disable all notifications' : 'ሁሉንም ማሳወቂያዎች አንቃ ወይም አሰናክል'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {preferences.notificationsEnabled ? (
                    <Bell className="w-5 h-5 text-green-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <button
                    onClick={() => handleUpdatePreferences({
                      ...preferences.preferences,
                      enabled: !preferences.notificationsEnabled
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.notificationsEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notification Type Preferences */}
              {preferences.notificationsEnabled && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">
                    {language === 'en' ? 'Notification Types' : 'የማሳወቂያ አይነቶች'}
                  </h3>
                  
                  {Object.entries(preferences.preferences).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {key === 'orderUpdates' && (language === 'en' ? 'Order Updates' : 'የትዕዛዝ ዝማኔዎች')}
                          {key === 'promotions' && (language === 'en' ? 'Promotions & Offers' : 'ማስተዋወቂያዎች እና ቅናሾች')}
                          {key === 'generalInfo' && (language === 'en' ? 'General Information' : 'አጠቃላይ መረጃ')}
                          {key === 'emergencyAlerts' && (language === 'en' ? 'Emergency Alerts' : 'የአደጋ ጊዜ ማሳወቂያዎች')}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {key === 'orderUpdates' && (language === 'en' ? 'Order status and preparation updates' : 'የትዕዛዝ ሁኔታ እና ዝግጅት ዝማኔዎች')}
                          {key === 'promotions' && (language === 'en' ? 'Special deals and promotional offers' : 'ልዩ ቅናሾች እና ማስተዋወቂያ ቅናሾች')}
                          {key === 'generalInfo' && (language === 'en' ? 'Restaurant announcements and updates' : 'የሬስቶራንት ማስታወቂያዎች እና ዝማኔዎች')}
                          {key === 'emergencyAlerts' && (language === 'en' ? 'Important safety and service alerts' : 'አስፈላጊ ደህንነት እና አገልግሎት ማሳወቂያዎች')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUpdatePreferences({
                          ...preferences.preferences,
                          [key]: !enabled
                        })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          enabled ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Privacy Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">
                    {language === 'en' ? 'Privacy Information' : 'የግላዊነት መረጃ'}
                  </h4>
                </div>
                <p className="text-xs text-blue-800">
                  {settings?.privacyPolicy}
                </p>
                {settings?.retentionDays && (
                  <p className="text-xs text-blue-700 mt-2">
                    {language === 'en' 
                      ? `Data is retained for ${settings.retentionDays} days.`
                      : `መረጃ ለ${settings.retentionDays} ቀናት ይቀመጣል።`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};