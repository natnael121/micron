import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Building2, 
  Globe, 
  Package, 
  ShoppingCart,
  FileText,
  TrendingUp,
  Search,
  Filter,
  Download,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supplierService } from '../../services/supplierService';
import { firebaseService } from '../../services/firebase';
import { Supplier, SupplierProduct, PurchaseOrder } from '../../types/supplier';
import { SupplierModal } from './SupplierModal';
import { ProductModal } from './ProductModal';
import { PurchaseOrderModal } from './PurchaseOrderModal';
import { SupplierDetailModal } from './SupplierDetailModal';

export const SupplierManagement: React.FC = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders' | 'analytics'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<'all' | 'global' | 'restaurant'>('all');
  
  // Modals
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState<Supplier | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<Record<string, SupplierProduct[]>>({});
  const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Loading supplier data for restaurant:', user.id);
      
      let suppliersData: Supplier[] = [];
      let ordersData: PurchaseOrder[] = [];
      
      try {
        // Use Firebase service directly to ensure we get all suppliers
        suppliersData = await firebaseService.getSuppliers(user.id);
        console.log('Suppliers loaded:', suppliersData.length);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        suppliersData = [];
      }
      
      try {
        // Use Firebase service directly for purchase orders
        ordersData = await firebaseService.getPurchaseOrders(user.id);
        console.log('Purchase orders loaded:', ordersData.length);
      } catch (error) {
        console.error('Error loading purchase orders:', error);
        ordersData = [];
      }
      
      setSuppliers(suppliersData);
      setPurchaseOrders(ordersData);
      
      // Load products for each supplier
      await loadProductsForSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading supplier data:', error);
      // Set empty arrays to prevent crashes
      setSuppliers([]);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsForSuppliers = async (suppliers: Supplier[]) => {
    const productPromises = suppliers.map(async (supplier) => {
      try {
        setLoadingProducts(prev => ({ ...prev, [supplier.id]: true }));
        console.log('Loading products for supplier:', supplier.id, supplier.name);
        
        // Use Firebase service directly to get all products for this supplier
        const productsData = await firebaseService.getAllSupplierProducts(supplier.id);
        console.log(`Products loaded for ${supplier.name}:`, productsData.length);
        
        setSupplierProducts(prev => ({
          ...prev,
          [supplier.id]: productsData
        }));
      } catch (error) {
        console.error(`Error loading products for supplier ${supplier.name}:`, error);
        setSupplierProducts(prev => ({
          ...prev,
          [supplier.id]: []
        }));
      } finally {
        setLoadingProducts(prev => ({ ...prev, [supplier.id]: false }));
      }
    });
    
    await Promise.all(productPromises);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await supplierService.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Failed to delete supplier');
    }
  };

  const handleCreatePurchaseOrder = async (orderData: any) => {
    try {
      const orderId = await supplierService.addPurchaseOrder({
        ...orderData,
        restaurantId: user!.id,
        createdBy: user!.id
      });
      
      await loadData();
      setShowCreateOrder(null);
      alert('Purchase order created successfully!');
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = supplierFilter === 'all' || 
                         (supplierFilter === 'global' && supplier.type === 'global') ||
                         (supplierFilter === 'restaurant' && supplier.type === 'restaurant_specific');
    
    return matchesSearch && matchesFilter;
  });

  const exportSuppliers = () => {
    const csvContent = [
      ['Name', 'Type', 'Email', 'Phone', 'City', 'Total Orders', 'Total Revenue', 'Status'].join(','),
      ...filteredSuppliers.map(supplier => [
        supplier.name,
        supplier.type === 'global' ? 'Global' : 'Restaurant',
        supplier.email,
        supplier.phone,
        supplier.address.city,
        supplier.totalOrders || 0,
        supplier.totalRevenue?.toFixed(2) || '0.00',
        supplier.isActive ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600">Manage suppliers and purchase orders</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportSuppliers}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddSupplier(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'suppliers', label: 'Suppliers', icon: Building2 },
            { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Suppliers</option>
                  <option value="global">Global Suppliers</option>
                  <option value="restaurant">My Suppliers</option>
                </select>
              </div>
            </div>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      supplier.type === 'global' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {supplier.type === 'global' ? (
                        <Globe className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Building2 className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-500">
                        {supplier.type === 'global' ? 'Global Supplier' : 'My Supplier'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingSupplier(supplier)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {supplier.type === 'restaurant_specific' && (
                      <>
                        <button
                          onClick={() => setEditingSupplier(supplier)}
                          className="text-green-600 hover:text-green-700 p-1"
                          title="Edit Supplier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contact:</span>
                    <span className="text-sm font-medium text-gray-900">{supplier.contactPerson.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium text-gray-900">{supplier.address.city}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Products:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {loadingProducts[supplier.id] ? (
                        <span className="text-gray-500">Loading...</span>
                      ) : (
                        <>
                          {supplierProducts[supplier.id]?.filter(p => p.isAvailable).length || 0} available
                          {supplierProducts[supplier.id]?.length ? 
                            ` of ${supplierProducts[supplier.id].length} total` : 
                            ''
                          }
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Orders:</span>
                    <span className="text-sm font-medium text-gray-900">{supplier.totalOrders || 0}</span>
                  </div>

                  <div className="pt-3 border-t">
                    <button
                      onClick={() => setShowCreateOrder(supplier)}
                      disabled={!supplierProducts[supplier.id]?.some(p => p.isAvailable)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>
                        {loadingProducts[supplier.id] ? 'Loading...' : 
                         !supplierProducts[supplier.id]?.some(p => p.isAvailable) ? 'No Products Available' : 
                         'Create Order'}
                      </span>
                    </button>
                    
                    {/* Product Summary */}
                    {supplierProducts[supplier.id] && supplierProducts[supplier.id].length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-green-600 font-medium">
                              {supplierProducts[supplier.id].filter(p => p.isAvailable).length}
                            </span> available
                          </div>
                          <div>
                            <span className="text-gray-600 font-medium">
                              {supplierProducts[supplier.id].filter(p => !p.isAvailable).length}
                            </span> unavailable
                          </div>
                        </div>
                        
                        {/* Show categories */}
                        {(() => {
                          const categories = [...new Set(supplierProducts[supplier.id].map(p => p.category))];
                          if (categories.length > 0) {
                            return (
                              <div className="mt-1">
                                <span className="text-gray-500">Categories: </span>
                                <span className="text-gray-700">
                                  {categories.slice(0, 2).join(', ')}
                                  {categories.length > 2 && ` +${categories.length - 2} more`}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredSuppliers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add your first supplier to get started'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddSupplier(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Supplier
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Debug Info */}
          {!loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Debug Information</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Total Suppliers:</strong> {suppliers.length}</p>
                <p><strong>Filtered Suppliers:</strong> {filteredSuppliers.length}</p>
                <p><strong>Products Loaded:</strong> {Object.keys(supplierProducts).length} suppliers</p>
                <div className="mt-2">
                  <strong>Product Summary:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {Object.entries(supplierProducts).map(([supplierId, products]) => {
                      const supplier = suppliers.find(s => s.id === supplierId);
                      return (
                        <li key={supplierId}>
                          {supplier?.name}: {products.filter(p => p.isAvailable).length} available, {products.filter(p => !p.isAvailable).length} unavailable
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Purchase Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
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
                  {purchaseOrders.map((order) => {
                    const supplier = suppliers.find(s => s.id === order.supplierId);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.orderDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.items.length} items
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{supplier?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{supplier?.address.city}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${order.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <SupplierAnalytics restaurantId={user?.id} />
      )}

      {/* Modals */}
      {(showAddSupplier || editingSupplier) && (
        <SupplierModal
          supplier={editingSupplier}
          restaurantId={user?.id || ''}
          onClose={() => {
            setShowAddSupplier(false);
            setEditingSupplier(null);
          }}
          onSave={(supplier) => {
            if (editingSupplier) {
              setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
            } else {
              setSuppliers(prev => [...prev, supplier]);
            }
            setShowAddSupplier(false);
            setEditingSupplier(null);
          }}
        />
      )}

      {viewingSupplier && (
        <SupplierDetailModal
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
          onCreateOrder={() => {
            setShowCreateOrder(viewingSupplier);
            setViewingSupplier(null);
          }}
        />
      )}

      {showCreateOrder && (
        <PurchaseOrderModal
          supplier={showCreateOrder}
          restaurantId={user?.id || ''}
          onClose={() => setShowCreateOrder(null)}
          onSave={handleCreatePurchaseOrder}
        />
      )}

      {viewingOrder && (
        <PurchaseOrderDetailModal
          order={viewingOrder}
          supplier={suppliers.find(s => s.id === viewingOrder.supplierId)}
          onClose={() => setViewingOrder(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

// Supplier Analytics Component
interface SupplierAnalyticsProps {
  restaurantId?: string;
}

const SupplierAnalytics: React.FC<SupplierAnalyticsProps> = ({ restaurantId }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [restaurantId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSupplierAnalytics(restaurantId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalSuppliers || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Purchase Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalPurchaseOrders || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900">${analytics?.totalPurchaseValue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">${analytics?.averageOrderValue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers</h2>
        <div className="space-y-4">
          {analytics?.topSuppliers?.slice(0, 5).map((supplier: any, index: number) => (
            <div key={supplier.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                  <div className="text-xs text-gray-500">{supplier.orders} orders</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">${supplier.revenue.toFixed(2)}</div>
                {supplier.restaurants > 1 && (
                  <div className="text-xs text-gray-500">{supplier.restaurants} restaurants</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Purchase Order Detail Modal Component
interface PurchaseOrderDetailModalProps {
  order: PurchaseOrder;
  supplier?: Supplier;
  onClose: () => void;
  onUpdate: () => void;
}

const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({ 
  order, 
  supplier, 
  onClose, 
  onUpdate 
}) => {
  const [updating, setUpdating] = useState(false);

  const updateOrderStatus = async (status: PurchaseOrder['status']) => {
    setUpdating(true);
    try {
      await supplierService.updatePurchaseOrder(order.id, { status });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Purchase Order {order.orderNumber}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FileText className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Order Number:</span> {order.orderNumber}</div>
                <div><span className="font-medium">Order Date:</span> {new Date(order.orderDate).toLocaleDateString()}</div>
                <div><span className="font-medium">Status:</span> {order.status}</div>
                <div><span className="font-medium">Total:</span> ${order.total.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Supplier Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {supplier?.name || 'Unknown'}</div>
                <div><span className="font-medium">Contact:</span> {supplier?.contactPerson.name}</div>
                <div><span className="font-medium">Email:</span> {supplier?.email}</div>
                <div><span className="font-medium">Phone:</span> {supplier?.phone}</div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">SKU</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unit Price</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.sku || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discount:</span>
                  <span className="text-sm font-medium text-green-600">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tax:</span>
                <span className="text-sm font-medium">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Shipping:</span>
                <span className="text-sm font-medium">${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          {order.status !== 'cancelled' && order.status !== 'paid' && (
            <div className="flex justify-end space-x-4 pt-6 border-t">
              {order.status === 'draft' && (
                <button
                  onClick={() => updateOrderStatus('sent')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  Send to Supplier
                </button>
              )}
              {order.status === 'delivered' && (
                <button
                  onClick={() => updateOrderStatus('invoiced')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  Mark as Invoiced
                </button>
              )}
              {order.status === 'invoiced' && (
                <button
                  onClick={() => updateOrderStatus('paid')}
                  disabled={updating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  Mark as Paid
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};