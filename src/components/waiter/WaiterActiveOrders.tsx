import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { Order } from '../../types';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  XCircle,
  Filter,
  RefreshCw
} from 'lucide-react';

export const WaiterActiveOrders: React.FC = () => {
  const { user, getRestaurantId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const restaurantId = getRestaurantId();

  useEffect(() => {
    if (!restaurantId || !user) return;

    setLoading(true);
    const unsubscribe = firebaseService.listenToWaiterOrders(
      restaurantId,
      user.id,
      (waiterOrders) => {
        setOrders(waiterOrders);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [restaurantId, user]);

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  // Only show today's orders + recent
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = filteredOrders.filter(o => o.timestamp.startsWith(today));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
        return (
          <span className="flex items-center space-x-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            <span>Sent to Kitchen</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="flex items-center space-x-1 text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
            <ChefHat className="w-3 h-3" />
            <span>Preparing</span>
          </span>
        );
      case 'ready':
        return (
          <span className="flex items-center space-x-1 text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full animate-pulse">
            <CheckCircle className="w-3 h-3" />
            <span>Ready to Serve!</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="flex items-center space-x-1 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center space-x-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  const markAsDelivered = async (orderId: string) => {
    try {
      await firebaseService.updateOrder(orderId, { status: 'delivered' });
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      alert('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Today's orders placed by you</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {[
          { key: 'all', label: 'All', count: todayOrders.length },
          { key: 'approved', label: 'Sent', count: orders.filter(o => o.status === 'approved' && o.timestamp.startsWith(today)).length },
          { key: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing' && o.timestamp.startsWith(today)).length },
          { key: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready' && o.timestamp.startsWith(today)).length },
          { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered' && o.timestamp.startsWith(today)).length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterStatus === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Orders List */}
      {todayOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
          <p className="text-gray-500 text-sm">Orders you place will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayOrders.map(order => (
            <div key={order.id} className={`bg-white rounded-xl border-2 p-4 transition-all ${
              order.status === 'ready' ? 'border-emerald-300 shadow-md' : 'border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                    order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.tableNumber}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Table {order.tableNumber}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Items */}
              <div className="space-y-1 mb-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} × {item.quantity}</span>
                    <span className="text-gray-900 font-medium">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                
                {order.status === 'ready' && (
                  <button
                    onClick={() => markAsDelivered(order.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Delivered</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
