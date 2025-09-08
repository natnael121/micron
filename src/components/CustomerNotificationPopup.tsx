import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, Info, Gift, AlertCircle } from 'lucide-react';
import { LiveNotification } from '../types/notifications';

interface CustomerNotificationPopupProps {
  notification: LiveNotification;
  onDismiss: () => void;
  onAction?: () => void;
  language: 'en' | 'am';
}

export const CustomerNotificationPopup: React.FC<CustomerNotificationPopupProps> = ({
  notification,
  onDismiss,
  onAction,
  language,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Auto-dismiss after 10 seconds for non-critical notifications
    if (notification.type !== 'error' && notification.type !== 'warning') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notification.type]);

  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'promotion':
        return <Gift className="w-6 h-6 text-purple-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'promotion':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getAccentColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'promotion':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ${
      isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
    }`}>
      <div className={`${getBackgroundColor()} border rounded-xl shadow-lg overflow-hidden`}>
        {/* Accent bar */}
        <div className={`${getAccentColor()} h-1 w-full`} />
        
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image */}
              {notification.imageUrl && (
                <div className="mt-3">
                  <img
                    src={notification.imageUrl}
                    alt="Notification"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Action Button */}
              {notification.actionText && (
                <div className="mt-3">
                  <button
                    onClick={handleAction}
                    className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      notification.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                      notification.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                      notification.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                      notification.type === 'promotion' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                      'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {notification.actionText}
                  </button>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-xs text-gray-500">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};