import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Eye,
  Package,
  MapPin,
  FileText,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supplierService } from '../../services/supplierService';
import { firebaseService } from '../../services/firebase';
import { SupplierDashboardStats, RestaurantCustomer, PurchaseOrder } from '../../types/supplier';
import { format, subDays } from 'date-fns';

export const SupplierDashboard: React.FC = () => {
  const [stats, setStats] = useState<SupplierDashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);
  const [topCustomers, setTopCustomers] = useState<RestaurantCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Get supplier info from localStorage
  const supplierUser = JSON.parse(localStorage.getItem('supplierUser') || '{}');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    if (!supplierUser.supplierId) {
      console.warn('No supplier ID found in session');
      return;
    }
    
    try {
      setLoading(true);
      const [orders, customers] = await Promise.all([
        firebaseService.getSupplierOrders(supplierUser.supplierId),
        firebaseService.getSupplierCustomers(supplierUser.supplierId)
      ]);
      
      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyOrders = orders.filter(order => 
        new Date(order.created_at) >= startOfMonth
      );
      
      const activeOrders = orders.filter(order => 
        ['sent', 'confirmed', 'shipped'].includes(order.status)
      );
      
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0);
      
      // Calculate average delivery time
      const deliveredOrders = orders.filter(order => 
        order.status === 'delivered' && order.actualDeliveryDate && order.orderDate
      );
      
      const avgDeliveryTime = deliveredOrders.length > 0 
        ? deliveredOrders.reduce((sum, order) => {
            const orderDate = new Date(order.orderDate);
            const deliveryDate = new Date(order.actualDeliveryDate!);
            const diffDays = Math.ceil((deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }, 0) / deliveredOrders.length
        : 0;

      setStats({
        activeOrders: activeOrders.length,
        monthlyRevenue,
        restaurantCustomers: customers.length,
        averageDeliveryTime: avgDeliveryTime,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'sent').length,
        completedOrders: orders.filter(o => o.status === 'delivered').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      });
      
      setRecentOrders(orders.slice(0, 10));
      setTopCustomers(customers.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRevenueChartData = () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      
      // Filter orders for this date
      const dayOrders = recentOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.toDateString() === date.toDateString();
      });
      
      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const orders = dayOrders.length;
      
      data.push({
        date: dateStr,
        revenue,
        orders,
      });
    }
    
    return data;
  };

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const chartData = getRevenueChartData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600">Welcome back, {supplierUser.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeOrders || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.pendingOrders || 0} pending approval
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <ShoppingBag className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats?.monthlyRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.completedOrders || 0} completed orders
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Restaurant Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.restaurantCustomers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                Active partnerships
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.averageDeliveryTime?.toFixed(1) || '0'} days</p>
              <p className="text-xs text-gray-500 mt-1">
                From order to delivery
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Orders Trend</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
                name="revenue"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="orders" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
                name="orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link
              to="/supplier/orders"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
            <Link
              to="/supplier/customers"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.totalOrders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${customer.totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    Avg: ${customer.averageOrderValue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/supplier/orders?status=sent"
            className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Pending Orders</p>
                <p className="text-sm text-yellow-700">{stats?.pendingOrders || 0} need attention</p>
              </div>
            </div>
          </Link>

          <Link
            to="/supplier/products"
            className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Manage Products</p>
                <p className="text-sm text-blue-700">Update catalog</p>
              </div>
            </div>
          </Link>

          <Link
            to="/supplier/map"
            className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Delivery Map</p>
                <p className="text-sm text-green-700">View locations</p>
              </div>
            </div>
          </Link>

          <Link
            to="/supplier/invoices"
            className="bg-purple-50 border border-purple-200 p-4 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Invoices</p>
                <p className="text-sm text-purple-700">Manage billing</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};