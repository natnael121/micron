import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  ShoppingBag,
  DollarSign,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { RestaurantCustomer } from '../../types/supplier';
import { format } from 'date-fns';

export const SupplierCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<RestaurantCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'revenue' | 'lastOrder'>('revenue');

  // Get supplier info from localStorage
  const supplierUser = JSON.parse(localStorage.getItem('supplierUser') || '{}');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    if (!supplierUser.supplierId) return;
    
    try {
      setLoading(true);
      const customersData = await firebaseService.getSupplierCustomers(supplierUser.supplierId);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCustomers = customers
    .filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'revenue':
          return b.totalSpent - a.totalSpent;
        case 'lastOrder':
          if (!a.lastOrderDate) return 1;
          if (!b.lastOrderDate) return -1;
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Customers</h1>
          <p className="text-gray-600">Manage your restaurant partnerships</p>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="orders">Sort by Orders</option>
              <option value="name">Sort by Name</option>
              <option value="lastOrder">Sort by Last Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.address.city}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                customer.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Orders:</span>
                <span className="text-sm font-medium text-gray-900">{customer.totalOrders}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Spent:</span>
                <span className="text-sm font-medium text-gray-900">${customer.totalSpent.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Order:</span>
                <span className="text-sm font-medium text-gray-900">${customer.averageOrderValue.toFixed(2)}</span>
              </div>

              {customer.lastOrderDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Order:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(customer.lastOrderDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{customer.contactEmail}</span>
                </div>
                {customer.contactPhone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                    <Phone className="w-4 h-4" />
                    <span>{customer.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAndSortedCustomers.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No restaurants have placed orders yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};