import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, MapPin, Package, Plus, Calendar, DollarSign, ShoppingCart, Eye } from 'lucide-react';
import { Supplier, SupplierProduct, PurchaseOrder } from '../../types/supplier';
import { supplierService } from '../../services/supplierService';
import { format } from 'date-fns';

interface SupplierDetailModalProps {
  supplier: Supplier;
  onClose: () => void;
  onCreateOrder?: (supplierId: string) => void;
}

export function SupplierDetailModal({ supplier, onClose, onCreateOrder }: SupplierDetailModalProps) {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'orders'>('info');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, ordersData] = await Promise.all([
          supplierService.getAllSupplierProducts(supplier.id), // Use getAllSupplierProducts to get all products including unavailable ones
          supplierService.getSupplierOrders(supplier.id)
        ]);
        setProducts(productsData);
        setRecentOrders(ordersData.slice(0, 5)); // Show last 5 orders
      } catch (error) {
        console.error('Error loading supplier data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supplier.id]);

  const handleCreateOrder = () => {
    if (onCreateOrder) {
      onCreateOrder(supplier.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {supplier.type === 'global' ? 'Global Supplier' : 'Restaurant Specific'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recent Orders
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{supplier.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{supplier.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">{supplier.address.line1}</p>
                    {supplier.address.line2 && <p>{supplier.address.line2}</p>}
                    <p>{supplier.address.city}, {supplier.address.state} {supplier.address.postalCode}</p>
                    <p>{supplier.address.country}</p>
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              {supplier.contactPerson && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Person</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{supplier.contactPerson.name}</p>
                    {supplier.contactPerson.position && (
                      <p className="text-sm text-gray-600">{supplier.contactPerson.position}</p>
                    )}
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <Mail className="w-4 h-4 inline mr-2" />
                        {supplier.contactPerson.email}
                      </p>
                      <p className="text-sm">
                        <Phone className="w-4 h-4 inline mr-2" />
                        {supplier.contactPerson.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Terms */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium capitalize">{supplier.paymentTerms.method.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Net Days</p>
                      <p className="font-medium">{supplier.paymentTerms.daysNet} days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Minimum Order</p>
                      <p className="font-medium">${supplier.deliveryInfo.minimumOrder}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Delivery Fee</p>
                      <p className="font-medium">${supplier.deliveryInfo.deliveryFee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Free Delivery Threshold</p>
                      <p className="font-medium">${supplier.deliveryInfo.freeDeliveryThreshold}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estimated Delivery</p>
                      <p className="font-medium">{supplier.deliveryInfo.estimatedDeliveryDays} days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {products.filter(p => p.isAvailable).length} available of {products.length} total
                  </span>
                  {onCreateOrder && (
                    <button
                      onClick={handleCreateOrder}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Create Order</span>
                    </button>
                  )}
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No products available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className={`border rounded-lg p-4 ${
                      product.isAvailable ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            product.isAvailable ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <h4 className={`font-medium ${
                            product.isAvailable ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {product.name}
                          </h4>
                        </div>
                        <span className={`text-lg font-bold ${
                          product.isAvailable ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          ${product.unitPrice.toFixed(2)}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 line-clamp-2 ${
                        product.isAvailable ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {product.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Category:</span>
                          <span className={product.isAvailable ? 'text-gray-900' : 'text-gray-500'}>
                            {product.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Unit:</span>
                          <span className={product.isAvailable ? 'text-gray-900' : 'text-gray-500'}>
                            {product.unit}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Min Order:</span>
                          <span className={product.isAvailable ? 'text-gray-900' : 'text-gray-500'}>
                            {product.minimumOrderQuantity} {product.unit}
                          </span>
                        </div>
                        
                        {product.sku && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">SKU:</span>
                            <span className={`font-mono text-xs ${
                              product.isAvailable ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                              {product.sku}
                            </span>
                          </div>
                        )}
                        
                        {product.brand && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Brand:</span>
                            <span className={product.isAvailable ? 'text-gray-900' : 'text-gray-500'}>
                              {product.brand}
                            </span>
                          </div>
                        )}
                        
                        {product.leadTimeDays && product.leadTimeDays > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Lead Time:</span>
                            <span className={product.isAvailable ? 'text-gray-900' : 'text-gray-500'}>
                              {product.leadTimeDays} days
                            </span>
                          </div>
                        )}
                        
                        {product.stockQuantity !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Stock:</span>
                            <span className={`font-medium ${
                              !product.isAvailable ? 'text-gray-400' :
                              product.stockQuantity > 10 ? 'text-green-600' : 
                              product.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {product.stockQuantity} {product.unit}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {!product.isAvailable && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-red-600 font-medium">Currently Unavailable</span>
                        </div>
                      )}
                      
                      {product.images && product.images.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex space-x-2">
                            {product.images.slice(0, 3).map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`${product.name} ${index + 1}`}
                                className="w-12 h-12 object-cover rounded border"
                              />
                            ))}
                            {product.images.length > 3 && (
                              <span className="text-sm text-gray-500">
                                +{product.images.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <span className="text-sm text-gray-500">{recentOrders.length} orders</span>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading orders...</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(order.created_at), 'MMM dd, yyyy')}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'sent' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {order.items.length} items
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${order.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} total items
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Payment: {supplier.paymentTerms.daysNet} days net
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Min order: ${supplier.deliveryInfo?.minimumOrder || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {products.length} products available
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {onCreateOrder && (
              <button
                onClick={handleCreateOrder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};