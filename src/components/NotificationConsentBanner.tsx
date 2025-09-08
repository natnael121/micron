import React, { useState, useEffect } from 'react';
import { Bell, Shield, X, Check, Settings } from 'lucide-react';
import { notificationSystemService } from '../services/notificationSystem';
import { NotificationSettings, CustomerNotificationPreferences } from '../types/notifications';
import { useTranslation } from '../utils/translations';

interface NotificationConsentBannerProps {
  userId: string;
  tableNumber: string;
  sessionId: string;
  language: 'en' | 'am';
  onConsentGiven: (consent: boolean) => void;
}

export const NotificationConsentBanner: React.FC<NotificationConsentBannerProps> = ({
  userId,
  tableNumber,
  sessionId,
  language,
  onConsentGiven,
}) => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [preferences, setPreferences] = useState<CustomerNotificationPreferences | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslation(language);

  useEffect(() => {
    loadData();
  }, [userId, tableNumber, sessionId]);

  const loadData = async () => {
    try {
      const [settingsData, preferencesData] = await Promise.all([
        notificationSystemService.getNotificationSettings(userId),
        notificationSystemService.getCustomerPreferences(userId, tableNumber, sessionId)
      ]);
      
      setSettings(settingsData);
      setPreferences(preferencesData);
      
      // Show banner if consent is required and not yet given
      if (settingsData?.requireConsent && !preferencesData?.consentGiven) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error loading notification data:', error);
    }
  };

  const handleConsent = async (consent: boolean) => {
    setIsProcessing(true);
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
      onConsentGiven(consent);
      setIsVisible(false);
    } catch (error) {
      console.error('Error updating consent:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible || !settings) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">
              {language === 'en' ? 'Stay Updated with Your Order' : 'ስለ ትዕዛዝዎ ወቅታዊ ይሁኑ'}
            </h4>
            <p className="text-blue-100 text-xs leading-relaxed">
              {settings.consentMessage}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => handleConsent(false)}
            disabled={isProcessing}
            className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-white/30 transition-colors disabled:opacity-50 flex items-center space-x-1"
          >
            <X className="w-3 h-3" />
            <span>{language === 'en' ? 'No' : 'አይ'}</span>
          </button>
          
          <button
            onClick={() => handleConsent(true)}
            disabled={isProcessing}
            className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center space-x-1"
          >
            {isProcessing ? (
              <>
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{language === 'en' ? 'Enabling...' : 'በማንቃት ላይ...'}</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                <span>{language === 'en' ? 'Yes, Enable' : 'አዎ፣ አንቃ'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy Policy Link */}
      <div className="mt-3 pt-3 border-t border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-3 h-3 text-blue-200" />
            <span className="text-xs text-blue-200">
              {language === 'en' ? 'Your privacy is protected' : 'የእርስዎ ግላዊነት የተጠበቀ ነው'}
            </span>
          </div>
          <button
            onClick={() => {
              // Show privacy policy in a modal or alert
              alert(settings.privacyPolicy);
            }}
            className="text-xs text-blue-200 hover:text-white underline"
          >
            {language === 'en' ? 'Privacy Policy' : 'የግላዊነት ፖሊሲ'}
          </button>
        </div>
      </div>
    </div>
  );
};