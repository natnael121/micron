import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Package, 
  Truck, 
  Clock,
  DollarSign,
  Building2,
  Filter
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { SupplierOrderLocation } from '../../types/supplier';
import { format } from 'date-fns';

export const SupplierMap: React.FC = () => {
  const [locations, setLocations] = useState<SupplierOrderLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<SupplierOrderLocation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get supplier info from localStorage
  const supplierUser = JSON.parse(localStorage.getItem('supplierUser') || '{}');

  useEffect(() => {
    loadDeliveryLocations();
  }, []);

  const loadDeliveryLocations = async () => {
    if (!supplierUser.supplierId) return;
    
    try {
      setLoading(true);
      const [orders, restaurants] = await Promise.all([
        firebaseService.getSupplierOrders(supplierUser.supplierId),
        firebaseService.getAllUsers() // Get restaurant details for locations
      ]);
      
      // Convert orders to location data with real restaurant information
      const locationData: SupplierOrderLocation[] = orders.map(order => {
        const restaurant = restaurants.find(r => r.id === order.restaurantId);
        
        return {
          orderId: order.id,
          restaurantName: restaurant?.businessName || restaurant?.name || `Restaurant #${order.restaurantId.slice(0, 8)}`,
          address: order.deliveryAddress ? 
            `${order.deliveryAddress.line1}, ${order.deliveryAddress.city}` :
            restaurant?.address || 'Address not provided',
          latitude: order.deliveryAddress?.latitude || 
                   restaurant?.latitude || 
                   40.7128 + (Math.random() - 0.5) * 0.1, // Fallback to NYC area
          longitude: order.deliveryAddress?.longitude || 
                    restaurant?.longitude || 
                    -74.0060 + (Math.random() - 0.5) * 0.1,
          orderTotal: order.total,
          status: order.status,
          orderDate: order.created_at,
          restaurantLocation: restaurant ? {
            name: restaurant.businessName || restaurant.name || 'Unknown Restaurant',
            address: restaurant.address || 'Address not provided',
            latitude: restaurant.latitude || 40.7128,
            longitude: restaurant.longitude || -74.0060,
          } : undefined,
        };
      });
      
      setLocations(locationData);
    } catch (error) {
      console.error('Error loading delivery locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredLocations = locations.filter(location => 
    statusFilter === 'all' || location.status === statusFilter
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Map</h1>
          <p className="text-gray-600">Track deliveries and customer locations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Orders</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Map</h3>
            <p className="text-gray-600">Map integration would show delivery locations here</p>
          </div>
          
          {/* Mock location pins */}
          {filteredLocations.slice(0, 5).map((location, index) => (
            <div
              key={location.orderId}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${20 + index * 15}%`,
                top: `${30 + index * 10}%`,
              }}
              onClick={() => setSelectedLocation(location)}
            >
              <div className={`w-4 h-4 rounded-full ${getStatusColor(location.status)} border-2 border-white shadow-lg`} />
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.filter(l => ['confirmed', 'shipped'].includes(l.status)).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {locations.filter(l => {
                  const today = new Date().toISOString().split('T')[0];
                  return l.status === 'delivered' && l.orderDate.startsWith(today);
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
              <p className="text-2xl font-bold text-gray-900">2.5 days</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coverage Area</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(locations.map(l => l.address.split(',')[1]?.trim())).size} cities
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <Navigation className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Locations List */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Deliveries</h2>
        <div className="space-y-4">
          {filteredLocations.slice(0, 10).map((location) => (
            <div key={location.orderId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(location.status)}`} />
                <div>
                  <h4 className="font-medium text-gray-900">{location.restaurantName}</h4>
                  <p className="text-sm text-gray-600 flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{location.address}</span>
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">${location.orderTotal.toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(location.orderDate), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location Detail Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedLocation.restaurantName}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Total:</span>
                  <span className="font-medium">${selectedLocation.orderTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLocation.status)} text-white`}>
                    {selectedLocation.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">
                    {format(new Date(selectedLocation.orderDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-sm text-gray-700">{selectedLocation.address}</span>
                  </div>
                  {selectedLocation.restaurantLocation && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p><strong>Restaurant:</strong> {selectedLocation.restaurantLocation.name}</p>
                      <p><strong>Location:</strong> {selectedLocation.restaurantLocation.address}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedLocation(null)}
                className="w-full mt-6 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};