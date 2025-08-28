import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Package, 
  ShoppingCart,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Supplier, SupplierProduct } from '../../types/supplier';
import { supplierService } from '../../services/supplierService';
import { ProductModal } from './ProductModal';

interface SupplierDetailModalProps {
  supplier: Supplier;
  onClose: () => void;
  onCreateOrder: () => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  supplier,
  onClose,
  onCreateOrder,
}) => {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'products'>('info');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);

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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await supplierService.deleteSupplierProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const canManageProducts = supplier.type === 'restaurant_specific';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
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
                <h2 className="text-xl font-bold text-gray-900">{supplier.name}</h2>
                <p className="text-gray-600">
                  {supplier.type === 'global' ? 'Global Supplier' : 'Restaurant Supplier'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Supplier Information
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Products ({products.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Supplier Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Contact Information</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{supplier.contactPerson.name}</span>
                      {supplier.contactPerson.position && (
                        <span className="text-gray-500">({supplier.contactPerson.position})</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:text-blue-700">
                        {supplier.email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:text-blue-700">
                        {supplier.phone}
                      </a>
                    </div>
                    {supplier.businessInfo?.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <a 
                          href={supplier.businessInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Address</span>
                  </h3>
                  <div className="text-sm text-gray-700">
                    <p>{supplier.address.line1}</p>
                    {supplier.address.line2 && <p>{supplier.address.line2}</p>}
                    <p>
                      {supplier.address.city}, {supplier.address.state} {supplier.address.postalCode}
                    </p>
                    <p>{supplier.address.country}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              {supplier.businessInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {supplier.businessInfo.registrationNumber && (
                      <div>
                        <span className="font-medium text-gray-700">Registration Number:</span>
                        <span className="ml-2 text-gray-900">{supplier.businessInfo.registrationNumber}</span>
                      </div>
                    )}
                    {supplier.businessInfo.taxId && (
                      <div>
                        <span className="font-medium text-gray-700">Tax ID:</span>
                        <span className="ml-2 text-gray-900">{supplier.businessInfo.taxId}</span>
                      </div>
                    )}
                  </div>
                  {supplier.businessInfo.description && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="mt-1 text-gray-900">{supplier.businessInfo.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Terms */}
              {supplier.paymentTerms && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Terms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Method:</span>
                      <span className="ml-2 text-gray-900 capitalize">
                        {supplier.paymentTerms.method.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Terms:</span>
                      <span className="ml-2 text-gray-900">Net {supplier.paymentTerms.daysNet} days</span>
                    </div>
                    {supplier.paymentTerms.discountPercent > 0 && (
                      <>
                        <div>
                          <span className="font-medium text-gray-700">Early Discount:</span>
                          <span className="ml-2 text-gray-900">{supplier.paymentTerms.discountPercent}%</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Discount Period:</span>
                          <span className="ml-2 text-gray-900">{supplier.paymentTerms.discountDays} days</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={onCreateOrder}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Create Purchase Order</span>
                </button>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                {canManageProducts && (
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {canManageProducts && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-medium">${product.unitPrice.toFixed(2)}/{product.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">{product.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min Order:</span>
                          <span className="font-medium">{product.minimumOrderQuantity} {product.unit}</span>
                        </div>
                        {product.sku && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">SKU:</span>
                            <span className="font-medium">{product.sku}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  ))}

                  {products.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No products available</h4>
                      <p className="text-gray-600">
                        {canManageProducts 
                          ? 'Add products to this supplier to start creating orders'
                          : 'This supplier hasn\'t added any products yet'
                        }
                      </p>
                      {canManageProducts && (
                        <button
                          onClick={() => setShowAddProduct(true)}
                          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Add Product
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Modal */}
        {(showAddProduct || editingProduct) && (
          <ProductModal
            product={editingProduct}
            supplierId={supplier.id}
            onClose={() => {
              setShowAddProduct(false);
              setEditingProduct(null);
            }}
            onSave={(product) => {
              if (editingProduct) {
                setProducts(prev => prev.map(p => p.id === product.id ? product : p));
              } else {
                setProducts(prev => [...prev, product]);
              }
              setShowAddProduct(false);
              setEditingProduct(null);
            }}
          />
        )}
      </div>
    </div>
  );
};