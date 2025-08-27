import React from 'react';
import { Bell, BellOff, TestTube, Check, X, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationSettings: React.FC = () => {
  const { 
    isSupported, 
    isEnabled, 
    permission, 
    requestPermission, 
    testNotification 
  } = useNotifications();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert('Notifications enabled successfully!');
    } else {
      alert('Notification permission denied. You can enable it in your browser settings.');
    }
  };

  const handleTestNotification = async () => {
    const success = await testNotification();
    if (!success) {
      alert('Failed to send test notification. Please check your browser settings.');
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">
            Web notifications are not supported in this browser
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isEnabled ? (
            <Bell className="w-5 h-5 text-green-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Web Notifications</h3>
            <p className="text-sm text-gray-600">
              Get instant alerts for new orders, payments, and waiter calls
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEnabled && (
            <button
              onClick={handleTestNotification}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <TestTube className="w-4 h-4" />
              <span>Test</span>
            </button>
          )}
          
          {!isEnabled && (
            <button
              onClick={handleEnableNotifications}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Bell className="w-4 h-4" />
              <span>Enable Notifications</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex items-center space-x-2">
            {isEnabled ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Enabled</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">
                  {permission === 'denied' ? 'Blocked' : 'Disabled'}
                </span>
              </>
            )}
          </div>
        </div>
        
        {permission === 'denied' && (
          <div className="mt-3 text-sm text-gray-600">
            <p className="mb-2">Notifications are blocked. To enable them:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Change notifications from "Block" to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">You'll receive notifications for:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">New orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Payment confirmations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Waiter calls</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Order status updates</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Low stock alerts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Day reports</span>
          </div>
        </div>
      </div>
    </div>
  );
};