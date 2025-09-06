import React, { useState, useEffect } from 'react';
import { 
  Save, 
  User, 
  Building2, 
  MapPin, 
  CreditCard, 
  Bell, 
  Palette, 
  Globe,
  Phone,
  Mail,
  Upload,
  QrCode,
  FileText,
  Settings as SettingsIcon,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { imgbbService } from '../../services/imgbb';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { TableTentPDFGenerator } from '../TableTentPDFGenerator';
import { NotificationSettings } from './NotificationSettings';
import { User as UserType, MenuItem, Category } from '../../types';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadMenuData();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profile = await firebaseService.getUserProfile(user.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuData = async () => {
    if (!user) return;
    
    try {
      const [items, cats] = await Promise.all([
        firebaseService.getMenuItems(user.id),
        firebaseService.getCategories(user.id)
      ]);
      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading menu data:', error);
    }
  };

  const handleProfileUpdate = async (updates: Partial<UserType>) => {
    if (!user || !userProfile) return;

    setSaving(true);
    try {
      await firebaseService.updateUserProfile(user.id, updates);
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const logoUrl = await imgbbService.uploadImage(file, `logo_${user?.id}_${Date.now()}`);
      await handleProfileUpdate({ logo: logoUrl });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const settingsSections = [
    {
      id: 'business',
      title: 'Business Information',
      description: 'Update your restaurant details and contact information',
      icon: Building2,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      iconColor: 'text-blue-600'
    },
    {
      id: 'profile',
      title: 'Owner Profile',
      description: 'Manage your personal information and account settings',
      icon: User,
      color: 'bg-green-50 border-green-200 text-green-700',
      iconColor: 'text-green-600'
    },
    {
      id: 'location',
      title: 'Location & Address',
      description: 'Set your restaurant location and delivery settings',
      icon: MapPin,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      iconColor: 'text-purple-600'
    },
    {
      id: 'appearance',
      title: 'Menu Appearance',
      description: 'Customize your menu theme and branding',
      icon: Palette,
      color: 'bg-pink-50 border-pink-200 text-pink-700',
      iconColor: 'text-pink-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure web notifications and alerts',
      icon: Bell,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      iconColor: 'text-yellow-600'
    },
    {
      id: 'qr-codes',
      title: 'QR Codes & Print',
      description: 'Generate QR codes and print materials',
      icon: QrCode,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      iconColor: 'text-indigo-600'
    },
    {
      id: 'about',
      title: 'About Us Page',
      description: 'Customize your restaurant information for customers',
      icon: FileText,
      color: 'bg-orange-50 border-orange-200 text-orange-700',
      iconColor: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your restaurant settings and preferences</p>
        </div>
        {activeSection && (
          <button
            onClick={() => setActiveSection(null)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Back to Settings</span>
          </button>
        )}
      </div>

      {!activeSection ? (
        // Settings Cards Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => (
            <div
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`${section.color} border-2 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-white flex items-center justify-center`}>
                  <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                </div>
                <ChevronRight className={`w-5 h-5 ${section.iconColor}`} />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-sm opacity-80">{section.description}</p>
            </div>
          ))}
        </div>
      ) : (
        // Active Section Content
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {activeSection === 'business' && (
            <BusinessInformationSection
              userProfile={userProfile}
              onUpdate={handleProfileUpdate}
              saving={saving}
            />
          )}
          
          {activeSection === 'profile' && (
            <OwnerProfileSection
              userProfile={userProfile}
              onUpdate={handleProfileUpdate}
              onLogoUpload={handleLogoUpload}
              uploading={uploading}
              saving={saving}
            />
          )}
          
          {activeSection === 'location' && (
            <LocationSection
              userProfile={userProfile}
              onUpdate={handleProfileUpdate}
              saving={saving}
            />
          )}
          
          {activeSection === 'appearance' && (
            <AppearanceSection
              userProfile={userProfile}
              onUpdate={handleProfileUpdate}
              saving={saving}
            />
          )}
          
          {activeSection === 'notifications' && (
            <NotificationSettings />
          )}
          
          {activeSection === 'qr-codes' && (
            <QRCodesSection
              userId={user?.id || ''}
              businessName={userProfile?.businessName || 'Restaurant'}
              businessLogo={userProfile?.logo}
              numberOfTables={userProfile?.numberOfTables || 10}
              menuItems={menuItems}
              categories={categories}
              onShowQRGenerator={() => setShowQRGenerator(true)}
              onShowPDFGenerator={() => setShowPDFGenerator(true)}
            />
          )}
          
          {activeSection === 'about' && (
            <AboutUsSection
              userProfile={userProfile}
              onUpdate={handleProfileUpdate}
              saving={saving}
            />
          )}
        </div>
      )}

      {/* QR Code Generator Modal */}
      {showQRGenerator && userProfile && (
        <QRCodeGenerator
          userId={user?.id || ''}
          businessName={userProfile.businessName || 'Restaurant'}
          businessLogo={userProfile.logo}
          numberOfTables={userProfile.numberOfTables || 10}
          onClose={() => setShowQRGenerator(false)}
        />
      )}

      {/* PDF Generator Modal */}
      {showPDFGenerator && userProfile && (
        <TableTentPDFGenerator
          userId={user?.id || ''}
          businessInfo={userProfile}
          menuItems={menuItems}
          categories={categories}
          onClose={() => setShowPDFGenerator(false)}
        />
      )}
    </div>
  );
};

// Business Information Section
interface BusinessInformationSectionProps {
  userProfile: UserType | null;
  onUpdate: (updates: Partial<UserType>) => void;
  saving: boolean;
}

const BusinessInformationSection: React.FC<BusinessInformationSectionProps> = ({
  userProfile,
  onUpdate,
  saving
}) => {
  const [formData, setFormData] = useState({
    businessName: userProfile?.businessName || '',
    phone: userProfile?.phone || '',
    email: userProfile?.email || '',
    numberOfTables: userProfile?.numberOfTables || 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Tables
            </label>
            <input
              type="number"
              value={formData.numberOfTables}
              onChange={(e) => setFormData(prev => ({ ...prev, numberOfTables: parseInt(e.target.value) || 10 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="100"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Owner Profile Section
interface OwnerProfileSectionProps {
  userProfile: UserType | null;
  onUpdate: (updates: Partial<UserType>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  saving: boolean;
}

const OwnerProfileSection: React.FC<OwnerProfileSectionProps> = ({
  userProfile,
  onUpdate,
  onLogoUpload,
  uploading,
  saving
}) => {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <User className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900">Owner Profile</h2>
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Restaurant Logo
        </label>
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {userProfile?.logo ? (
              <img 
                src={userProfile.logo} 
                alt="Restaurant Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={onLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 200x200px, PNG or JPG
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Owner Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Location Section
interface LocationSectionProps {
  userProfile: UserType | null;
  onUpdate: (updates: Partial<UserType>) => void;
  saving: boolean;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  userProfile,
  onUpdate,
  saving
}) => {
  const [formData, setFormData] = useState({
    address: userProfile?.address || '',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
    postalCode: userProfile?.postalCode || '',
    country: userProfile?.country || 'US',
    latitude: userProfile?.latitude || 0,
    longitude: userProfile?.longitude || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        alert('Location updated successfully!');
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get current location');
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MapPin className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Location & Address</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Province
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="ET">Ethiopia</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Coordinates (for delivery)
            </label>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
            >
              Get Current Location
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Appearance Section
interface AppearanceSectionProps {
  userProfile: UserType | null;
  onUpdate: (updates: Partial<UserType>) => void;
  saving: boolean;
}

const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  userProfile,
  onUpdate,
  saving
}) => {
  const [formData, setFormData] = useState({
    menuTheme: userProfile?.settings?.menuTheme || 'modern',
    currency: userProfile?.settings?.currency || 'USD',
    language: userProfile?.settings?.language || 'en',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      settings: {
        ...userProfile?.settings,
        ...formData
      }
    });
  };

  const themes = [
    { id: 'modern', name: 'Modern', description: 'Clean and contemporary design' },
    { id: 'classic', name: 'Classic', description: 'Traditional restaurant style' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated fine dining look' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and clean interface' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Palette className="w-6 h-6 text-pink-600" />
        <h2 className="text-xl font-bold text-gray-900">Menu Appearance</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Menu Theme
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themes.map((theme) => (
              <div
                key={theme.id}
                onClick={() => setFormData(prev => ({ ...prev, menuTheme: theme.id }))}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.menuTheme === theme.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{theme.name}</h4>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    formData.menuTheme === theme.id
                      ? 'border-pink-500 bg-pink-500'
                      : 'border-gray-300'
                  }`}>
                    {formData.menuTheme === theme.id && (
                      <Check className="w-2 h-2 text-white m-0.5" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{theme.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="ETB">ETB (Br)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ (Amharic)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// QR Codes Section
interface QRCodesSectionProps {
  userId: string;
  businessName: string;
  businessLogo?: string;
  numberOfTables: number;
  menuItems: MenuItem[];
  categories: Category[];
  onShowQRGenerator: () => void;
  onShowPDFGenerator: () => void;
}

const QRCodesSection: React.FC<QRCodesSectionProps> = ({
  userId,
  businessName,
  businessLogo,
  numberOfTables,
  menuItems,
  categories,
  onShowQRGenerator,
  onShowPDFGenerator
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <QrCode className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">QR Codes & Print Materials</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <QrCode className="w-8 h-8 text-indigo-600" />
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">QR Code Generator</h3>
              <p className="text-sm text-indigo-700">Generate QR codes for your tables</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-indigo-800">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-indigo-600" />
              <span>Bulk generate for all tables</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-indigo-600" />
              <span>Download as PNG or PDF</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-indigo-600" />
              <span>Professional table tent design</span>
            </div>
          </div>
          
          <button
            onClick={onShowQRGenerator}
            className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate QR Codes
          </button>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Print Menu</h3>
              <p className="text-sm text-orange-700">Create professional print menus</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-orange-800">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-orange-600" />
              <span>Multiple design themes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-orange-600" />
              <span>A4 format ready for printing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-orange-600" />
              <span>Includes all available items</span>
            </div>
          </div>
          
          <button
            onClick={onShowPDFGenerator}
            className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Generate Print Menu
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{numberOfTables}</div>
            <div className="text-gray-600">Tables</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{menuItems.length}</div>
            <div className="text-gray-600">Menu Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{categories.length}</div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{menuItems.filter(i => i.available).length}</div>
            <div className="text-gray-600">Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// About Us Section
interface AboutUsSectionProps {
  userProfile: UserType | null;
  onUpdate: (updates: Partial<UserType>) => void;
  saving: boolean;
}

const AboutUsSection: React.FC<AboutUsSectionProps> = ({
  userProfile,
  onUpdate,
  saving
}) => {
  const [formData, setFormData] = useState({
    description: userProfile?.aboutUs?.description || '',
    website: userProfile?.aboutUs?.website || '',
    specialMessage: userProfile?.aboutUs?.specialMessage || '',
    features: userProfile?.aboutUs?.features || [],
    socialMedia: {
      facebook: userProfile?.aboutUs?.socialMedia?.facebook || '',
      instagram: userProfile?.aboutUs?.socialMedia?.instagram || '',
      twitter: userProfile?.aboutUs?.socialMedia?.twitter || '',
      whatsapp: userProfile?.aboutUs?.socialMedia?.whatsapp || '',
    },
    operatingHours: {
      monday: userProfile?.aboutUs?.operatingHours?.monday || '9:00 AM - 10:00 PM',
      tuesday: userProfile?.aboutUs?.operatingHours?.tuesday || '9:00 AM - 10:00 PM',
      wednesday: userProfile?.aboutUs?.operatingHours?.wednesday || '9:00 AM - 10:00 PM',
      thursday: userProfile?.aboutUs?.operatingHours?.thursday || '9:00 AM - 10:00 PM',
      friday: userProfile?.aboutUs?.operatingHours?.friday || '9:00 AM - 11:00 PM',
      saturday: userProfile?.aboutUs?.operatingHours?.saturday || '10:00 AM - 11:00 PM',
      sunday: userProfile?.aboutUs?.operatingHours?.sunday || '10:00 AM - 9:00 PM',
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      aboutUs: {
        ...userProfile?.aboutUs,
        ...formData
      }
    });
  };

  const defaultFeatures = ['Free WiFi', 'Fresh Food', 'Fast Service', 'Top Rated'];

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="w-6 h-6 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-900">About Us Page</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restaurant Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Tell customers about your restaurant, cuisine, and what makes you special..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="https://www.yourrestaurant.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Message
          </label>
          <input
            type="text"
            value={formData.specialMessage}
            onChange={(e) => setFormData(prev => ({ ...prev, specialMessage: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="A special message for your customers..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Restaurant Features
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {defaultFeatures.map((feature) => (
              <label key={feature} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.features.includes(feature)}
                  onChange={() => handleFeatureToggle(feature)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Social Media Links
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Facebook</label>
              <input
                type="url"
                value={formData.socialMedia.facebook}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://facebook.com/yourrestaurant"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Instagram</label>
              <input
                type="url"
                value={formData.socialMedia.instagram}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://instagram.com/yourrestaurant"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Twitter</label>
              <input
                type="url"
                value={formData.socialMedia.twitter}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://twitter.com/yourrestaurant"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">WhatsApp</label>
              <input
                type="tel"
                value={formData.socialMedia.whatsapp}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, whatsapp: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="+1234567890"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Operating Hours
          </label>
          <div className="space-y-3">
            {Object.entries(formData.operatingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium text-gray-700 capitalize">
                  {day}:
                </div>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    operatingHours: { ...prev.operatingHours, [day]: e.target.value }
                  }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="9:00 AM - 10:00 PM"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
        <button
          onClick={onShowQRGenerator}
          className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
        >
          <QrCode className="w-5 h-5" />
          <span>Generate QR Codes</span>
        </button>
        
        <button
          onClick={onShowPDFGenerator}
          className="bg-gray-800 text-white p-4 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
        >
          <FileText className="w-5 h-5" />
          <span>Generate Print Menu</span>
        </button>
      </div>
    </div>
  );
};