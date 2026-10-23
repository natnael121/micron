import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './components/admin/Dashboard';
import MenuManagement from './components/admin/MenuManagement';
import DepartmentManagement from './components/admin/DepartmentManagement';
import { OrderManagement } from './components/admin/OrderManagement';
import { BillManagement } from './components/admin/BillManagement';
import { Analytics } from './components/admin/Analytics';
import { Settings } from './components/admin/Settings';
import { WaiterManagement } from './components/admin/WaiterManagement';
import { DeliveryIntegration } from './components/admin/DeliveryIntegration';
import { NotificationSettings } from './components/admin/NotificationSettings';
import { SuperAdminLogin } from './components/admin/SuperAdminLogin';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { MenuPage } from './pages/MenuPage';
import { ScanGateway } from './pages/ScanGateway';
import { TelegramDeepLinkService } from './utils/telegramDeepLink';

// Smart Root Redirect component: handles Telegram Mini App auto-routing
const RootRedirect: React.FC<{ user: any; getRedirectPath: () => string }> = ({ user, getRedirectPath }) => {
  // 1. Check if opened inside Telegram or with Telegram start parameter
  const startParam = TelegramDeepLinkService.getTelegramStartParam();
  if (startParam) {
    const parsed = TelegramDeepLinkService.parseStartParameter(startParam);
    if (parsed) {
      return <Navigate to={`/menu/${parsed.cafeId}/table/${parsed.tableId}`} replace />;
    }
  }

  // 2. Check for existing customer session
  const storedSession = TelegramDeepLinkService.getStoredSession();
  if (storedSession?.cafeId && storedSession?.tableId) {
    return <Navigate to={`/menu/${storedSession.cafeId}/table/${storedSession.tableId}`} replace />;
  }

  // 3. If inside Telegram WebApp without table param, open menu
  if (TelegramDeepLinkService.isOpenedInTelegram()) {
    return <Navigate to="/menu" replace />;
  }

  // 4. If logged-in staff/admin user, redirect to their panel
  if (user) {
    return <Navigate to={getRedirectPath()} replace />;
  }

  // 5. Otherwise, regular web visitor -> login
  return <Navigate to="/login" replace />;
};

// Waiter Panel Components
import { WaiterLayout } from './components/waiter/WaiterLayout';
import { WaiterDashboard } from './components/waiter/WaiterDashboard';
import { WaiterOrderPage } from './components/waiter/WaiterOrderPage';
import { WaiterActiveOrders } from './components/waiter/WaiterActiveOrders';

// Kitchen Panel Components
import { KitchenLayout } from './components/kitchen/KitchenLayout';
import { KitchenDashboard } from './components/kitchen/KitchenDashboard';

function App() {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Get path to redirect to based on role
  const getRedirectPath = () => {
    if (userRole === 'waiter') return '/waiter';
    if (userRole === 'superadmin') return '/super-admin';
    if (userRole === 'kitchen') return '/kitchen';
    return '/admin';
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <LoginForm /> : <Navigate to={getRedirectPath()} replace />} />
        <Route path="/register" element={!user ? <RegisterForm /> : <Navigate to={getRedirectPath()} replace />} />
        
        {/* Customer Menu Routes */}
        <Route path="/scan" element={<ScanGateway />} />
        <Route path="/qr/:userId/:tableNumber" element={<ScanGateway />} />
        <Route path="/menu/:userId/table/:tableNumber" element={<MenuPage />} />
        <Route path="/:businessSlug/table/:tableNumber" element={<MenuPage />} />
        <Route path="/menu" element={<MenuPage />} />
        
        {/* Super Admin Routes */}
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin" element={
          user && userRole === 'superadmin' ? 
            <SuperAdminDashboard /> : 
            <Navigate to="/super-admin/login" replace />
        } />
        
        {/* Protected Waiter Routes */}
        <Route path="/waiter" element={user && userRole === 'waiter' ? <WaiterLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<WaiterDashboard />} />
          <Route path="orders" element={<WaiterActiveOrders />} />
          <Route path="order/:tableNumber" element={<WaiterOrderPage />} />
        </Route>
        
        {/* Protected Kitchen Routes */}
        <Route path="/kitchen" element={user && userRole === 'kitchen' ? <KitchenLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<KitchenDashboard />} />
        </Route>
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={user && userRole === 'owner' ? <AdminLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="waiters" element={<WaiterManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="bills" element={<BillManagement />} />
          <Route path="delivery" element={<DeliveryIntegration />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Default Redirects */}
        <Route path="/" element={<RootRedirect user={user} getRedirectPath={getRedirectPath} />} />
        <Route path="/table/:tableNumber" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;