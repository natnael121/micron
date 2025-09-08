import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { MenuItem, TableBill, ScheduledMenuItem, MenuSchedule } from '../types';
import { MenuCard } from '../components/MenuCard';
import { MenuDetail } from '../components/MenuDetail';
import { CartModal } from '../components/CartModal';
import { BillModal } from '../components/BillModal';
import { BottomNav } from '../components/BottomNav';
import { CategoryFilter } from '../components/CategoryFilter';
import { TableHeader } from '../components/TableHeader';
import { SettingsModal } from '../components/SettingsModal';
import { FeedbackModal } from '../components/FeedbackModal';
import { PaymentModal } from '../components/PaymentModal';
import { AboutModal } from '../components/AboutModal';
import { TelegramLoginWidget } from '../components/TelegramLoginWidget';
import { useCart } from '../hooks/useCart';
import { useSettings } from '../hooks/useSettings';
import { firebaseService } from '../services/firebase';
import { telegramService } from '../services/telegram';
import { AnalyticsService } from '../services/analytics';
import { useTranslation } from '../utils/translations';
import { useMenuTheme } from '../hooks/useMenuTheme';
import { useCustomerNotifications } from '../hooks/useCustomerNotifications';
import { TelegramDeepLinkService } from '../utils/telegramDeepLink';
import { TelegramUser, CafeTableSession, Category } from '../types';
import { NotificationToast } from '../components/NotificationToast';
import { CustomerNotificationManager } from '../components/CustomerNotificationManager';

export const MenuPage: React.FC = () => {
  const { userId, tableNumber } = useParams<{ userId: string; tableNumber: string }>();
  const location = useLocation();
  
  // Handle business slug routing
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let resolvedUserId = userId;
  let resolvedTableNumber = tableNumber;
  
  // Check if this is a business slug route (/:businessSlug/table/:tableNumber)
  if (pathSegments.length === 3 && pathSegments[1] === 'table') {
    const businessSlug = pathSegments[0];
    resolvedTableNumber = pathSegments[2];
    // We'll need to resolve the business slug to userId later
  }
  
  const { theme } = useMenuTheme(userId);
  const { settings, updateSettings } = useSettings();
  const {
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems,
  } = useCart();

  const [menuItems, setMenuItems] = useState<ScheduledMenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<MenuSchedule | null>(null);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ScheduledMenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTelegramLogin, setShowTelegramLogin] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('home');
  const [tableBill, setTableBill] = useState<TableBill | null>(null);
  const [isPayingBill, setIsPayingBill] = useState(false);
  const [analytics] = useState(() => new AnalyticsService(tableNumber || '1'));
  const [businessInfo, setBusinessInfo] = useState<{ name: string; logo?: string } | null>(null);
  const [session, setSession] = useState<CafeTableSession | null>(null);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string>('');
  const [businessSlugToUserId, setBusinessSlugToUserId] = useState<string | null>(null);
  const t = useTranslation(settings.language);
  const { isEnabled: notificationsEnabled, requestPermission } = useCustomerNotifications();
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
  }>>([]);

  const addToast = (toast: Omit<typeof toasts[0], 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    initializeSession();
    checkFeedbackStatus();
  }, [location.pathname, location.search]);

  const checkFeedbackStatus = () => {
    // Check if feedback was already submitted for this session
    const sessionFeedback = localStorage.getItem(`feedback_${session?.sessionId || 'guest'}`);
    if (sessionFeedback) {
      setFeedbackSubmitted(true);
    }
  };

  // Handle URL actions from notifications
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'view_bill') {
      setTimeout(() => setShowBill(true), 1000);
    } else if (action === 'retry_payment') {
      setTimeout(() => {
        setIsPayingBill(true);
        setShowPayment(true);
      }, 1000);
    }
    
    // Clean up URL
    if (action) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);


  useEffect(() => {
    if (resolvedUserId || businessSlugToUserId) {
      const actualUserId = resolvedUserId || businessSlugToUserId;
      if (actualUserId) {
        loadMenuItems(actualUserId);
        loadCategories(actualUserId);
        loadTableBill(actualUserId);
        loadBusinessInfo(actualUserId);
      }
    }
  }, [resolvedUserId, businessSlugToUserId]);

  useEffect(() => {
    // If this is a business slug route, resolve it to userId
    if (!resolvedUserId && pathSegments.length === 3 && pathSegments[1] === 'table') {
      resolveBusinessSlug(pathSegments[0]);
    }
  }, [location.pathname]);

  const resolveBusinessSlug = async (businessSlug: string) => {
    try {
      // Get all users and find one with matching business name slug
      const users = await firebaseService.getAllUsers();
      const matchingUser = users.find(user => {
        if (!user.businessName) return false;
        const userSlug = user.businessName.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        return userSlug === businessSlug;
      });
      
      if (matchingUser) {
        setBusinessSlugToUserId(matchingUser.id);
        resolvedUserId = matchingUser.id;
      } else {
        setUserExists(false);
      }
    } catch (error) {
      console.error('Error resolving business slug:', error);
      setUserExists(false);
    }
  };

  const initializeSession = () => {
    // Check if opened via URL parameters (fallback)
    const urlParams = TelegramDeepLinkService.parseUrlParams(window.location.href);
    if (urlParams) {
      setCafeId(urlParams.cafeId);
      // Create guest session for fallback URL
      const guestSession = TelegramDeepLinkService.createSession(urlParams.cafeId, urlParams.tableId);
      setSession(guestSession);
      TelegramDeepLinkService.storeSession(guestSession);
      return;
    }

    // Check for existing session
    const existingSession = TelegramDeepLinkService.getStoredSession();
    if (existingSession) {
      setSession(existingSession);
      setCafeId(existingSession.cafeId);
      return;
    }

    // Check if opened in Telegram
    const isInTelegram = TelegramDeepLinkService.isOpenedInTelegram();
    if (isInTelegram && (resolvedUserId || businessSlugToUserId) && resolvedTableNumber) {
      setShowTelegramLogin(true);
      setCafeId(resolvedUserId || businessSlugToUserId); // Use userId as cafeId for backward compatibility
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const actualUserId = resolvedUserId || businessSlugToUserId;
      if (actualUserId) {
        loadTableBill(actualUserId);
        loadMenuItems(actualUserId); // Refresh to update schedule availability
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [resolvedUserId, businessSlugToUserId]);

  const loadMenuItems = async (actualUserId?: string) => {
    const userIdToUse = actualUserId || resolvedUserId || businessSlugToUserId;
    if (!userIdToUse) return;
    
    try {
      setLoading(true);
      const items = await firebaseService.getScheduledMenuItems(userIdToUse);
      setMenuItems(items);
      setUserExists(items.length > 0);
      
      // Find current active schedule
      const activeSchedule = items.find(item => item.currentSchedule)?.currentSchedule;
      setCurrentSchedule(activeSchedule || null);
    } catch (error) {
      console.error('Error loading menu items:', error);
      setUserExists(false);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (actualUserId?: string) => {
    const userIdToUse = actualUserId || resolvedUserId || businessSlugToUserId;
    if (!userIdToUse) return;
    
    try {
      const cats = await firebaseService.getCategories(userIdToUse);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBusinessInfo = async (actualUserId?: string) => {
    const userIdToUse = actualUserId || resolvedUserId || businessSlugToUserId;
    if (!userIdToUse) return;
    
    try {
      const userDoc = await firebaseService.getUserProfile(userIdToUse);
      if (userDoc) {
        setBotUsername(userDoc.settings?.telegramBotUsername || '');
        setBusinessInfo({ 
          name: userDoc.businessName || 'Restaurant', 
          logo: userDoc.logo,
          address: userDoc.aboutUs?.address || userDoc.address,
          phone: userDoc.aboutUs?.phone || userDoc.phone,
          email: userDoc.aboutUs?.email || userDoc.email,
          socialMedia: userDoc.aboutUs?.socialMedia,
          description: userDoc.aboutUs?.description || userDoc.description,
          website: userDoc.aboutUs?.website,
          operatingHours: userDoc.aboutUs?.operatingHours,
          features: userDoc.aboutUs?.features,
          specialMessage: userDoc.aboutUs?.specialMessage
        });
      }
    } catch (error) {
      console.error('Error loading business info:', error);
    }
  };

  const handleTelegramAuth = (telegramUser: TelegramUser) => {
    const actualUserId = resolvedUserId || businessSlugToUserId;
    if (!actualUserId || !resolvedTableNumber) return;

    // Create authenticated session
    const authenticatedSession = TelegramDeepLinkService.createSession(
      cafeId || actualUserId,
      resolvedTableNumber,
      telegramUser
    );
    
    setSession(authenticatedSession);
    TelegramDeepLinkService.storeSession(authenticatedSession);
    setShowTelegramLogin(false);

    // Store user info for orders
    analytics.setCustomerInfo({
      telegramId: telegramUser.id.toString(),
      telegramUsername: telegramUser.username,
      telegramPhoto: telegramUser.photo_url,
    });
  };

  const handleTelegramAuthError = (error: string) => {
    console.error('Telegram auth error:', error);
    // Continue as guest
    const actualUserId = resolvedUserId || businessSlugToUserId;
    if (actualUserId && resolvedTableNumber) {
      const guestSession = TelegramDeepLinkService.createSession(cafeId || actualUserId, resolvedTableNumber);
      setSession(guestSession);
      TelegramDeepLinkService.storeSession(guestSession);
    }
    setShowTelegramLogin(false);
  };

  const loadTableBill = async (actualUserId?: string) => {
    const userIdToUse = actualUserId || resolvedUserId || businessSlugToUserId;
    if (!userIdToUse || !resolvedTableNumber) return;
    
    try {
      const bill = await firebaseService.getTableBill(userIdToUse, resolvedTableNumber, cafeId);
      setTableBill(bill);
    } catch (error) {
      console.error('Error loading table bill:', error);
    }
  };

  const handleItemClick = (item: ScheduledMenuItem) => {
    analytics.trackItemView(item.id);
    firebaseService.updateMenuItem(item.id, { views: item.views + 1 });
    setSelectedItem(item);
  };

  const handleAddToCart = (item: ScheduledMenuItem, quantity: number) => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
      });
    }
  };

  const handleQuickAddToCart = (item: ScheduledMenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
    });
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    const actualUserId = resolvedUserId || businessSlugToUserId;
    if (!actualUserId) return;

    try {
      const pendingOrderData: any = {
        tableNumber: resolvedTableNumber || '1',
        userId: actualUserId,
        cafeId: cafeId || actualUserId,
        items: cartItems,
        totalAmount: getTotalAmount(),
        timestamp: new Date().toISOString(),
      };

      // Only include customerInfo if telegram user exists
      if (session?.telegramUser) {
        pendingOrderData.customerInfo = {
          telegramId: session.telegramUser.id.toString(),
          telegramUsername: session.telegramUser.username,
          telegramPhoto: session.telegramUser.photo_url,
        };
      }

      analytics.trackOrder({ 
        id: 'temp', 
        ...pendingOrderData, 
        status: 'pending_approval',
        paymentStatus: 'pending'
      });
      
      const pendingOrderId = await firebaseService.addPendingOrder(pendingOrderData);
      setLastOrderId(pendingOrderId);
      
      // Send pending order with approve/reject buttons
      await telegramService.sendPendingOrderWithButtons({ 
        id: pendingOrderId, 
        ...pendingOrderData
      });
      
      clearCart();
      setShowCart(false);
      
      // Show success toast
      addToast({
        type: 'success',
        title: t('orderConfirmed'),
        message: `Order submitted for Table ${resolvedTableNumber}. You'll be notified when approved.`
      });
      
      // Only show feedback if not already submitted for this session
      if (!feedbackSubmitted) {
        setTimeout(() => setShowFeedback(true), 2000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      addToast({
        type: 'error',
        title: 'Order Failed',
        message: 'Failed to place order. Please try again.'
      });
    }
  };

  const handlePaymentOrder = () => {
    setShowCart(false);
    setShowPayment(true);
  };

  const handlePaymentSubmit = async (paymentData: { screenshotUrl: string; method: string }) => {
    const actualUserId = resolvedUserId || businessSlugToUserId;
    if (!actualUserId) return;

    try {
      if (isPayingBill) {
        if (!tableBill) return;
        
        // Create payment confirmation record
        const paymentConfirmation = {
          tableNumber: tableBill.tableNumber,
          userId: actualUserId,
          cafeId: cafeId || actualUserId,
          items: tableBill.items,
          subtotal: tableBill.subtotal,
          tax: tableBill.tax,
          total: tableBill.total,
          method: paymentData.method === 'bank_transfer' ? 'bank_transfer' : 'mobile_money',
          screenshotUrl: paymentData.screenshotUrl,
          timestamp: new Date().toISOString(),
          status: 'pending' as const
        };

        const confirmationId = await firebaseService.addPaymentConfirmation(paymentConfirmation);
        
        // Send to Telegram with approve/reject buttons
        await telegramService.sendPaymentConfirmationWithButtons(
          confirmationId,
          tableBill.tableNumber,
          tableBill.total,
          paymentData.method,
          actualUserId
        );
        
        setShowPayment(false);
        setTimeout(() => setShowFeedback(true), 2000);
        addToast({
          type: 'info',
          title: 'Payment Submitted',
          message: 'Payment confirmation submitted! Please wait for approval.'
        });
        setIsPayingBill(false);
      } else {
        if (cartItems.length === 0) return;
        
        const pendingOrderData: any = {
          tableNumber: resolvedTableNumber || '1',
          userId: actualUserId,
          cafeId: cafeId || actualUserId,
          items: cartItems,
          totalAmount: getTotalAmount(),
          paymentMethod: paymentData.method === 'bank_transfer' ? 'bank_transfer' : 'mobile',
        };

        // Only include customerInfo if telegram user exists
        if (session?.telegramUser) {
          pendingOrderData.customerInfo = {
            telegramId: session.telegramUser.id.toString(),
            telegramUsername: session.telegramUser.username,
            telegramPhoto: session.telegramUser.photo_url,
          };
        }

        const pendingOrderId = await firebaseService.addPendingOrder(pendingOrderData);
        setLastOrderId(pendingOrderId);
        
        // Create payment confirmation for new order
        const paymentConfirmation = {
          tableNumber: resolvedTableNumber || '1',
          userId: actualUserId,
          cafeId: cafeId || actualUserId,
          items: cartItems,
          subtotal: getTotalAmount(),
          tax: getTotalAmount() * 0.15,
          total: getTotalAmount() * 1.15,
          method: paymentData.method === 'bank_transfer' ? 'bank_transfer' : 'mobile_money',
          screenshotUrl: paymentData.screenshotUrl,
          timestamp: new Date().toISOString(),
          status: 'pending' as const,
          orderId: pendingOrderId
        };

        const confirmationId = await firebaseService.addPaymentConfirmation(paymentConfirmation);
        
        // Send to Telegram with approve/reject buttons
        await telegramService.sendPaymentConfirmationWithButtons(
          confirmationId,
          resolvedTableNumber || '1',
          getTotalAmount() * 1.15,
          paymentData.method,
          actualUserId
        );
        
        clearCart();
        setShowPayment(false);
        
        addToast({
          type: 'info',
          title: 'Payment Submitted',
          message: 'Payment confirmation submitted! Your order is pending approval.'
        });
        
        // Only show feedback if not already submitted for this session
        if (!feedbackSubmitted) {
          setTimeout(() => setShowFeedback(true), 2000);
        }
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      addToast({
        type: 'error',
        title: 'Payment Failed',
        message: 'Failed to submit payment confirmation. Please try again.'
      });
    }
  };

  const handleWaiterCall = async () => {
    const actualUserId = resolvedUserId || businessSlugToUserId;
    if (!actualUserId) return;
    
    analytics.trackWaiterCall();
    try {
      // Add waiter call to database
      const waiterCallId = await firebaseService.addWaiterCall(actualUserId, resolvedTableNumber || '1');
      
      // Send Telegram notification with proper error handling
      try {
        await telegramService.sendWaiterCall(resolvedTableNumber || '1', actualUserId);
        addToast({
          type: 'success',
          title: t('waiter'),
          message: t('waiterCalled')
        });
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
        addToast({
          type: 'warning',
          title: t('waiter'),
          message: 'Waiter call registered! (Notification may have failed)'
        });
      }
    } catch (error) {
      console.error('Error calling waiter:', error);
      addToast({
        type: 'error',
        title: 'Waiter Call Failed',
        message: 'Failed to call waiter. Please try again.'
      });
    }
  };

  const handleBillClick = () => {
    setShowBill(true);
  };

  const handleFeedbackSubmit = (feedback: any) => {
    const actualUserId = resolvedUserId || businessSlugToUserId;
    
    // Enhanced feedback with session and customer info
    const enhancedFeedback = {
      ...feedback,
      sessionId: session?.sessionId,
      customerInfo: session?.telegramUser ? {
        name: `${session.telegramUser.first_name} ${session.telegramUser.last_name || ''}`.trim(),
        telegramUsername: session.telegramUser.username,
        telegramPhoto: session.telegramUser.photo_url,
      } : undefined,
    };
    
    // Store feedback locally
    const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbacks.push(enhancedFeedback);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    
    // Mark feedback as submitted for this session
    if (session?.sessionId) {
      localStorage.setItem(`feedback_${session.sessionId}`, 'true');
      setFeedbackSubmitted(true);
    }
    
    // Send to Telegram
    if (actualUserId) {
      telegramService.sendEnhancedFeedback(enhancedFeedback, actualUserId)
        .catch(error => console.error('Failed to send feedback to Telegram:', error));
    }
    
    addToast({
      type: 'success',
      title: t('thankYou'),
      message: 'Your feedback helps us improve our service!'
    });
  };

  if (userExists === false) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Sort items: current schedule items first, then others
  const sortedItems = [...menuItems].sort((a, b) => {
    // Items with current schedule come first
    if (a.isCurrentlyAvailable && !b.isCurrentlyAvailable) return -1;
    if (!a.isCurrentlyAvailable && b.isCurrentlyAvailable) return 1;
    
    // Within same availability, sort by category and name
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  const filteredItems = activeCategory === 'all' 
    ? sortedItems 
    : sortedItems.filter(item => item.category === activeCategory);

  // Group items by availability
  const currentItems = filteredItems.filter(item => item.isCurrentlyAvailable);
  const otherItems = filteredItems.filter(item => !item.isCurrentlyAvailable);

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Telegram Login Modal */}
      {showTelegramLogin && botUsername && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome!</h2>
            <p className="text-gray-600 mb-6">
              Login with Telegram to get personalized service and track your orders.
            </p>
            
            <TelegramLoginWidget
              botName={botUsername}
              onAuth={handleTelegramAuth}
              onError={handleTelegramAuthError}
              className="mb-4"
            />
            
            <button
              onClick={() => handleTelegramAuthError('User chose to continue as guest')}
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              Continue as guest
            </button>
          </div>
        </div>
      )}

      <TableHeader 
        tableNumber={resolvedTableNumber || '1'} 
        language={settings.language}
        orderType={settings.orderType}
        businessName={businessInfo?.name || 'Restaurant'}
        businessLogo={businessInfo?.logo}
        customerInfo={session?.telegramUser ? {
          name: `${session.telegramUser.first_name} ${session.telegramUser.last_name || ''}`.trim(),
          username: session.telegramUser.username,
          photo: session.telegramUser.photo_url,
        } : undefined}
      />
      
      {/* Current Schedule Banner */}
      {currentSchedule && (
        <div className="bg-green-600 text-white px-6 py-3">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm font-medium">
              Now Showing: {currentSchedule.name} ({currentSchedule.startTime}–{currentSchedule.endTime})
            </span>
          </div>
        </div>
      )}
      
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="p-6 pb-6">
        {/* Current Schedule Items */}
        {currentItems.length > 0 && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-white text-2xl font-bold mb-2">
                {currentSchedule ? `${currentSchedule.name} Menu` : 'Available Now'}
              </h2>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <span>{currentItems.length} items available</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {currentItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  theme={theme}
                  onClick={() => handleItemClick(item)}
                  onAddToCart={handleQuickAddToCart}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Other Schedule Items */}
        {otherItems.length > 0 && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-white text-xl font-bold mb-2">Other Menu Items</h2>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <span>{otherItems.length} items with scheduled availability</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {otherItems.map((item) => (
                <div key={item.id} className="relative">
                  <MenuCard
                    item={item}
                    theme={theme}
                    onClick={() => handleItemClick(item)}
                    onAddToCart={handleQuickAddToCart}
                  />
                  {/* Availability Label */}
                  {item.nextAvailableSchedule && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-medium">
                      Available at {item.nextAvailableSchedule.name} ({item.nextAvailableSchedule.startTime}–{item.nextAvailableSchedule.endTime})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <MenuDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showCart && (
        <CartModal
          items={cartItems}
          totalAmount={getTotalAmount()}
          tableNumber={resolvedTableNumber || '1'}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onPlaceOrder={handlePlaceOrder}
          onPaymentOrder={handlePaymentOrder}
        />
      )}

      {showPayment && (
        <PaymentModal
          items={isPayingBill ? (tableBill?.items || []) : cartItems}
          totalAmount={isPayingBill ? (tableBill?.total || 0) : getTotalAmount()}
          tableNumber={resolvedTableNumber || '1'}
          onClose={() => {
            setShowPayment(false);
            setIsPayingBill(false);
          }}
          onPaymentSubmit={handlePaymentSubmit}
        />
      )}

      {showBill && (
        <BillModal
          tableBill={tableBill}
          tableNumber={resolvedTableNumber || '1'}
          businessName="Restaurant"
          userId={resolvedUserId || businessSlugToUserId}
          onClose={() => setShowBill(false)}
          onPaymentOrder={() => {
            setIsPayingBill(true);
            setShowBill(false);
            setShowPayment(true);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          tableNumber={resolvedTableNumber || '1'}
          userId={resolvedUserId || businessSlugToUserId}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={updateSettings}
        />
      )}

      {showFeedback && lastOrderId && (
        <FeedbackModal
          orderId={lastOrderId}
          tableNumber={resolvedTableNumber || '1'}
          sessionId={session?.sessionId}
          customerInfo={session?.telegramUser ? {
            name: `${session.telegramUser.first_name} ${session.telegramUser.last_name || ''}`.trim(),
            telegramUsername: session.telegramUser.username,
            telegramPhoto: session.telegramUser.photo_url,
          } : undefined}
          language={settings.language}
          onClose={() => setShowFeedback(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {showAbout && businessInfo && (
        <AboutModal
          businessInfo={businessInfo}
          language={settings.language}
          onClose={() => setShowAbout(false)}
        />
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onWaiterCall={handleWaiterCall}
        onBillClick={handleBillClick}
        onCartClick={() => setShowCart(true)}
        onSettingsClick={() => setShowSettings(true)}
        onAboutClick={() => setShowAbout(true)}
        cartItemCount={getTotalItems()}
        language={settings.language}
        notificationsEnabled={notificationsEnabled}
        onNotificationToggle={async () => {
          if (!notificationsEnabled) {
            await requestPermission();
          }
        }}
      />

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Customer Notification Manager */}
      {session && (
        <CustomerNotificationManager
          userId={resolvedUserId || businessSlugToUserId || ''}
          tableNumber={resolvedTableNumber || '1'}
          sessionId={session.sessionId}
          language={settings.language}
        />
      )}
    </div>
  );
};