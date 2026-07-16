import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { Order, TableBill } from '../../types';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  ChefHat,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const WaiterDashboard: React.FC = () => {
  const { user, getRestaurantId, restaurantOwner } = useAuth();
  const navigate = useNavigate();
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [tableBills, setTableBills] = useState<TableBill[]>([]);
  const [loading, setLoading] = useState(true);

  const restaurantId = getRestaurantId();
  const numberOfTables = restaurantOwner?.numberOfTables || 20;
  const assignedTables = user?.assignedTables || [];
  const hasAssignment = assignedTables.length > 0;

  // Generate table numbers the waiter can access
  const tables = hasAssignment 
    ? assignedTables 
    : Array.from({ length: numberOfTables }, (_, i) => i + 1);

  useEffect(() => {
    if (!restaurantId || !user) return;
    loadData();
    
    // Listen for real-time order updates
    const unsubscribe = firebaseService.listenToWaiterOrders(
      restaurantId, 
      user.id, 
      (orders) => {
        const today = new Date().toISOString().split('T')[0];
        setTodayOrders(orders.filter(o => o.timestamp.startsWith(today)));
      }
    );

    return unsubscribe;
  }, [restaurantId, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const bills = await firebaseService.getTableBills(restaurantId);
      setTableBills(bills);
    } catch (error) {
      console.error('Error loading waiter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatus = (tableNum: number): 'empty' | 'active' | 'ready' => {
    const bill = tableBills.find(b => b.tableNumber === String(tableNum) && b.status === 'active');
    if (!bill) return 'empty';
    
    const tableOrders = todayOrders.filter(o => o.tableNumber === String(tableNum));
    const hasReady = tableOrders.some(o => o.status === 'ready');
    if (hasReady) return 'ready';
    return 'active';
  };

  const getTableBill = (tableNum: number): TableBill | undefined => {
    return tableBills.find(b => b.tableNumber === String(tableNum) && b.status === 'active');
  };

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const activeOrders = todayOrders.filter(o => ['approved', 'preparing'].includes(o.status));
  const readyOrders = todayOrders.filter(o => o.status === 'ready');
  const currency = restaurantOwner?.settings?.currency || 'USD';

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name || 'Waiter'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Select a table to start taking orders</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>
              <p className="text-xs text-gray-500">Today's Orders</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${todayRevenue.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{readyOrders.length}</p>
              <p className="text-xs text-gray-500">Ready to Serve</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ready Orders Alert */}
      {readyOrders.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <ChefHat className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-800">Orders Ready to Serve!</h3>
          </div>
          <div className="space-y-2">
            {readyOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div>
                  <span className="font-medium text-gray-900">Table {order.tableNumber}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/waiter/order/${order.tableNumber}`)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {hasAssignment ? 'Your Tables' : 'All Tables'}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {tables.map(tableNum => {
            const status = getTableStatus(tableNum);
            const bill = getTableBill(tableNum);
            
            return (
              <button
                key={tableNum}
                onClick={() => navigate(`/waiter/order/${tableNum}`)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                  status === 'ready' 
                    ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-400' 
                    : status === 'active' 
                    ? 'bg-blue-50 border-blue-300 hover:border-blue-400' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {status === 'ready' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
                
                <div className="text-center">
                  <Users className={`w-6 h-6 mx-auto mb-1 ${
                    status === 'ready' ? 'text-emerald-600' :
                    status === 'active' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className="font-bold text-lg text-gray-900">{tableNum}</p>
                  <p className={`text-xs font-medium ${
                    status === 'ready' ? 'text-emerald-600' :
                    status === 'active' ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {status === 'ready' ? 'Ready!' : status === 'active' ? 'Active' : 'Empty'}
                  </p>
                  {bill && (
                    <p className="text-xs text-gray-500 mt-1">${bill.total.toFixed(2)}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
