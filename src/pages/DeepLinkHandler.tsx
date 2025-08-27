import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TelegramDeepLinkService } from '../utils/telegramDeepLink';

export const DeepLinkHandler: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    handleDeepLink();
  }, []);

  const handleDeepLink = async () => {
    // Check if this is a Telegram deep link callback
    const startParam = searchParams.get('start');
    if (startParam) {
      const params = TelegramDeepLinkService.parseStartParameter(startParam);
      if (params) {
        // Navigate to menu page with café and table info
        navigate(`/menu/${params.cafeId}/table/${params.tableId}`);
        return;
      }
    }

    // Check for fallback URL parameters
    const cafeId = searchParams.get('cafe');
    const tableId = searchParams.get('table');
    
    if (cafeId && tableId) {
      navigate(`/menu/${cafeId}/table/${tableId}`);
      return;
    }

    // If no valid parameters, redirect to home
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};