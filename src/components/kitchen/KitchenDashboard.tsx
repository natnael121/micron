import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { Order, MenuItem } from '../../types';
import { Clock, CookingPot, Check, RefreshCw, Volume2, VolumeX, History, ListFilter } from 'lucide-react';

export const KitchenDashboard: React.FC = () => {
  const { user, getRestaurantId } = useAuth();
  const restaurantId = getRestaurantId();
  const stationId = user?.departmentId || user?.id || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Keep track of active ticket IDs to trigger sound alerts for new arrivals
  const activeTicketIdsRef = useRef<Set<string>>(new Set());

  // Local state for struck-through item IDs per order (KDS item checkoff)
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<string, boolean>>>({});

  // Web Audio API chime synthesizer
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Chime note 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.35);

      // Chime note 2 (slightly offset)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc2.start(audioCtx.currentTime + 0.15);
      osc2.stop(audioCtx.currentTime + 0.55);
    } catch (e) {
      console.error("Audio Context playback failed:", e);
    }
  };

  // Ref so the order subscription always sees the latest menu items without re-subscribing
  const menuItemsRef = useRef<MenuItem[]>([]);
  menuItemsRef.current = menuItems;

  // Effect 1: load menu items once (or when restaurantId changes)
  useEffect(() => {
    if (!restaurantId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const items = await firebaseService.getMenuItems(restaurantId);
        setMenuItems(items);
      } catch (err) {
        console.error('Error loading menu items:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantId]);

  // Effect 2: subscribe to live orders (separate from menu item loading so it never re-loops)
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = firebaseService.listenToActiveOrders(restaurantId, (liveOrders) => {
      setOrders(liveOrders);

      // Filter active orders belonging to this station to compare for new alerts
      const activeStationOrders = liveOrders.filter(order => {
        const hasStationItems = order.items.some(item => {
          const menuItem = menuItemsRef.current.find(mi => mi.id === item.id);
          return menuItem?.department === stationId;
        });
        const isCompleted = order.completedDepartments?.includes(stationId);
        const isActiveStatus = ['pending', 'confirmed', 'preparing', 'approved'].includes(order.status);
        return hasStationItems && !isCompleted && isActiveStatus;
      });

      // Detect newly arrived tickets
      let hasNewTicket = false;
      const currentIds = new Set<string>();

      activeStationOrders.forEach(o => {
        currentIds.add(o.id);
        if (!activeTicketIdsRef.current.has(o.id)) {
          hasNewTicket = true;
        }
      });

      activeTicketIdsRef.current = currentIds;

      if (hasNewTicket) {
        playNotificationSound();
      }
    });

    return () => unsubscribe();
  }, [restaurantId, stationId]);

  // Map order items to check if they belong to this station
  const getStationItems = (order: Order) => {
    return order.items.filter(item => {
      const menuItem = menuItems.find(mi => mi.id === item.id);
      return menuItem?.department === stationId;
    });
  };

  // Toggle item check-off line in the ticket UI
  const toggleItemChecked = (orderId: string, itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [itemId]: !(prev[orderId]?.[itemId])
      }
    }));
  };

  // Mark department preparation as complete on the ticket
  const handleCompleteStationTicket = async (order: Order) => {
    try {
      const completed = order.completedDepartments || [];
      if (!completed.includes(stationId)) {
        const newCompleted = [...completed, stationId];

        // Find all departments that have items in this order
        const departmentsInOrder = Array.from(new Set(
          order.items
            .map(item => menuItems.find(mi => mi.id === item.id)?.department)
            .filter((dept) => dept !== undefined)
        ));

        const allDone = departmentsInOrder.every(deptId => newCompleted.includes(deptId));

        const updates: any = {
          completedDepartments: newCompleted
        };

        if (allDone) {
          updates.status = 'ready'; // Mark whole order ready
        } else if (order.status === 'confirmed' || order.status === 'approved' || order.status === 'pending') {
          updates.status = 'preparing';
        }

        await firebaseService.updateOrder(order.id, updates);
      }
    } catch (err) {
      console.error('Error completing ticket:', err);
      alert('Failed to complete ticket. Please try again.');
    }
  };


  // Calculate ticket elapsed time in minutes
  const getElapsedTime = (timestamp: string) => {
    const elapsedMs = Date.now() - new Date(timestamp).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  // Color coding based on KDS standards
  const getTicketColorClasses = (elapsedMinutes: number) => {
    if (elapsedMinutes >= 12) {
      return {
        header: 'bg-red-950 border-red-800 text-red-100',
        body: 'bg-slate-900 border-red-900/40',
        badge: 'bg-red-500/20 text-red-400 border border-red-500/30'
      };
    }
    if (elapsedMinutes >= 6) {
      return {
        header: 'bg-amber-950 border-amber-800 text-amber-100',
        body: 'bg-slate-900 border-amber-900/40',
        badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      };
    }
    return {
      header: 'bg-slate-800 border-slate-700 text-slate-100',
      body: 'bg-slate-900 border-slate-800',
      badge: 'bg-slate-800 text-slate-400 border border-slate-700'
    };
  };

  // Filter orders according to selected tab
  const filteredOrders = orders.filter(order => {
    const stationItems = getStationItems(order);
    if (stationItems.length === 0) return false;

    const isCompleted = order.completedDepartments?.includes(stationId);

    if (activeTab === 'active') {
      const isActiveStatus = ['pending', 'confirmed', 'preparing', 'approved'].includes(order.status);
      return isActiveStatus && !isCompleted;
    } else {
      // History: show completed tickets within the last 4 hours
      const elapsedMs = Date.now() - new Date(order.timestamp).getTime();
      const withinFourHours = elapsedMs < 4 * 60 * 60 * 1000;
      return isCompleted && withinFourHours;
    }
  });

  // Active tickets helper to show current stats
  const activeTicketsCount = orders.filter(order => {
    const isCompleted = order.completedDepartments?.includes(stationId);
    const isActiveStatus = ['pending', 'confirmed', 'preparing', 'approved'].includes(order.status);
    return getStationItems(order).length > 0 && !isCompleted && isActiveStatus;
  }).length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
          <p className="text-slate-400 font-medium">Synchronizing station data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
      {/* Sub-Header bar */}
      <div className="bg-slate-900/50 border-b border-slate-850 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all duration-150 ${activeTab === 'active'
              ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-950/40'
              : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
              }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Active Tickets ({activeTicketsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all duration-150 ${activeTab === 'history'
              ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-950/40'
              : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
              }`}
          >
            <History className="w-4 h-4" />
            <span>History (Last 4h)</span>
          </button>
        </div>

        {/* Sound toggle controls */}
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            playNotificationSound();
          }}
          className={`p-2.5 rounded-xl border transition-all duration-150 ${soundEnabled
            ? 'bg-slate-850 border-slate-700 text-green-400 hover:bg-slate-800'
            : 'bg-slate-850 border-slate-700 text-slate-500 hover:bg-slate-850'
            }`}
          title={soundEnabled ? 'Disable Chime Sound' : 'Enable Chime Sound'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Tickets Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <CookingPot className="w-16 h-16 text-slate-700 mb-4 stroke-[1.5]" />
            <h3 className="text-xl font-bold text-slate-400 mb-1">No orders in queue</h3>
            <p className="text-sm text-slate-500">
              {activeTab === 'active'
                ? 'Incoming orders for this station will appear here.'
                : 'Completed tickets from the last 4 hours will display here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {filteredOrders.map(order => {
              const stationItems = getStationItems(order);
              const elapsedMinutes = getElapsedTime(order.timestamp);
              const theme = getTicketColorClasses(elapsedMinutes);

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border overflow-hidden shadow-lg transition-transform duration-200 hover:-translate-y-0.5 flex flex-col ${theme.body}`}
                >
                  {/* Ticket Header */}
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${theme.header}`}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black tracking-tight">Table {order.tableNumber}</span>
                        <span className="text-xs opacity-75 font-mono">#{order.id.slice(-4).toUpperCase()}</span>
                      </div>
                      {order.waiterInfo && (
                        <p className="text-xs opacity-80 mt-0.5">Waiter: {order.waiterInfo.waiterName}</p>
                      )}
                    </div>

                    {activeTab === 'active' && (
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1 ${theme.badge}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsedMinutes}m</span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="flex-1 p-4 space-y-3 divide-y divide-slate-800 min-h-[140px]">
                    {stationItems.map(item => {
                      const isItemChecked = checkedItems[order.id]?.[item.id] || false;
                      return (
                        <div
                          key={item.id}
                          onClick={() => activeTab === 'active' && toggleItemChecked(order.id, item.id)}
                          className={`pt-3 first:pt-0 flex items-start space-x-3 cursor-pointer ${isItemChecked ? 'opacity-40' : 'opacity-100'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors ${isItemChecked
                            ? 'bg-slate-700 border-slate-600 text-slate-300'
                            : 'border-slate-700 bg-slate-850 hover:border-slate-500'
                            }`}>
                            {isItemChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <span className={`text-base font-bold text-slate-100 ${isItemChecked ? 'line-through decoration-slate-500 decoration-2 text-slate-400' : ''}`}>
                                {item.name}
                              </span>
                              <span className="ml-2 bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-lg text-sm font-black">
                                x{item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Notes (if any) */}
                  {order.notes && (
                    <div className="bg-slate-950/40 border-t border-slate-800/40 px-4 py-2 text-xs text-amber-500 italic">
                      Note: "{order.notes}"
                    </div>
                  )}

                  {/* Action Button */}
                  {activeTab === 'active' && (
                    <div className="p-3 bg-slate-950/50 border-t border-slate-850 flex justify-end">
                      <button
                        onClick={() => handleCompleteStationTicket(order)}
                        className="w-full flex items-center justify-center space-x-2 bg-green-600 border border-green-500 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors active:scale-95 duration-100 shadow-lg shadow-green-950/30"
                      >
                        <Check className="w-5 h-5 stroke-[2.5]" />
                        <span>Ready & Clear</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
