import React from 'react';
import { X, Globe, Utensils } from 'lucide-react';
import { AppSettings } from '../types';
import { useTranslation } from '../utils/translations';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onUpdateSettings,
}) => {
  const t = useTranslation(settings.language);

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