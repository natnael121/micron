import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { OrderFeedback } from '../types';
import { useTranslation } from '../utils/translations';

interface FeedbackModalProps {
  orderId: string;
  tableNumber: string;
  sessionId?: string;
  customerInfo?: {
    name?: string;
    telegramUsername?: string;
    telegramPhoto?: string;
  };
  language: 'en' | 'am';
  onClose: () => void;
  onSubmit: (feedback: OrderFeedback & { sessionId?: string; customerInfo?: any }) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  orderId,
  tableNumber,
  sessionId,
  customerInfo,
  language,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslation(language);

  const handleSubmit = () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);

    const feedback: OrderFeedback = {
      orderId,
      tableNumber,
      rating,
      comment,
      timestamp: new Date().toISOString(),
      sessionId,
      customerInfo,
    };

    onSubmit(feedback);
    
    // Close after a brief delay to show submission state
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t('feedback')}</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Customer Info Display */}
        {customerInfo && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {customerInfo.telegramPhoto ? (
                <img 
                  src={customerInfo.telegramPhoto} 
                  alt={customerInfo.name || 'Customer'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">
                    {(customerInfo.name || customerInfo.telegramUsername || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {customerInfo.name || customerInfo.telegramUsername || 'Anonymous Customer'}
                </p>
                <p className="text-sm text-gray-500">Table {tableNumber}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              {t('rating')}
            </label>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                {rating >= 4 ? '😊 Thank you for the great rating!' :
                 rating >= 3 ? '👍 Thanks for your feedback!' :
                 '😔 We appreciate your honest feedback and will work to improve.'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-3">
              {t('comment')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder={language === 'en' ? 'Tell us about your experience...' : 'ስለ ተሞክሮዎ ይንገሩን...'}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Submitting...</span>
              </div>
            ) : (
              t('submit')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};