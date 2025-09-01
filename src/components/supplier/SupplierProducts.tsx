import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Package, 
  Search,
  Filter,
  Upload
} from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import { SupplierProduct } from '../../types/supplier';
import { ProductModal } from '../admin/ProductModal';

export const SupplierProducts: React.FC = () => {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);

  // Get supplier info from localStorage
  const supplierUser = JSON.parse(localStorage.getItem('supplierUser') || '{}');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!supplierUser.supplierId) return;
    
    try {
      setLoading(true);
      console.log('Loading products for supplier:', supplierUser.supplierId);
      const productsData = await supplierService.getAllSupplierProducts(supplierUser.supplierId);
      console.log('Products loaded:', productsData.length);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]); // Set empty array to prevent crashes
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await supplierService.deleteSupplierProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const toggleProductAvailability = async (product: SupplierProduct) => {
    try {
      await supplierService.updateSupplierProduct(product.id, { 
        isAvailable: !product.isAvailable 
      });
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p
      ));
    } catch (error) {
      console.error('Error updating product availability:', error);
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-600">Manage your product offerings</p>
        </div>
        <button
          onClick={() => setShowAddProduct(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="aspect-video relative bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => toggleProductAvailability(product)}
                  className={`p-2 rounded-full ${
                    product.isAvailable 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {product.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                <span className="text-lg font-bold text-blue-600 ml-2">
                  ${product.unitPrice.toFixed(2)}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Unit:</span>
                  <span className="font-medium">{product.unit}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Min Order:</span>
                  <span className="font-medium">{product.minimumOrderQuantity} {product.unit}</span>
                </div>

                {product.sku && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">SKU:</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                )}

                {product.stockQuantity !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Stock:</span>
                    <span className={`font-medium ${
                      product.stockQuantity > 10 ? 'text-green-600' : 
                      product.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {product.stockQuantity} {product.unit}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  {product.brand && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {product.brand}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first product to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddProduct(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Product
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {(showAddProduct || editingProduct) && (
        <ProductModal
          product={editingProduct}
          supplierId={supplierUser.supplierId}
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
  );
};