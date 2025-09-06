import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Eye, Calendar, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { MenuStats } from '../../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MenuStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
      loadFeedbacks();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const analytics = await firebaseService.getMenuStats(user.id);
      setStats(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbacks = () => {
    try {
      const storedFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      
      // Filter by date range
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const filteredFeedbacks = storedFeedbacks.filter((feedback: any) => 
        new Date(feedback.timestamp) >= cutoffDate
      );
      
      setFeedbacks(filteredFeedbacks);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      setFeedbacks([]);
    }
  };
  const getDateRangeData = () => {
    if (!stats) return [];
    
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      
      // This would normally come from your analytics data
      // For now, we'll generate some sample data based on the date
      const revenue = Math.random() * 500 + 100;
      const orders = Math.floor(Math.random() * 20) + 5;
      
      data.push({
        date: dateStr,
        revenue: revenue,
        orders: orders,
      });
    }
    
    return data;
  };

  const getTopItemsData = () => {
    if (!stats?.popularItems) return [];
    
    return stats.popularItems.slice(0, 5).map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      orders: item.orders,
    }));
  };

  const getCategoryData = () => {
    if (!stats?.popularItems) return [];
    
    const categoryMap: Record<string, number> = {};
    stats.popularItems.forEach(item => {
      // This would normally come from your menu items data
      const category = 'Category'; // Placeholder
      categoryMap[category] = (categoryMap[category] || 0) + item.orders;
    });
    
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    return Object.entries(categoryMap).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
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

  const chartData = getDateRangeData();
  const topItemsData = getTopItemsData();
  const categoryData = getCategoryData();

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue.toFixed(2) || '0.00'}`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders.toString() || '0',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Menu Views',
      value: stats?.totalViews.toString() || '0',
      change: '+15.3%',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg Order Value',
      value: `$${stats?.totalOrders ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}`,
      change: '+5.1%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your restaurant's performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue & Orders Chart */}
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
        {/* Top Items Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItemsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => [`${value} orders`, 'Orders']} />
                <Bar dataKey="orders" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} orders`, 'Orders']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {stats?.recentOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    New order from Table {order.tableNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Feedback Analytics */}
      {feedbacks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback Analytics</h2>
          
          {/* Feedback Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{feedbacks.length}</div>
              <div className="text-sm text-gray-600">Total Feedbacks</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {feedbacks.filter(f => f.rating >= 4).length}
              </div>
              <div className="text-sm text-gray-600">Positive Reviews</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {feedbacks.filter(f => f.comment && f.comment.trim()).length}
              </div>
              <div className="text-sm text-gray-600">With Comments</div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = feedbacks.filter(f => f.rating === rating).length;
                const percentage = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <span className="text-yellow-400">⭐</span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          rating >= 4 ? 'bg-green-500' :
                          rating >= 3 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Comments */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Comments</h3>
            <div className="space-y-3">
              {feedbacks
                .filter(f => f.comment && f.comment.trim())
                .slice(0, 3)
                .map((feedback, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    feedback.rating >= 4 ? 'bg-green-50 border-green-200' :
                    feedback.rating >= 3 ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {feedback.customerInfo?.telegramPhoto ? (
                          <img 
                            src={feedback.customerInfo.telegramPhoto} 
                            alt={feedback.customerInfo.name || 'Customer'}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">
                              {(feedback.customerInfo?.name || 'A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {feedback.customerInfo?.name || feedback.customerInfo?.telegramUsername || 'Anonymous'}
                        </span>
                        <span className="text-sm text-gray-500">Table {feedback.tableNumber}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-sm ${
                            i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{feedback.comment}"</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(feedback.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
            
            {feedbacks.filter(f => f.comment && f.comment.trim()).length > 3 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    const commentsWithFeedback = feedbacks.filter(f => f.comment && f.comment.trim());
                    alert(`${commentsWithFeedback.length} total comments received. Consider implementing a detailed feedback management system.`);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All Comments ({feedbacks.filter(f => f.comment && f.comment.trim()).length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};