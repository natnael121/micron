import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  UserPlus,
  CreditCard,
  Calendar,
  FileText,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationScheduler } from '../../hooks/useNotificationScheduler';
import { firebaseService } from '../../services/firebase';
import { telegramService } from '../../services/telegram';
import { MenuStats, TableBill, PaymentConfirmation, PendingOrder, MenuItem, DayReport } from '../../types';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isEnabled: notificationsEnabled } = useNotifications();
  const { isProcessing: schedulerProcessing } = useNotificationScheduler(user?.id || '');
  const [stats, setStats] = useState<MenuStats | null>(null);
  const [tableBills, setTableBills] = useState<TableBill[]>([]);
  const [paymentConfirmations, setPaymentConfirmations] = useState<PaymentConfirmation[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [dayReports, setDayReports] = useState<DayReport[]>([]);
  const [closingDay, setClosingDay] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [cashierInfo, setCashierInfo] = useState({
    name: '',
    shift: 'morning',
    notes: ''
  });
  const [todayStats, setTodayStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeTables: 0,
    menuViews: 0
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadTodayStats();
      loadFeedbacks();
      
      // Auto-refresh dashboard every 30 seconds
      const refreshInterval = setInterval(() => {
        loadDashboardData();
        loadTodayStats();
        loadFeedbacks();
      }, 30000);
      
      // Set up real-time feedback updates
      const feedbackInterval = setInterval(loadFeedbacks, 30000); // Refresh every 30 seconds
      
      return () => {
        clearInterval(refreshInterval);
        clearInterval(feedbackInterval);
      };
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [menuStats, bills, confirmations, pending, items, reports] = await Promise.all([
        firebaseService.getMenuStats(user.id),
        firebaseService.getTableBills(user.id),
        firebaseService.getPaymentConfirmations(user.id),
        firebaseService.getPendingOrders(user.id),
        firebaseService.getMenuItems(user.id),
        firebaseService.getDayReports(user.id)
      ]);
      
      setStats(menuStats);
      setTableBills(bills);
      setPaymentConfirmations(confirmations);
      setPendingOrders(pending);
      setMenuItems(items);
      setDayReports(reports);
      
      // Calculate active tables
      setTodayStats(prev => ({
        ...prev,
        activeTables: bills.length
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbacks = () => {
    try {
      const storedFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      // Filter feedbacks from today
      const today = new Date().toISOString().split('T')[0];
      const todayFeedbacks = storedFeedbacks.filter((feedback: any) => 
        feedback.timestamp.startsWith(today)
      );
      
      // Sort by timestamp (newest first) and limit to recent ones
      const sortedFeedbacks = todayFeedbacks
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Show only last 10 feedbacks
      
      setFeedbacks(sortedFeedbacks);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      setFeedbacks([]);
    }
  };
  const loadTodayStats = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const [orders, menuItems] = await Promise.all([
        firebaseService.getOrders(user.id),
        firebaseService.getMenuItems(user.id)
      ]);
      
      // Filter today's orders
      const todayOrders = orders.filter(order => 
        order.timestamp.startsWith(today)
      );
      
      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const todayViews = menuItems.reduce((sum, item) => sum + item.views, 0);
      
      setTodayStats(prev => ({
        ...prev,
        totalRevenue: todayRevenue,
        totalOrders: todayOrders.length,
        menuViews: todayViews
      }));
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const handleCloseDay = async () => {
    if (!cashierInfo.name.trim()) {
      alert('Please enter cashier name before closing the day.');
      return;
    }

    setClosingDay(true);
    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      
      const reportId = await firebaseService.createDayReport(user.id, cashierInfo);
      
      // Get the created report
      const reports = await firebaseService.getDayReports(user.id);
      const todayReport = reports[0];
      
      if (todayReport) {
        await telegramService.sendDayReport(todayReport, user.id);
      }
      
      // Reset today's stats
      setTodayStats({
        totalRevenue: 0,
        totalOrders: 0,
        activeTables: 0,
        menuViews: 0
      });
      
      // Reset cashier info
      setCashierInfo({
        name: '',
        shift: 'morning',
        notes: ''
      });
      
      await loadDashboardData();
      setShowCloseDayModal(false);
      alert('Day closed successfully! Report sent to admin.');
    } catch (error) {
      console.error('Error closing day:', error);
      alert(`Failed to close day: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setClosingDay(false);
    }
  };
  const handlePayTableBill = async (tableBill: TableBill) => {
    if (!confirm(`Mark Table ${tableBill.tableNumber} bill as paid ($${tableBill.total.toFixed(2)})?`)) {
      return;
    }

    try {
      // Create a bill record in the bills collection
      await firebaseService.createBillFromTableBill(tableBill);
      
      // Mark the table bill as paid
      await firebaseService.markTableBillAsPaid(tableBill.userId, tableBill.tableNumber, null, tableBill.cafeId);
      
      // Reload data to reflect changes
      await loadDashboardData();
      
      alert(`Table ${tableBill.tableNumber} bill has been marked as paid and added to bills!`);
    } catch (error) {
      console.error('Error paying table bill:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handleWaiterCallFromTable = async (tableNumber: number) => {
    try {
      if (user) {
        await firebaseService.addWaiterCall(user.id, tableNumber.toString());
        alert(`Waiter call registered for Table ${tableNumber}`);
      }
    } catch (error) {
      console.error('Error registering waiter call:', error);
      alert('Failed to register waiter call');
    }
  };

  const handleApprovePendingOrder = async (pendingOrderId: string) => {
    try {
      const pendingOrder = pendingOrders.find(p => p.id === pendingOrderId);
      if (!pendingOrder) return;

      await firebaseService.approvePendingOrder(pendingOrderId, pendingOrder);
      
      // Reload data
      await loadDashboardData();
      alert('Order approved successfully!');
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order');
    }
  };

  const handleRejectPendingOrder = async (pendingOrderId: string) => {
    try {
      await firebaseService.rejectPendingOrder(pendingOrderId);
      
      // Reload data
      await loadDashboardData();
      alert('Order rejected successfully!');
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order');
    }
  };

  const handlePaymentConfirmation = async (confirmationId: string, status: 'approved' | 'rejected') => {
    try {
      await firebaseService.updatePaymentConfirmation(confirmationId, status);
      
      if (status === 'approved') {
        const confirmation = paymentConfirmations.find(c => c.id === confirmationId);
        if (confirmation) {
          await firebaseService.markTableBillAsPaid(
            confirmation.userId, 
            confirmation.tableNumber, 
            confirmationId,
            confirmation.cafeId
          );
        }
      }
      
      // Reload data
      await loadDashboardData();
      alert(`Payment ${status} successfully!`);
    } catch (error) {
      console.error('Error updating payment confirmation:', error);
      alert('Failed to update payment confirmation');
    }
  };

  const handleAddOrderToTable = (tableNumber: number) => {
    setSelectedTableForOrder(tableNumber);
    setShowAddOrderModal(true);
  };

  const getTableRows = () => {
    const numberOfTables = user?.numberOfTables || 10;
    const rows = [];
    const tablesPerRow = 10;
    
    for (let i = 0; i < numberOfTables; i += tablesPerRow) {
      const rowTables = [];
      for (let j = i; j < Math.min(i + tablesPerRow, numberOfTables); j++) {
        rowTables.push(j + 1);
      }
      rows.push(rowTables);
    }
    
    return rows;
  };

  const getTableStatus = (tableNumber: number) => {
    const bill = tableBills.find(b => parseInt(b.tableNumber) === tableNumber);
    if (!bill) return 'empty';
    return bill.status === 'active' ? 'occupied' : 'empty';
  };

  const getTableBill = (tableNumber: number) => {
    return tableBills.find(b => parseInt(b.tableNumber) === tableNumber);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const tableRows = getTableRows();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {!notificationsEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              💡 Enable web notifications in Settings to get instant alerts for new orders and payments!
            </p>
          </div>
        )}
        {schedulerProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              🔄 Processing scheduled notifications...
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-2">
          <button
            onClick={() => setShowCloseDayModal(true)}
            disabled={closingDay}
            className="w-full sm:w-auto bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 font-medium"
          >
            <Calendar className="w-4 h-4" />
            <span>{closingDay ? 'Closing...' : 'Close Day'}</span>
          </button>
        </div>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${todayStats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.totalOrders}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tables</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.activeTables}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Menu Views</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.menuViews}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Orders ({pendingOrders.length})
          </h2>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Table {order.tableNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.timestamp), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {order.items.length} items
                    </p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprovePendingOrder(order.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectPendingOrder(order.id)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Management */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Table Management</h2>
        
        {/* Mobile-friendly layout */}
        <div className="block lg:hidden">
          {/* Mobile Table Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Array.from({ length: user?.numberOfTables || 10 }, (_, i) => i + 1).map(tableNumber => {
              const status = getTableStatus(tableNumber);
              const bill = getTableBill(tableNumber);
              
              return (
                <div
                  key={tableNumber}
                  className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                    status === 'occupied'
                      ? 'border-red-300 bg-red-50'
                      : 'border-green-300 bg-green-50'
                  }`}
                >
                  <button
                    onClick={() => setSelectedTable(selectedTable === tableNumber ? null : tableNumber)}
                    className="w-full text-center"
                  >
                    <div className="text-lg font-bold text-gray-900">{tableNumber}</div>
                    <div className={`text-xs font-medium ${
                      status === 'occupied' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {status === 'occupied' ? 'Occupied' : 'Available'}
                    </div>
                    {bill && (
                      <div className="text-xs text-gray-500 mt-1">
                        ${bill.total.toFixed(2)}
                      </div>
                    )}
                  </button>
                  
                  {/* Action buttons for mobile */}
                  <div className="absolute -top-1 -right-1 flex space-x-1">
                    <button
                      onClick={() => handleAddOrderToTable(tableNumber)}
                      className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors text-xs"
                      title="Add Order"
                    >
                      +
                    </button>
                    {bill && status === 'occupied' && (
                      <button
                        onClick={() => handlePayTableBill(bill)}
                        className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors text-xs"
                        title="Pay Bill"
                      >
                        $
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mobile Pending Orders Section */}
          {pendingOrders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                Pending Orders ({pendingOrders.length})
              </h3>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Table {order.tableNumber}</span>
                      <span className="font-bold text-orange-600">${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprovePendingOrder(order.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleRejectPendingOrder(order.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Mobile Payment Confirmations Section */}
          {paymentConfirmations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="w-5 h-5 text-blue-500 mr-2" />
                Payment Confirmations ({paymentConfirmations.length})
              </h3>
              <div className="space-y-3">
                {paymentConfirmations.map((confirmation) => (
                  <div key={confirmation.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Table {confirmation.tableNumber}</span>
                      <span className="font-bold text-blue-600">${confirmation.total.toFixed(2)}</span>
                    </div>
                    <div className="mb-2">
                      <img
                        src={confirmation.screenshotUrl}
                        alt="Payment Screenshot"
                        className="w-full h-20 object-cover rounded border"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePaymentConfirmation(confirmation.id, 'approved')}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handlePaymentConfirmation(confirmation.id, 'rejected')}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Desktop layout (existing) */}
        <div className="hidden lg:block">
        <div className="space-y-4">
          {tableRows.map((row, rowIndex) => (
            <div key={rowIndex} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                Tables {row[0]} - {row[row.length - 1]}
              </h3>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {row.map(tableNumber => {
                  const status = getTableStatus(tableNumber);
                  const bill = getTableBill(tableNumber);
                  
                  return (
                    <div
                      key={tableNumber}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                        status === 'occupied'
                          ? 'border-red-300 bg-red-50 hover:bg-red-100'
                          : 'border-green-300 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedTable(selectedTable === tableNumber ? null : tableNumber)}
                        className="w-full text-center"
                      >
                        <div className="text-lg font-bold text-gray-900">{tableNumber}</div>
                        <div className={`text-xs font-medium ${
                          status === 'occupied' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {status === 'occupied' ? 'Occupied' : 'Available'}
                        </div>
                        {bill && (
                          <div className="text-xs text-gray-500 mt-1">
                            ${bill.total.toFixed(2)}
                          </div>
                        )}
                      </button>
                      
                      {/* Add Order Button */}
                      <button
                        onClick={() => handleAddOrderToTable(tableNumber)}
                        className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 transition-colors"
                        title="Add Order"
                      >
                        <UserPlus className="w-3 h-3" />
                      </button>
                      
                      {bill && status === 'occupied' && (
                        <button
                          onClick={() => handlePayTableBill(bill)}
                          className="absolute top-1 left-1 bg-green-600 text-white rounded-full p-1 hover:bg-green-700 transition-colors"
                          title="Pay Bill"
                        >
                          <CreditCard className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Table Details */}
        {selectedTable && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Table {selectedTable} Details</h3>
            {(() => {
              const bill = getTableBill(selectedTable);
              if (!bill) {
                return <p className="text-gray-600">Table is currently empty</p>;
              }
              
              return (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      bill.status === 'active' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {bill.status === 'active' ? 'Occupied' : 'Available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bill:</span>
                    <span className="font-medium">${bill.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{bill.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">
                      {format(new Date(bill.updatedAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <button
                      onClick={() => handlePayTableBill(bill)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Mark as Paid</span>
                    </button>
                  </div>
                  <div className="pt-2 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Items Ordered:</h4>
                    <div className="space-y-1">
                      {bill.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Payment Confirmations */}
      {paymentConfirmations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Payment Confirmations ({paymentConfirmations.length})
          </h2>
          <div className="space-y-4">
            {paymentConfirmations.map((confirmation) => (
              <div key={confirmation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Table {confirmation.tableNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(confirmation.timestamp), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${confirmation.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {confirmation.method.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <img
                    src={confirmation.screenshotUrl}
                    alt="Payment Screenshot"
                    className="w-full max-w-xs h-32 object-cover rounded border"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handlePaymentConfirmation(confirmation.id, 'approved')}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handlePaymentConfirmation(confirmation.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Feedbacks */}
      {feedbacks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span>Today's Customer Feedback ({feedbacks.length})</span>
            <div className="ml-auto flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">⭐</span>
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  Avg: {(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)}
                </span>
              </div>
            </div>
          </h2>
          <div className="space-y-4">
            {feedbacks.slice(0, 5).map((feedback, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                feedback.rating >= 4 ? 'bg-green-50 border-green-200' :
                feedback.rating >= 3 ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {feedback.customerInfo?.telegramPhoto ? (
                      <img 
                        src={feedback.customerInfo.telegramPhoto} 
                        alt={feedback.customerInfo.name || 'Customer'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600">👤</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {feedback.customerInfo?.name || 'Anonymous Customer'}
                      </p>
                      {feedback.customerInfo?.username && (
                        <p className="text-xs text-gray-500">@{feedback.customerInfo.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-base ${
                          i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(feedback.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {feedback.comment && (
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-sm text-gray-700 italic">"{feedback.comment}"</p>
                  </div>
                )}
                
                {feedback.orderId && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Order: {feedback.orderId.slice(0, 8)}...
                      {feedback.sessionId && ` • Session: ${feedback.sessionId.slice(0, 8)}...`}
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {feedbacks.length > 5 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing 5 of {feedbacks.length} feedbacks from today
                </p>
                <button
                  onClick={() => {
                    // Show all feedbacks in a modal or navigate to analytics
                    alert(`Total ${feedbacks.length} feedbacks received today. Check Analytics for detailed view.`);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                >
                  View All Feedbacks
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddOrderModal && selectedTableForOrder && (
        <AddOrderModal
          tableNumber={selectedTableForOrder}
          menuItems={menuItems}
          userId={user?.id || ''}
          onClose={() => {
            setShowAddOrderModal(false);
            setSelectedTableForOrder(null);
          }}
          onOrderAdded={loadDashboardData}
        />
      )}

      {/* Close Day Modal */}
      {showCloseDayModal && (
        <CloseDayModal
          cashierInfo={cashierInfo}
          onCashierInfoChange={setCashierInfo}
          onClose={() => setShowCloseDayModal(false)}
          onConfirm={handleCloseDay}
          loading={closingDay}
        />
      )}
    </div>
  );
};

// Add Order Modal Component
interface AddOrderModalProps {
  tableNumber: number;
  menuItems: MenuItem[];
  userId: string;
  onClose: () => void;
  onOrderAdded: () => void;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({
  tableNumber,
  menuItems,
  userId,
  onClose,
  onOrderAdded,
}) => {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const newItems = { ...selectedItems };
      delete newItems[itemId];
      setSelectedItems(newItems);
    } else {
      setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
    }
  };

  const getTotalAmount = () => {
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(i => i.id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedItems).length === 0) {
      alert('Please select at least one item');
      return;
    }

    setLoading(true);
    try {
      // Create order items
      const orderItems = Object.entries(selectedItems).map(([itemId, quantity]) => {
        const item = menuItems.find(i => i.id === itemId);
        if (!item) throw new Error(`Item not found: ${itemId}`);
        
        return {
          id: itemId,
          name: item.name,
          quantity,
          price: item.price,
          total: item.price * quantity,
        };
      });

      // Create order directly (admin added)
      const orderData = {
        tableNumber: tableNumber.toString(),
        userId,
        items: orderItems,
        totalAmount: getTotalAmount(),
        status: 'confirmed' as const,
        paymentStatus: 'pending' as const,
        timestamp: new Date().toISOString(),
        customerInfo: {
          name: 'Admin Added Order',
        },
      };

      const orderId = await firebaseService.addOrder(orderData);
      
      // Add items to table bill
      await firebaseService.addToTableBill(userId, tableNumber.toString(), orderItems);
      
      // Send order to appropriate departments
      await firebaseService.sendOrderToDepartments(orderId, { ...orderData, id: orderId }, userId);
      
      onOrderAdded();
      onClose();
      alert('Order added successfully!');
    } catch (error) {
      console.error('Error adding order:', error);
      alert('Failed to add order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Add Order - Table {tableNumber}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <AlertCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-3">
            {menuItems.filter(item => item.available).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(item.id, (selectedItems[item.id] || 0) - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">
                    {selectedItems[item.id] || 0}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.id, (selectedItems[item.id] || 0) + 1)}
                    className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-xl font-bold text-green-600">
                ${getTotalAmount().toFixed(2)}
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || Object.keys(selectedItems).length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Close Day Modal Component
interface CloseDayModalProps {
  cashierInfo: {
    name: string;
    shift: string;
    notes: string;
  };
  onCashierInfoChange: (info: any) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const CloseDayModal: React.FC<CloseDayModalProps> = ({
  cashierInfo,
  onCashierInfoChange,
  onClose,
  onConfirm,
  loading
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Close Day</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Warning:</strong> This will close the current day and generate a report. 
              All today's data will be archived and sent to admin.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cashier Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cashier Name *
                </label>
                <input
                  type="text"
                  value={cashierInfo.name}
                  onChange={(e) => onCashierInfoChange({ ...cashierInfo, name: e.target.value })}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter cashier name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift
                </label>
                <select
                  value={cashierInfo.shift}
                  onChange={(e) => onCashierInfoChange({ ...cashierInfo, shift: e.target.value })}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="morning">Morning Shift</option>
                  <option value="afternoon">Afternoon Shift</option>
                  <option value="evening">Evening Shift</option>
                  <option value="night">Night Shift</option>
                  <option value="full">Full Day</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={cashierInfo.notes}
                  onChange={(e) => onCashierInfoChange({ ...cashierInfo, notes: e.target.value })}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any additional notes about the day..."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || !cashierInfo.name.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2 font-medium"
            >
              <Calendar className="w-4 h-4" />
              <span>{loading ? 'Closing Day...' : 'Close Day'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};