import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Minus, Trash2, Search, Package } from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import { Supplier, SupplierProduct } from '../../types/supplier';

interface PurchaseOrderModalProps {
  supplier: Supplier;
  restaurantId: string;
  onClose: () => void;
  onSave: (orderData: any) => void;
}

interface OrderItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
  notes?: string;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  supplier,
  restaurantId,
  onClose,
  onSave,
}) => {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notes, setNotes] = useState('');
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [supplier.id]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await supplierService.getSupplierProducts(supplier.id);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (product: SupplierProduct) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + product.minimumOrderQuantity);
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: product.minimumOrderQuantity,
        unitPrice: product.unitPrice,
        unit: product.unit,
        total: product.unitPrice * product.minimumOrderQuantity,
      };
      setOrderItems(prev => [...prev, newItem]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(productId);
      return;
    }

    setOrderItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity, total: item.unitPrice * quantity }
        : item
    ));
  };

  const removeFromOrder = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateNotes = (productId: string, notes: string) => {
    setOrderItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, notes } : item
    ));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal >= (supplier.deliveryInfo?.freeDeliveryThreshold || 0) 
      ? 0 
      : (supplier.deliveryInfo?.deliveryFee || 0);
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    setSaving(true);

    try {
      const { subtotal, tax, shipping, total } = calculateTotals();
      
      const orderData = {
        supplierId: supplier.id,
        items: orderItems,
        subtotal,
        tax,
        shipping,
        discount: 0,
        total,
        status: 'draft' as const,
        paymentStatus: 'pending' as const,
        orderDate: new Date().toISOString(),
        requestedDeliveryDate: requestedDeliveryDate || undefined,
        notes,
      };

      await onSave(orderData);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory && product.isAvailable;
  });

  const categories = [...new Set(products.map(p => p.category))];
  const { subtotal, tax, shipping, total } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Purchase Order</h2>
              <p className="text-gray-600">Supplier: {supplier.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Products Catalog */}
          <div className="w-1/2 border-r p-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Available Products</h3>
              
              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Products List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>${product.unitPrice.toFixed(2)}/{product.unit}</span>
                            <span>Min: {product.minimumOrderQuantity} {product.unit}</span>
                            {product.sku && <span>SKU: {product.sku}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => addToOrder(product)}
                          className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {!loading && filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No products found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>

              {/* Order Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2" />
                    <p>No items added yet</p>
                  </div>
                ) : (
                  orderItems.map((item) => (
                    <div key={item.productId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <button
                          type="button"
                          onClick={() => removeFromOrder(item.productId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium">{item.quantity} {item.unit}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-right">
                          <span className="font-medium">${item.total.toFixed(2)}</span>
                          <div className="text-xs text-gray-500">
                            ${item.unitPrice.toFixed(2)} each
                          </div>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Notes for this item..."
                        value={item.notes || ''}
                        onChange={(e) => updateNotes(item.productId, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Order Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requested Delivery Date
                  </label>
                  <input
                    type="date"
                    value={requestedDeliveryDate}
                    onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Special instructions or notes for this order..."
                  />
                </div>
              </div>

              {/* Order Totals */}
              {orderItems.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (8%):</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">
                        {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              {supplier.deliveryInfo && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Delivery Information</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    {supplier.deliveryInfo.minimumOrder > 0 && (
                      <p>• Minimum order: ${supplier.deliveryInfo.minimumOrder.toFixed(2)}</p>
                    )}
                    {supplier.deliveryInfo.freeDeliveryThreshold > 0 && (
                      <p>• Free delivery over: ${supplier.deliveryInfo.freeDeliveryThreshold.toFixed(2)}</p>
                    )}
                    <p>• Estimated delivery: {supplier.deliveryInfo.estimatedDeliveryDays} days</p>
                  </div>
                </div>
              )}

              {/* Submit */}
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
                  disabled={saving || orderItems.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Creating...' : 'Create Purchase Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};