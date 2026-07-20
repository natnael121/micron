import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { Order, MenuItem } from '../../types';
import { Clock, CookingPot, Check, RefreshCw, Volume2, VolumeX, History, ListFilter } from 'lucide-react';

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_KEY = (restaurantId: string, stationId: string) =>
  `kds-checked-${restaurantId}-${stationId}`;

const loadChecked = (restaurantId: string, stationId: string): Record<string, Record<string, boolean>> => {
  try {
    const raw = localStorage.getItem(LS_KEY(restaurantId, stationId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveChecked = (
  restaurantId: string,
  stationId: string,
  data: Record<string, Record<string, boolean>>
) => {
  try {
    localStorage.setItem(LS_KEY(restaurantId, stationId), JSON.stringify(data));
  } catch {
    // storage quota exceeded — silently ignore
  }
};

// ── Component ─────────────────────────────────────────────────────────────────
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

  // Checked items — persisted to localStorage so refresh doesn't clear them
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<string, boolean>>>(() =>
    restaurantId && stationId ? loadChecked(restaurantId, stationId) : {}
  );

  // Persist whenever checkedItems changes
  useEffect(() => {
    if (restaurantId && stationId) {
      saveChecked(restaurantId, stationId, checkedItems);
    }
  }, [checkedItems, restaurantId, stationId]);

  // Prune stale order entries from localStorage when orders list updates
  useEffect(() => {
    if (!orders.length) return;
    const liveIds = new Set(orders.map(o => o.id));
    setCheckedItems(prev => {
      const pruned = Object.fromEntries(
        Object.entries(prev).filter(([id]) => liveIds.has(id))
      );
      // Only update state if something was actually removed
      return Object.keys(pruned).length !== Object.keys(prev).length ? pruned : prev;
    });
  }, [orders]);

  // Web Audio API chime synthesizer
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

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
      console.error('Audio Context playback failed:', e);
    }
  };

  // Ref so the subscription always reads fresh menu items without re-subscribing
  const menuItemsRef = useRef<MenuItem[]>([]);
  menuItemsRef.current = menuItems;

  // Effect 1: load menu items once
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

  // Effect 2: subscribe to live orders (independent of menu item state)
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = firebaseService.listenToActiveOrders(restaurantId, (liveOrders) => {
      setOrders(liveOrders);

      const activeStationOrders = liveOrders.filter(order => {
        const hasStationItems = order.items.some(item => {
          const menuItem = menuItemsRef.current.find(mi => mi.id === item.id);
          return menuItem?.department === stationId;
        });
        const isCompleted = order.completedDepartments?.includes(stationId);
        const isActiveStatus = ['pending', 'confirmed', 'preparing', 'approved'].includes(order.status);
        return hasStationItems && !isCompleted && isActiveStatus;
      });

      let hasNewTicket = false;
      const currentIds = new Set<string>();
      activeStationOrders.forEach(o => {
        currentIds.add(o.id);
        if (!activeTicketIdsRef.current.has(o.id)) hasNewTicket = true;
      });
      activeTicketIdsRef.current = currentIds;

      if (hasNewTicket) playNotificationSound();
    });

    return () => unsubscribe();
  }, [restaurantId, stationId]);

  // Filter items belonging to this station
  const getStationItems = (order: Order) =>
    order.items.filter(item => {
      const menuItem = menuItems.find(mi => mi.id === item.id);
      return menuItem?.department === stationId;
    });

  // Toggle item check-off
  const toggleItemChecked = (orderId: string, itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [itemId]: !(prev[orderId]?.[itemId]),
      },
    }));
  };

  // Mark station preparation complete
  const handleCompleteStationTicket = async (order: Order) => {
    try {
      const completed = order.completedDepartments || [];
      if (!completed.includes(stationId)) {
        const newCompleted = [...completed, stationId];

        const departmentsInOrder = Array.from(new Set(
          order.items
            .map(item => menuItems.find(mi => mi.id === item.id)?.department)
            .filter((dept) => dept !== undefined)
        ));

        const allDone = departmentsInOrder.every(deptId => newCompleted.includes(deptId));

        const updates: any = { completedDepartments: newCompleted };
        if (allDone) {
          updates.status = 'ready';
        } else if (['confirmed', 'approved', 'pending'].includes(order.status)) {
          updates.status = 'preparing';
        }

        await firebaseService.updateOrder(order.id, updates);

        // Clear checked items for this order after it's marked complete
        setCheckedItems(prev => {
          const next = { ...prev };
          delete next[order.id];
          return next;
        });
      }
    } catch (err) {
      console.error('Error completing ticket:', err);
      alert('Failed to complete ticket. Please try again.');
    }
  };

  // Elapsed time in minutes
  const getElapsedTime = (timestamp: string) => {
    const elapsedMs = Date.now() - new Date(timestamp).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  // Ticket urgency color classes — using the app's green/amber/red scale on a light card
  const getTicketColorClasses = (elapsedMinutes: number) => {
    if (elapsedMinutes >= 12) {
      return {
        header: 'bg-red-600 text-white',
        body: 'bg-white border-red-300',
        badge: 'bg-red-100 text-red-700 border border-red-200',
        divider: 'divide-red-100',
      };
    }
    if (elapsedMinutes >= 6) {
      return {
        header: 'bg-amber-500 text-white',
        body: 'bg-white border-amber-300',
        badge: 'bg-amber-100 text-amber-700 border border-amber-200',
        divider: 'divide-amber-100',
      };
    }
    return {
      header: 'bg-green-600 text-white',
      body: 'bg-white border-gray-200',
      badge: 'bg-green-50 text-green-700 border border-green-200',
      divider: 'divide-gray-100',
    };
  };

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    const stationItems = getStationItems(order);
    if (stationItems.length === 0) return false;
    const isCompleted = order.completedDepartments?.includes(stationId);
    if (activeTab === 'active') {
      return ['pending', 'confirmed', 'preparing', 'approved'].includes(order.status) && !isCompleted;
    } else {
      const elapsedMs = Date.now() - new Date(order.timestamp).getTime();
      return isCompleted && elapsedMs < 4 * 60 * 60 * 1000;
    }
  });

  const activeTicketsCount = orders.filter(order => {
    const isCompleted = order.completedDepartments?.includes(stationId);
    return (
      getStationItems(order).length > 0 &&
      !isCompleted &&
      ['pending', 'confirmed', 'preparing', 'approved'].includes(order.status)
    );
  }).length;

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-green-600 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Synchronizing station data...</p>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* Sub-Header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-all duration-150 ${
              activeTab === 'active'
                ? 'bg-green-600 border-green-600 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Active Tickets ({activeTicketsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-all duration-150 ${
              activeTab === 'history'
                ? 'bg-green-600 border-green-600 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History (Last 4h)</span>
          </button>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            playNotificationSound();
          }}
          className={`p-2.5 rounded-lg border transition-all duration-150 ${
            soundEnabled
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
          }`}
          title={soundEnabled ? 'Disable Chime Sound' : 'Enable Chime Sound'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Tickets Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <CookingPot className="w-16 h-16 text-gray-300 mb-4 stroke-[1.5]" />
            <h3 className="text-xl font-bold text-gray-500 mb-1">No orders in queue</h3>
            <p className="text-sm text-gray-400">
              {activeTab === 'active'
                ? 'Incoming orders for this station will appear here.'
                : 'Completed tickets from the last 4 hours will display here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
            {filteredOrders.map(order => {
              const stationItems = getStationItems(order);
              const elapsedMinutes = getElapsedTime(order.timestamp);
              const theme = getTicketColorClasses(elapsedMinutes);

              return (
                <div
                  key={order.id}
                  className={`rounded-xl border overflow-hidden shadow-sm transition-transform duration-200 hover:-translate-y-0.5 flex flex-col ${theme.body}`}
                >
                  {/* Ticket Header */}
                  <div className={`px-4 py-3 flex items-center justify-between ${theme.header}`}>
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
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1 bg-white/20 text-white`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsedMinutes}m</span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className={`flex-1 p-4 space-y-3 divide-y min-h-[140px] ${theme.divider}`}>
                    {stationItems.map(item => {
                      const isItemChecked = checkedItems[order.id]?.[item.id] || false;
                      return (
                        <div
                          key={item.id}
                          onClick={() => activeTab === 'active' && toggleItemChecked(order.id, item.id)}
                          className={`pt-3 first:pt-0 flex items-start space-x-3 cursor-pointer transition-opacity ${
                            isItemChecked ? 'opacity-40' : 'opacity-100'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isItemChecked
                                ? 'bg-gray-200 border-gray-300 text-gray-500'
                                : 'border-gray-300 bg-white hover:border-green-400'
                            }`}
                          >
                            {isItemChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <span
                                className={`text-base font-bold ${
                                  isItemChecked
                                    ? 'line-through decoration-gray-400 decoration-2 text-gray-400'
                                    : 'text-gray-900'
                                }`}
                              >
                                {item.name}
                              </span>
                              <span className="ml-2 bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-lg text-sm font-black flex-shrink-0">
                                x{item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="bg-amber-50 border-t border-amber-100 px-4 py-2 text-xs text-amber-700 italic">
                      Note: &ldquo;{order.notes}&rdquo;
                    </div>
                  )}

                  {/* Complete Button */}
                  {activeTab === 'active' && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => handleCompleteStationTicket(order)}
                        className="w-full flex items-center justify-center space-x-2 bg-green-600 border border-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 transition-colors active:scale-95 duration-100 shadow-sm"
                      >
                        <Check className="w-5 h-5 stroke-[2.5]" />
                        <span>Ready &amp; Clear</span>
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
