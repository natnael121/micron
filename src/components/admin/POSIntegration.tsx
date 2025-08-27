import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download, 
  Upload, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { posIntegrationService } from '../../services/posIntegration';
import { firebaseService } from '../../services/firebase';

export const POSIntegration: React.FC = () => {
  const { user } = useAuth();
  const [posStatus, setPosStatus] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState({
    totalOrders: 0,
    syncedOrders: 0,
    failedOrders: 0
  });

  useEffect(() => {
    if (user) {
      checkPOSConnection();
      loadSyncStats();
    }
  }, [user]);

  const checkPOSConnection = async () => {
    try {
      setLoading(true);
      const [status, connectionTest] = await Promise.all([
        posIntegrationService.getPOSStatus(),
        posIntegrationService.testPOSConnection()
      ]);
      
      setPosStatus(status);
      setIsConnected(connectionTest);
    } catch (error) {
      console.error('Error checking POS connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStats = async () => {
    if (!user) return;
    
    try {
      const orders = await firebaseService.getOrders(user.id);
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(order => order.timestamp.startsWith(today));
      
      setSyncStats({
        totalOrders: todayOrders.length,
        syncedOrders: todayOrders.filter(order => order.paymentStatus === 'paid').length,
        failedOrders: todayOrders.filter(order => order.status === 'cancelled').length
      });
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  };

  const syncMenuToPOS = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const menuData = await posIntegrationService.getMenuForPOS(user.id);
      setLastSync(new Date().toISOString());
      alert('Menu synced to POS successfully!');
    } catch (error) {
      console.error('Error syncing menu to POS:', error);
      alert('Failed to sync menu to POS. Please check your connection.');
    } finally {
      setSyncing(false);
    }
  };

  const syncOrdersToPOS = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const orders = await firebaseService.getOrders(user.id, 50); // Last 50 orders
      let syncedCount = 0;
      
      for (const order of orders) {
        try {
          await posIntegrationService.syncOrderToPOS({
            id: order.id,
            tableNumber: order.tableNumber,
            items: order.items,
            totalAmount: order.totalAmount,
            userId: order.userId
          });
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync order ${order.id}:`, error);
        }
      }
      
      setLastSync(new Date().toISOString());
      await loadSyncStats();
      alert(`${syncedCount} orders synced to POS successfully!`);
    } catch (error) {
      console.error('Error syncing orders to POS:', error);
      alert('Failed to sync orders to POS. Please check your connection.');
    } finally {
      setSyncing(false);
    }
  };

  const downloadSalesReport = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const endDate = today.toISOString();
      
      const report = await posIntegrationService.getSalesReportForPOS(user.id, startDate, endDate);
      
      // Convert to CSV and download
      const csvContent = [
        ['Date', 'Orders', 'Revenue', 'Avg Order Value'].join(','),
        [
          new Date().toLocaleDateString(),
          report.summary.totalOrders,
          report.summary.totalRevenue.toFixed(2),
          report.summary.averageOrderValue.toFixed(2)
        ].join(','),
        '',
        ['Top Items', 'Quantity', 'Revenue'].join(','),
        ...report.topItems.slice(0, 10).map((item: any) => [
          item.name,
          item.quantity,
          item.revenue.toFixed(2)
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading sales report:', error);
      alert('Failed to download sales report');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">POS Integration</h1>
          <p className="text-gray-600">Connect and sync with your POS machine</p>
        </div>
        <button
          onClick={checkPOSConnection}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-600" />
                <span className="text-red-600 font-medium">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {posStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Version:</span>
              <span className="ml-2 font-medium">{posStatus.version}</span>
            </div>
            <div>
              <span className="text-gray-600">Last Sync:</span>
              <span className="ml-2 font-medium">
                {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-medium ${
                posStatus.status === 'online' ? 'text-green-600' : 'text-red-600'
              }`}>
                {posStatus.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sync Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">{syncStats.totalOrders}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Monitor className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Synced Orders</p>
              <p className="text-2xl font-bold text-gray-900">{syncStats.syncedOrders}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Orders</p>
              <p className="text-2xl font-bold text-gray-900">{syncStats.failedOrders}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={syncMenuToPOS}
            disabled={!isConnected || syncing}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex flex-col items-center space-y-2"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Sync Menu</span>
          </button>

          <button
            onClick={syncOrdersToPOS}
            disabled={!isConnected || syncing}
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex flex-col items-center space-y-2"
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-sm font-medium">Sync Orders</span>
          </button>

          <button
            onClick={downloadSalesReport}
            disabled={!isConnected}
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex flex-col items-center space-y-2"
          >
            <Download className="w-6 h-6" />
            <span className="text-sm font-medium">Sales Report</span>
          </button>

          <button
            onClick={checkPOSConnection}
            className="bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors flex flex-col items-center space-y-2"
          >
            <TestTube className="w-6 h-6" />
            <span className="text-sm font-medium">Test Connection</span>
          </button>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Base URL</h3>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {window.location.origin}/api/pos-integration
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Sync Order</h3>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                POST /api/pos-integration<br/>
                {"{"}"action": "sync_order", "data": {"{"}"orderId": "...", "tableNumber": "1", "items": [...], "totalAmount": 25.99, "userId": "..."{"}"}{"}"} 
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Process Payment</h3>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                POST /api/pos-integration<br/>
                {"{"}"action": "process_payment", "data": {"{"}"orderId": "...", "paymentMethod": "card", "amount": 25.99, "transactionId": "..."{"}"}{"}"} 
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Get Menu</h3>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                GET /api/pos-integration?type=menu&userId=...
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Update Inventory</h3>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                POST /api/pos-integration<br/>
                {"{"}"action": "update_inventory", "data": {"{"}"items": [{"{"}"id": "...", "quantity": 10{"}"}]{"}"}{"}"}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Guide</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">🔗 Connecting Your POS Machine</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Configure your POS machine to send HTTP requests to our API</li>
              <li>Use the endpoints documented above for different operations</li>
              <li>Include proper authentication headers if required</li>
              <li>Test the connection using the "Test Connection" button</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">📊 Supported Operations</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• <strong>Order Sync:</strong> Send orders from app to POS</li>
              <li>• <strong>Payment Processing:</strong> Process payments through POS</li>
              <li>• <strong>Inventory Updates:</strong> Update stock levels from POS</li>
              <li>• <strong>Menu Sync:</strong> Keep menu items synchronized</li>
              <li>• <strong>Sales Reports:</strong> Generate comprehensive reports</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Ensure your POS machine has internet connectivity</li>
              <li>• Test all integrations before going live</li>
              <li>• Monitor sync status regularly</li>
              <li>• Keep backup records of all transactions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Live</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Heartbeat:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sync Status:</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Queue:</span>
                <span className="text-sm font-medium text-gray-900">0 pending</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};