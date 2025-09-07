import React from 'react';
import { Bell, X, Smartphone, CheckCircle } from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable: () => Promise<boolean>;
  language: 'en' | 'am';
  businessName: string;
  tableNumber: string;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onClose,
  onEnable,
  language,
  businessName,
  tableNumber,
}) => {
  const [isEnabling, setIsEnabling] = React.useState(false);
  const t = useTranslation(language);

  if (!isOpen) return null;

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const granted = await onEnable();
      if (granted) {
        onClose();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {language === 'en' ? 'Stay Updated' : 'ወቅታዊ ይሁኑ'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {language === 'en' 
              ? `Get instant notifications about your orders at ${businessName}. We'll let you know when:`
              : `በ${businessName} ስለ ትዕዛዝዎ ፈጣን ማሳወቂያ ይቀበሉ። የሚከተሉትን እናሳውቅዎታለን:`
            }
          </p>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">
                {language === 'en' ? 'Your order is confirmed' : 'ትዕዛዝዎ ተፀድቋል'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">
                {language === 'en' ? 'Food is being prepared' : 'ምግብ እየተዘጋጀ ነው'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">
                {language === 'en' ? 'Order is ready to serve' : 'ትዕዛዝ ለማቅረብ ዝግጁ ነው'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">
                {language === 'en' ? 'Payment is approved' : 'ክፍያ ተፀድቋል'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">
                {language === 'en' ? 'Waiter is coming' : 'አስተናጋጅ እየመጣ ነው'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-800">
                {language === 'en' 
                  ? 'Works on mobile and desktop browsers'
                  : 'በሞባይል እና ዴስክቶፕ አሳሾች ላይ ይሰራል'
                }
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              {language === 'en' ? 'Maybe Later' : 'ምናልባት በኋላ'}
            </button>
            <button
              onClick={handleEnable}
              disabled={isEnabling}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm flex items-center justify-center space-x-2"
            >
              {isEnabling ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{language === 'en' ? 'Enabling...' : 'በማንቃት ላይ...'}</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>{language === 'en' ? 'Enable Notifications' : 'ማሳወቂያዎችን አንቃ'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};