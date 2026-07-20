import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Clock, CookingPot } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const KitchenLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, restaurantOwner } = useAuth();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const businessName = restaurantOwner?.businessName || 'Restaurant';
  const stationName = user?.name || 'Kitchen Display';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col select-none">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <CookingPot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xs text-gray-500 tracking-wider uppercase">{businessName}</h1>
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl text-gray-900 tracking-tight">{stationName}</span>
              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold uppercase tracking-wider">
                KDS Active
              </span>
            </div>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="font-mono text-lg font-bold text-gray-700 min-w-[90px] text-center">
              {time}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
            title="Log out of station"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-semibold text-sm">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};
