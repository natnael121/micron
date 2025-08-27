import React from 'react';
import { Wifi } from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface TableHeaderProps {
  tableNumber: string;
  language: 'en' | 'am';
  orderType: 'dine-in' | 'takeaway';
  businessName?: string;
  businessLogo?: string;
  customerInfo?: {
    name?: string;
    username?: string;
    photo?: string;
  };
}

export const TableHeader: React.FC<TableHeaderProps> = ({ 
  tableNumber, 
  language, 
  orderType,
  businessName = 'Restaurant',
  businessLogo,
  customerInfo
}) => {
  const t = useTranslation(language);

  return (
    <div className="bg-gray-900 text-white px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {businessLogo ? (
              <img 
                src={businessLogo} 
                alt={businessName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {businessName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{businessName}</h1>
            <p className="text-gray-400 text-sm">
              {customerInfo?.name ? `Welcome, ${customerInfo.name}!` : 'Welcome to our restaurant'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          {customerInfo?.photo && (
            <div className="w-8 h-8 rounded-full overflow-hidden mb-2 ml-auto">
              <img 
                src={customerInfo.photo} 
                alt={customerInfo.name || 'Customer'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center space-x-2 text-gray-400 text-sm mb-1">
            <Wifi className="w-4 h-4" />
            <span>Connected</span>
          </div>
          <div className="text-white font-medium">
            {t('table')} {tableNumber}
          </div>
        </div>
      </div>
    </div>
  );
};