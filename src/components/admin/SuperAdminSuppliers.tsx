import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Globe, 
  Building2, 
  TrendingUp, 
  Package, 
  Users,
  DollarSign,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import { Supplier, SupplierAnalytics } from '../../types/supplier';
import { SupplierModal } from './SupplierModal';
import { SupplierDetailModal } from './SupplierDetailModal';
import { format } from 'date-fns';

export const SuperAdminSuppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [analytics, setAnalytics] = useState<SupplierAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'analytics'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'global' | 'restaurant'>('all');
  
  // Modals
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading all suppliers for super admin');
      
      let suppliersData: Supplier[] = [];
      let analyticsData: SupplierAnalytics | null = null;
      
      try {
        suppliersData = await supplierService.getAllSuppliers();
        console.log('All suppliers loaded:', suppliersData.length);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        suppliersData = [];
      }
      
      try {
        analyticsData = await supplierService.getSupplierAnalytics();
        console.log('Analytics loaded');
      } catch (error) {
        console.error('Error loading analytics:', error);
        analyticsData = null;
      }
      
      setSuppliers(suppliersData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading supplier data:', error);
      setSuppliers([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier? This will affect all restaurants using this supplier.')) return;
    
    try {
      await supplierService.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Failed to delete supplier');
    }
  };

  const handleCreateGlobalSupplier = async (supplierData: any) => {
    try {
      const globalSupplierData = {
        ...supplierData,
        type: 'global' as const,
        createdBy: 'super_admin', // In real app, use actual super admin ID
      };
      
      const id = await supplierService.addSupplier(globalSupplierData);
      setSuppliers(prev => [...prev, { id, ...globalSupplierData } as Supplier]);
      setShowAddSupplier(false);
      alert('Global supplier created successfully!');
    } catch (error) {
      console.error('Error creating global supplier:', error);
      alert('Failed to create supplier');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'global' && supplier.type === 'global') ||
                       (typeFilter === 'restaurant' && supplier.type === 'restaurant_specific');
    
    return matchesSearch && matchesType;
  });

  const exportSuppliers = () => {
    const csvContent = [
      ['Name', 'Type', 'Email', 'Phone', 'City', 'Total Orders', 'Total Revenue', 'Status', 'Created'].join(','),
      ...filteredSuppliers.map(supplier => [
        supplier.name,
        supplier.type === 'global' ? 'Global' : 'Restaurant',
        supplier.email,
        supplier.phone,
        supplier.address.city,
        supplier.totalOrders || 0,
        supplier.totalRevenue?.toFixed(2) || '0.00',
        supplier.isActive ? 'Active' : 'Inactive',
        format(new Date(supplier.created_at), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600">Manage global suppliers and view platform analytics</p>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Global Supplier</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suppliers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>All Suppliers</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analytics</span>
          </button>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="global">Global Suppliers</option>
                  <option value="restaurant">Restaurant Suppliers</option>
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
                        {supplier.type === 'global' ? 'Global Supplier' : 'Restaurant Supplier'}
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
                    {supplier.type === 'global' && (
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
                    <span className="text-sm text-gray-600">Orders:</span>
                    <span className="text-sm font-medium text-gray-900">{supplier.totalOrders || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenue:</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${supplier.totalRevenue?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${
                      supplier.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredSuppliers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add your first global supplier to get started'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddSupplier(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Global Supplier
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalSuppliers}</p>
                  <p className="text-xs text-gray-500">
                    {analytics.globalSuppliers} global, {analytics.restaurantSuppliers} restaurant
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalPurchaseOrders}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchase Value</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.totalPurchaseValue.toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-gray-900">${analytics.averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers by Revenue</h2>
              <div className="space-y-4">
                {analytics.topSuppliers.slice(0, 5).map((supplier, index) => (
                  <div key={supplier.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-xs text-gray-500">{supplier.orders} orders</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">${supplier.revenue.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{supplier.restaurants} restaurants</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h2>
              <div className="space-y-3">
                {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(count / analytics.totalPurchaseOrders) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddSupplier && (
        <SupplierModal
          supplier={null}
          restaurantId="" // Global supplier
          isGlobal={true}
          onClose={() => setShowAddSupplier(false)}
          onSave={handleCreateGlobalSupplier}
        />
      )}

      {editingSupplier && (
        <SupplierModal
          supplier={editingSupplier}
          restaurantId=""
          isGlobal={true}
          onClose={() => setEditingSupplier(null)}
          onSave={(supplier) => {
            setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
            setEditingSupplier(null);
          }}
        />
      )}

      {viewingSupplier && (
        <SupplierDetailModal
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
          onCreateOrder={undefined}
        />
      )}
    </div>
  );
};