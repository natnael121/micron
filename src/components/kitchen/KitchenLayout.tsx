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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-900/50">
            <CookingPot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-400 tracking-wider uppercase">{businessName}</h1>
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl text-white tracking-tight">{stationName}</span>
              <span className="px-2 py-0.5 bg-orange-600/20 text-orange-400 border border-orange-600/30 rounded text-xs font-semibold uppercase tracking-wider">
                KDS Active
              </span>
            </div>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div className="flex items-center space-x-8">
          <div className="hidden md:flex items-center space-x-2 text-slate-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
            <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="font-mono text-lg font-bold text-slate-200 min-w-[90px] text-center">
              {time}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/50 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
            title="Log out of station"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-semibold text-sm">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
};
