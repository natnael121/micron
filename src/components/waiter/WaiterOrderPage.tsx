import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { MenuItem, Category, ScheduledMenuItem, OrderItem, TableBill, MenuSchedule } from '../../types';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Search,
  Clock,
  Check,
  X,
  Receipt
} from 'lucide-react';

interface CartItem extends OrderItem {}

export const WaiterOrderPage: React.FC = () => {
  const { tableNumber } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();
  const { user, getRestaurantId, restaurantOwner } = useAuth();

  const [menuItems, setMenuItems] = useState<ScheduledMenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [tableBill, setTableBill] = useState<TableBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const restaurantId = getRestaurantId();
  const currency = restaurantOwner?.settings?.currency || 'USD';

  useEffect(() => {
    if (!restaurantId) return;
    loadMenu();
  }, [restaurantId]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const [items, cats, bills] = await Promise.all([
        firebaseService.getScheduledMenuItems(restaurantId),
        firebaseService.getCategories(restaurantId),
        firebaseService.getTableBills(restaurantId),
      ]);
      
      setMenuItems(items);
      setCategories(cats);
      
      const currentBill = bills.find(b => b.tableNumber === tableNumber && b.status === 'active');
      setTableBill(currentBill || null);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    if (!item.available || !item.isCurrentlyAvailable) return false;
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    }
    return true;
  });

  // Cart operations
  const addToCart = (item: ScheduledMenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id 
          ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.price }
          : c
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, total: item.price }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.id !== itemId) return c;
        const newQty = c.quantity + delta;
        if (newQty <= 0) return c;
        return { ...c, quantity: newQty, total: newQty * c.price };
      }).filter(c => c.quantity > 0);
    });
  };

  const getCartItemQty = (itemId: string): number => {
    return cart.find(c => c.id === itemId)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit order
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !user || !restaurantId || !tableNumber) return;
    
    try {
      setSubmitting(true);
      await firebaseService.createWaiterOrder(
        restaurantId,
        tableNumber,
        cart,
        { waiterId: user.id, waiterName: user.name || 'Waiter' },
        restaurantId
      );

      setSuccessMessage('Order sent to kitchen! ✅');
      setCart([]);
      setShowCart(false);
      
      // Reload bill data
      const bills = await firebaseService.getTableBills(restaurantId);
      const currentBill = bills.find(b => b.tableNumber === tableNumber && b.status === 'active');
      setTableBill(currentBill || null);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/waiter')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Table {tableNumber}</h1>
              {tableBill && (
                <p className="text-xs text-blue-600 font-medium">
                  Active Bill: ${tableBill.total.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          
          {tableBill && (
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {tableBill.items.length} items
              </span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 pb-3 flex space-x-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {successMessage}
        </div>
      )}

      {/* Menu Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map(item => {
          const qty = getCartItemQty(item.id);
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                qty > 0 ? 'border-blue-300 shadow-md' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Item Image */}
              {item.photo && (
                <div className="h-32 overflow-hidden">
                  <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1">{item.name}</h3>
                  <span className="font-bold text-blue-600 text-sm ml-2">${item.price.toFixed(2)}</span>
                </div>
                
                {item.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                )}

                {item.preparation_time > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-gray-400 mb-2">
                    <Clock className="w-3 h-3" />
                    <span>{item.preparation_time} min</span>
                  </div>
                )}

                {/* Add/Remove Controls */}
                {qty > 0 ? (
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg p-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-red-50 transition-colors"
                    >
                      {qty === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4 text-blue-600" />}
                    </button>
                    <span className="font-bold text-blue-700 text-lg">{qty}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No menu items found</p>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setShowCart(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-white text-blue-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            </div>
            <span className="font-semibold text-lg">View Order</span>
            <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Order for Table {tableNumber}
              </h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-md border hover:bg-red-50"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="font-bold text-gray-900 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-gray-900 text-sm w-16 text-right">${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-2xl font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || cart.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send to Kitchen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
