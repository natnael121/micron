import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  FileText, 
  BarChart3, 
  MapPin,
  Settings, 
  LogOut,
  User,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export const SupplierLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Get supplier info from localStorage
  const supplierUser = JSON.parse(localStorage.getItem('supplierUser') || '{}');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('supplierUser');
      navigate('/supplier/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force logout even if Firebase signOut fails
      localStorage.removeItem('supplierUser');
      navigate('/supplier/login');
    }
  };

  const navItems = [
    { path: '/supplier', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/supplier/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/supplier/customers', icon: Users, label: 'Customers' },
    { path: '/supplier/products', icon: Package, label: 'Products' },
    { path: '/supplier/invoices', icon: FileText, label: 'Invoices' },
    { path: '/supplier/map', icon: MapPin, label: 'Delivery Map' },
    { path: '/supplier/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/supplier/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-white shadow-lg fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Supplier Portal</h1>
              <p className="text-sm text-gray-600">{supplierUser.name}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path, item.exact)
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t mt-auto">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{supplierUser.name}</p>
              <p className="text-xs text-gray-600">{supplierUser.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        <div className="lg:hidden h-16"></div> {/* Spacer for mobile menu button */}
        <Outlet />
      </div>
    </div>
  );
};