import React from 'react';
import { X, MapPin, Phone, Mail, Clock, Star, Utensils, Wifi, ExternalLink } from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface AboutModalProps {
  businessInfo: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
      whatsapp?: string;
    };
    operatingHours?: {
      monday?: string;
      tuesday?: string;
      wednesday?: string;
      thursday?: string;
      friday?: string;
      saturday?: string;
      sunday?: string;
    };
    features?: string[];
    specialMessage?: string;
  };
  language: 'en' | 'am';
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  businessInfo,
  language,
  onClose,
}) => {
  const t = useTranslation(language);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-md max-h-[90vh] rounded-3xl overflow-hidden animate-slide-up flex flex-col shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-green-600 to-green-700 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full p-2 hover:bg-black/30 transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {businessInfo.logo ? (
                <img 
                  src={businessInfo.logo} 
                  alt={businessInfo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {businessInfo.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{businessInfo.name}</h2>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white/80 text-sm ml-2">5.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
              <Utensils className="w-5 h-5 text-green-400" />
              <span>{t('aboutUs')}</span>
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {businessInfo.description || t('defaultDescription')}
            </p>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-white font-semibold mb-3">{t('contactInfo')}</h3>
            <div className="space-y-3">
              {businessInfo.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-300 text-sm">{businessInfo.address}</p>
                  </div>
                </div>
              )}

              {businessInfo.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <a 
                    href={`tel:${businessInfo.phone}`}
                    className="text-green-400 text-sm hover:text-green-300 transition-colors"
                  >
                    {businessInfo.phone}
                  </a>
                </div>
              )}

              {businessInfo.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <a 
                    href={`mailto:${businessInfo.email}`}
                    className="text-green-400 text-sm hover:text-green-300 transition-colors"
                  >
                    {businessInfo.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-400" />
              <span>{t('operatingHours')}</span>
            </h3>
            <div className="space-y-2">
              {businessInfo.operatingHours ? (
                Object.entries(businessInfo.operatingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{t(day as keyof typeof translations.en)}</span>
                    <span className="text-gray-300">{hours}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('monday')} - {t('friday')}</span>
                    <span className="text-gray-300">9:00 AM - 10:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('saturday')} - {t('sunday')}</span>
                    <span className="text-gray-300">10:00 AM - 11:00 PM</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-3">{t('features')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {(businessInfo.features || ['Free WiFi', 'Fresh Food', 'Fast Service', 'Top Rated']).map((feature, index) => {
                const getFeatureIcon = (feature: string) => {
                  switch (feature.toLowerCase()) {
                    case 'free wifi': return <Wifi className="w-4 h-4 text-green-400" />;
                    case 'fresh food': return <Utensils className="w-4 h-4 text-green-400" />;
                    case 'fast service': return <Clock className="w-4 h-4 text-green-400" />;
                    case 'top rated': return <Star className="w-4 h-4 text-green-400" />;
                    default: return <Star className="w-4 h-4 text-green-400" />;
                  }
                };
                
                return (
                  <div key={index} className="flex items-center space-x-2 bg-gray-800 p-3 rounded-lg">
                    {getFeatureIcon(feature)}
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social Media */}
          {businessInfo.socialMedia && Object.values(businessInfo.socialMedia).some(link => link) && (
            <div>
              <h3 className="text-white font-semibold mb-3">Follow Us</h3>
              <div className="grid grid-cols-3 gap-3">
                {businessInfo.socialMedia.facebook && (
                  <a
                    href={businessInfo.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 p-3 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <span className="text-white font-bold text-sm">f</span>
                  </a>
                )}
                {businessInfo.socialMedia.instagram && (
                  <a
                    href={businessInfo.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-lg flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-colors"
                  >
                    <span className="text-white font-bold text-sm">📷</span>
                  </a>
                )}
                {businessInfo.socialMedia.twitter && (
                  <a
                    href={businessInfo.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-400 p-3 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors"
                  >
                    <span className="text-white font-bold text-sm">🐦</span>
                  </a>
                )}
                {businessInfo.socialMedia.tiktok && (
                  <a
                    href={businessInfo.socialMedia.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black p-3 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-white font-bold text-sm">🎵</span>
                  </a>
                )}
                {businessInfo.socialMedia.youtube && (
                  <a
                    href={businessInfo.socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 p-3 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    <span className="text-white font-bold text-sm">▶️</span>
                  </a>
                )}
                {businessInfo.socialMedia.whatsapp && (
                  <a
                    href={`https://wa.me/${businessInfo.socialMedia.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 p-3 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                  >
                    <span className="text-white font-bold text-sm">💬</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Special Message */}
          {(businessInfo.specialMessage || t('specialMessage')) && (
            <div className="bg-gradient-to-r from-green-600/20 to-green-700/20 p-4 rounded-xl border border-green-600/30">
              <p className="text-green-300 text-sm text-center font-medium">
                {businessInfo.specialMessage || t('specialMessage')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};