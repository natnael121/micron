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

// Waiter Panel Components
import { WaiterLayout } from './components/waiter/WaiterLayout';
import { WaiterDashboard } from './components/waiter/WaiterDashboard';
import { WaiterOrderPage } from './components/waiter/WaiterOrderPage';
import { WaiterActiveOrders } from './components/waiter/WaiterActiveOrders';

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
    return '/admin';
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <LoginForm /> : <Navigate to={getRedirectPath()} replace />} />
        <Route path="/register" element={!user ? <RegisterForm /> : <Navigate to={getRedirectPath()} replace />} />
        
        {/* Customer Menu Routes */}
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
        <Route path="/" element={<Navigate to={user ? getRedirectPath() : "/login"} replace />} />
        <Route path="/table/:tableNumber" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;