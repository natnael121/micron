import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Settings, 
  Eye, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { deliveryIntegrationService } from '../../services/deliveryIntegration';
import { firebaseService } from '../../services/firebase';
import { 
  DeliveryCompany, 
  DeliveryIntegration as DeliveryIntegrationType, 
  DeliveryOrder, 
  DeliveryAnalytics 
} from '../../types/delivery';
import { format } from 'date-fns';

export const DeliveryIntegration: React.FC = () => {
  const { user } = useAuth();
  const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>([]);
  const [userIntegrations, setUserIntegrations] = useState<DeliveryIntegrationType[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [analytics, setAnalytics] = useState<DeliveryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'orders' | 'analytics'>('overview');
  const [showConnectModal, setShowConnectModal] = useState<DeliveryCompany | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState<DeliveryOrder | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [companies, integrations, orders, analyticsData] = await Promise.all([
        deliveryIntegrationService.getDeliveryCompanies(),
        deliveryIntegrationService.getUserIntegrations(user.id),
        deliveryIntegrationService.getDeliveryOrders(user.id, 50),
        deliveryIntegrationService.getDeliveryAnalytics(user.id)
      ]);
      
      setDeliveryCompanies(companies);
      setUserIntegrations(integrations);
      setDeliveryOrders(orders);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading delivery integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (company: DeliveryCompany, credentials: any) => {
    try {
      await deliveryIntegrationService.connectToDeliveryCompany(
        user!.id,
        company.id,
        credentials
      );
      
      await loadData();
      setShowConnectModal(null);
      alert(`Successfully connected to ${company.name}!`);
    } catch (error) {
      console.error('Error connecting to delivery company:', error);
      alert(`Failed to connect to ${company.name}. Please try again.`);
    }
  };

  const handleDisconnect = async (companyId: string) => {
    const company = deliveryCompanies.find(c => c.id === companyId);
    if (!confirm(`Are you sure you want to disconnect from ${company?.name}?`)) return;
    
    try {
      await deliveryIntegrationService.disconnectFromDeliveryCompany(user!.id, companyId);
      await loadData();
      alert(`Disconnected from ${company?.name} successfully!`);
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect. Please try again.');
    }
  };

  const handleSyncMenu = async (companyId: string) => {
    try {
      await deliveryIntegrationService.syncMenuToDeliveryCompany(user!.id, companyId);
      await loadData();
      alert('Menu synced successfully!');
    } catch (error) {
      console.error('Error syncing menu:', error);
      alert('Failed to sync menu. Please try again.');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await deliveryIntegrationService.acceptDeliveryOrder(orderId, 20);
      await loadData();
      alert('Order accepted successfully!');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject this order?')) return;
    
    try {
      await deliveryIntegrationService.rejectDeliveryOrder(orderId, 'Restaurant unavailable');
      await loadData();
      alert('Order rejected successfully!');
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order. Please try again.');
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

  const connectedCompanies = userIntegrations.filter(i => i.isActive);
  const pendingOrders = deliveryOrders.filter(o => o.status === 'received');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Integration</h1>
          <p className="text-gray-600">Connect with delivery companies to expand your reach</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            connectedCompanies.length > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
          }`}>
            {connectedCompanies.length > 0 ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {connectedCompanies.length} Connected
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'companies', label: 'Companies', icon: Truck },
            { id: 'orders', label: 'Orders', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connected Platforms</p>
                  <p className="text-2xl font-bold text-gray-900">{connectedCompanies.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivery Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalOrders || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivery Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics?.totalRevenue.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Pending Delivery Orders ({pendingOrders.length})
              </h2>
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {order.source} - {order.customer.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.orderTime), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${order.subtotal.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {order.items.length} items
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        📍 {order.customer.deliveryAddress.line1}, {order.customer.deliveryAddress.city}
                      </p>
                      {order.specialInstructions && (
                        <p className="text-sm text-gray-600">
                          📝 {order.specialInstructions}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRejectOrder(order.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => setShowOrderDetail(order)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Companies Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Platforms</h2>
            {connectedCompanies.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery platforms connected</h3>
                <p className="text-gray-600 mb-4">Connect to delivery companies to start receiving orders</p>
                <button
                  onClick={() => setActiveTab('companies')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Companies
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectedCompanies.map((integration) => {
                  const company = deliveryCompanies.find(c => c.id === integration.deliveryCompanyId);
                  if (!company) return null;
                  
                  return (
                    <div key={integration.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{company.name}</h3>
                        <div className={`w-3 h-3 rounded-full ${
                          integration.syncStatus === 'success' ? 'bg-green-500' :
                          integration.syncStatus === 'failed' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Sync:</span>
                          <span className="text-gray-900">
                            {format(new Date(integration.lastSync), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Auto Accept:</span>
                          <span className={integration.settings.autoAcceptOrders ? 'text-green-600' : 'text-gray-600'}>
                            {integration.settings.autoAcceptOrders ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => handleSyncMenu(company.id)}
                          className="flex-1 bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          Sync Menu
                        </button>
                        <button
                          onClick={() => handleDisconnect(company.id)}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliveryCompanies.map((company) => {
              const isConnected = userIntegrations.some(i => i.deliveryCompanyId === company.id && i.isActive);
              
              return (
                <div key={company.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={company.logo || 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={company.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{company.name}</h3>
                        <p className="text-sm text-gray-500">{company.commission}% commission</p>
                      </div>
                    </div>
                    {isConnected && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Connected</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{company.description}</p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {company.features?.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      {isConnected ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSyncMenu(company.id)}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Sync Menu</span>
                          </button>
                          <button
                            onClick={() => handleDisconnect(company.id)}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowConnectModal(company)}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Delivery Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveryOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Order #{order.deliveryCompanyOrderId.slice(0, 8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(order.orderTime), 'MMM dd, yyyy HH:mm')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.items.length} items
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.source}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${order.subtotal.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'received' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowOrderDetail(order)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status === 'received' && (
                            <>
                              <button
                                onClick={() => handleAcceptOrder(order.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectOrder(order.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders by Company */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Platform</h2>
              <div className="space-y-3">
                {Object.entries(analytics.ordersByCompany).map(([company, orders]) => (
                  <div key={company} className="flex items-center justify-between">
                    <span className="text-gray-700">{company}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${(orders / analytics.totalOrders) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{orders}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by Company */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Platform</h2>
              <div className="space-y-3">
                {Object.entries(analytics.revenueByCompany).map(([company, revenue]) => (
                  <div key={company} className="flex items-center justify-between">
                    <span className="text-gray-700">{company}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(revenue / analytics.totalRevenue) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">${revenue.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Items */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Delivery Items</h2>
            <div className="space-y-3">
              {analytics.popularItems.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">{index + 1}</span>
                    </div>
                    <span className="text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{item.orders} orders</div>
                    <div className="text-xs text-gray-500">${item.revenue.toFixed(2)} revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <ConnectDeliveryModal
          company={showConnectModal}
          onClose={() => setShowConnectModal(null)}
          onConnect={handleConnect}
        />
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && (
        <DeliveryOrderDetailModal
          order={showOrderDetail}
          onClose={() => setShowOrderDetail(null)}
          onAccept={() => handleAcceptOrder(showOrderDetail.id)}
          onReject={() => handleRejectOrder(showOrderDetail.id)}
        />
      )}
    </div>
  );
};

// Connect Delivery Modal Component
interface ConnectDeliveryModalProps {
  company: DeliveryCompany;
  onClose: () => void;
  onConnect: (company: DeliveryCompany, credentials: any) => void;
}

const ConnectDeliveryModal: React.FC<ConnectDeliveryModalProps> = ({ company, onClose, onConnect }) => {
  const [credentials, setCredentials] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConnect(company, credentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Connect to {company.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Company Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={company.logo || 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?auto=compress&cs=tinysrgb&w=100'}
                alt={company.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{company.name}</h3>
                <p className="text-sm text-gray-600">{company.commission}% commission rate</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{company.description}</p>
          </div>

          {/* Setup Steps */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Setup Process</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              {company.setupSteps?.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Requirements</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {company.requirements?.map((requirement, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-medium text-gray-900">Connection Details</h3>
            
            {company.authType === 'api_key' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={credentials.apiKey || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your API key"
                  required
                />
              </div>
            )}

            {company.authType === 'oauth' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={credentials.clientId || ''}
                    onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={credentials.clientSecret || ''}
                    onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            {company.authType === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={credentials.username || ''}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={credentials.password || ''}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Make sure you have completed the partner registration process with {company.name} 
                    before connecting. Your restaurant profile and menu will be automatically synced.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? 'Connecting...' : 'Connect'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delivery Order Detail Modal Component
interface DeliveryOrderDetailModalProps {
  order: DeliveryOrder;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

const DeliveryOrderDetailModal: React.FC<DeliveryOrderDetailModalProps> = ({ 
  order, 
  onClose, 
  onAccept, 
  onReject 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Delivery Order Details
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Platform:</span> {order.source}</div>
                <div><span className="font-medium">Order ID:</span> {order.deliveryCompanyOrderId}</div>
                <div><span className="font-medium">Order Time:</span> {format(new Date(order.orderTime), 'MMM dd, yyyy HH:mm')}</div>
                <div><span className="font-medium">Status:</span> {order.status}</div>
                <div><span className="font-medium">Payment:</span> {order.paymentStatus}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {order.customer.name}</div>
                <div><span className="font-medium">Phone:</span> {order.customer.phone}</div>
                {order.customer.email && (
                  <div><span className="font-medium">Email:</span> {order.customer.email}</div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900">
                {order.customer.deliveryAddress.line1}
                {order.customer.deliveryAddress.line2 && (
                  <>, {order.customer.deliveryAddress.line2}</>
                )}
              </p>
              <p className="text-sm text-gray-900">
                {order.customer.deliveryAddress.city}, {order.customer.deliveryAddress.state} {order.customer.deliveryAddress.postalCode}
              </p>
              {order.customer.deliveryAddress.instructions && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Instructions:</span> {order.customer.deliveryAddress.instructions}
                </p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Price</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.specialInstructions && (
                            <div className="text-xs text-gray-500">{item.specialInstructions}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal (Restaurant):</span>
                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium">${order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee:</span>
                <span className="font-medium">${order.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${order.tax.toFixed(2)}</span>
              </div>
              {order.tip && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tip:</span>
                  <span className="font-medium">${order.tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium text-gray-900">Customer Total:</span>
                <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{order.specialInstructions}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {order.status === 'received' && (
            <div className="flex space-x-4 pt-6 border-t">
              <button
                onClick={onReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Order</span>
              </button>
              <button
                onClick={onAccept}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Accept Order</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};