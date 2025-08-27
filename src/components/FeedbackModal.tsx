import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { OrderFeedback } from '../types';
import { useTranslation } from '../utils/translations';

interface FeedbackModalProps {
  orderId: string;
  tableNumber: string;
  language: 'en' | 'am';
  onClose: () => void;
  onSubmit: (feedback: OrderFeedback) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  orderId,
  tableNumber,
  language,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const t = useTranslation(language);

  const handleSubmit = () => {
    if (rating === 0) return;

    const feedback: OrderFeedback = {
      orderId,
      tableNumber,
      rating,
      comment,
      timestamp: new Date().toISOString(),
    };

    onSubmit(feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t('feedback')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

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
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-3">
              {t('comment')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder={language === 'en' ? 'Tell us about your experience...' : 'ስለ ተሞክሮዎ ይንገሩን...'}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
};