import React, { useState, useEffect } from 'react';
import { 
  Save, Upload, User, Building, MessageSquare, Globe, 
  Palette, QrCode, Download, Table, Printer, Truck, X,
  Shield, Bell, CreditCard, MapPin, Phone, Mail,
  Settings as SettingsIcon, Camera, Check, AlertTriangle,
  Wifi, Clock, Star, ExternalLink
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
import { NotificationSettings } from './NotificationSettings';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { imgbbService } from '../../services/imgbb';
import { telegramService } from '../../services/telegram';
import { User as UserType, MenuItem, Category } from '../../types';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { TableTentPDFGenerator } from '../TableTentPDFGenerator';
import { DeliverySettings } from './DeliverySettings';
import { NotificationSettings } from './NotificationSettings';
import { User as UserType, MenuItem, Category } from '../../types';

export const Settings: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [uploading, setUploading] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [settingUpWebhook, setSettingUpWebhook] = useState(false);
const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showDeliverySettings, setShowDeliverySettings] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSection, setActiveSection] = useState<string>('profile');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    telegramChatId: user?.telegramChatId || '',
    telegramSettings: {
      adminChatId: user?.telegramSettings?.adminChatId || '',
      kitchenChatId: user?.telegramSettings?.kitchenChatId || '',
      barChatId: user?.telegramSettings?.barChatId || '',
    },
    aboutUs: {
      description: user?.aboutUs?.description || '',
      address: user?.aboutUs?.address || user?.address || '',
      phone: user?.aboutUs?.phone || user?.phone || '',
      email: user?.aboutUs?.email || user?.email || '',
      website: user?.aboutUs?.website || '',
      socialMedia: {
        facebook: user?.aboutUs?.socialMedia?.facebook || '',
        instagram: user?.aboutUs?.socialMedia?.instagram || '',
        twitter: user?.aboutUs?.socialMedia?.twitter || '',
        tiktok: user?.aboutUs?.socialMedia?.tiktok || '',
        youtube: user?.aboutUs?.socialMedia?.youtube || '',
        whatsapp: user?.aboutUs?.socialMedia?.whatsapp || '',
      },
      operatingHours: {
        monday: user?.aboutUs?.operatingHours?.monday || '9:00 AM - 10:00 PM',
        tuesday: user?.aboutUs?.operatingHours?.tuesday || '9:00 AM - 10:00 PM',
        wednesday: user?.aboutUs?.operatingHours?.wednesday || '9:00 AM - 10:00 PM',
        thursday: user?.aboutUs?.operatingHours?.thursday || '9:00 AM - 10:00 PM',
        friday: user?.aboutUs?.operatingHours?.friday || '9:00 AM - 10:00 PM',
        saturday: user?.aboutUs?.operatingHours?.saturday || '10:00 AM - 11:00 PM',
        sunday: user?.aboutUs?.operatingHours?.sunday || '10:00 AM - 11:00 PM',
      },
      features: user?.aboutUs?.features || ['Free WiFi', 'Fresh Food', 'Fast Service', 'Top Rated'],
      specialMessage: user?.aboutUs?.specialMessage || '',
    },
    logo: user?.logo || '',
    numberOfTables: user?.numberOfTables || 10,
    settings: {
      currency: user?.settings?.currency || 'USD',
      language: user?.settings?.language || 'en',
      theme: user?.settings?.theme || 'light',
      notifications: user?.settings?.notifications ?? true,
    }
  });
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);

useEffect(() => {
if (user) {
      setFormData({
        name: user.name || '',
        businessName: user.businessName || '',
        phone: user.phone || '',
        address: user.address || '',
        telegramChatId: user.telegramChatId || '',
        telegramSettings: {
          adminChatId: user.telegramSettings?.adminChatId || '',
          kitchenChatId: user.telegramSettings?.kitchenChatId || '',
          barChatId: user.telegramSettings?.barChatId || '',
        },
        aboutUs: {
          description: user.aboutUs?.description || '',
          address: user.aboutUs?.address || user.address || '',
          phone: user.aboutUs?.phone || user.phone || '',
          email: user.aboutUs?.email || user.email || '',
          website: user.aboutUs?.website || '',
          socialMedia: {
            facebook: user.aboutUs?.socialMedia?.facebook || '',
            instagram: user.aboutUs?.socialMedia?.instagram || '',
            twitter: user.aboutUs?.socialMedia?.twitter || '',
            tiktok: user.aboutUs?.socialMedia?.tiktok || '',
            youtube: user.aboutUs?.socialMedia?.youtube || '',
            whatsapp: user.aboutUs?.socialMedia?.whatsapp || '',
          },
          operatingHours: {
            monday: user.aboutUs?.operatingHours?.monday || '9:00 AM - 10:00 PM',
            tuesday: user.aboutUs?.operatingHours?.tuesday || '9:00 AM - 10:00 PM',
            wednesday: user.aboutUs?.operatingHours?.wednesday || '9:00 AM - 10:00 PM',
            thursday: user.aboutUs?.operatingHours?.thursday || '9:00 AM - 10:00 PM',
            friday: user.aboutUs?.operatingHours?.friday || '9:00 AM - 10:00 PM',
            saturday: user.aboutUs?.operatingHours?.saturday || '10:00 AM - 11:00 PM',
            sunday: user.aboutUs?.operatingHours?.sunday || '10:00 AM - 11:00 PM',
          },
          features: user.aboutUs?.features || ['Free WiFi', 'Fresh Food', 'Fast Service', 'Top Rated'],
          specialMessage: user.aboutUs?.specialMessage || '',
        },
        logo: user.logo || '',
        numberOfTables: user.numberOfTables || 10,
        settings: {
          currency: user.settings?.currency || 'USD',
          language: user.settings?.language || 'en',
          theme: user.settings?.theme || 'light',
          notifications: user.settings?.notifications ?? true,
        }
      });
      
      loadWebhookInfo();
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

@@ -146,86 +74,30 @@ export const Settings: React.FC = () => {
}
};

  const loadWebhookInfo = async () => {
  const handleProfileUpdate = async (updates: Partial<UserType>) => {
    if (!user || !userProfile) return;

    setSaving(true);
try {
      const info = await telegramService.getWebhookInfo();
      setWebhookInfo(info);
      await firebaseService.updateUserProfile(user.id, updates);
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      alert('Profile updated successfully!');
} catch (error) {
      console.error('Error loading webhook info:', error);
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
}
};

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAboutUsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      aboutUs: {
        ...prev.aboutUs,
        [field]: value
      }
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      aboutUs: {
        ...prev.aboutUs,
        socialMedia: {
          ...prev.aboutUs.socialMedia,
          [platform]: value
        }
      }
    }));
  };

  const handleOperatingHoursChange = (day: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      aboutUs: {
        ...prev.aboutUs,
        operatingHours: {
          ...prev.aboutUs.operatingHours,
          [day]: value
        }
      }
    }));
  };

  const handleFeaturesChange = (features: string[]) => {
    setFormData(prev => ({
      ...prev,
      aboutUs: {
        ...prev.aboutUs,
        features
      }
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file) return;

setUploading(true);
try {
      const logoUrl = await imgbbService.uploadImage(file, `${user.id}_logo_${Date.now()}`);
      handleInputChange('logo', logoUrl);
      const logoUrl = await imgbbService.uploadImage(file, `logo_${user?.id}_${Date.now()}`);
      await handleProfileUpdate({ logo: logoUrl });
} catch (error) {
console.error('Error uploading logo:', error);
alert('Failed to upload logo');
@@ -234,899 +106,1064 @@ export const Settings: React.FC = () => {
}
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await firebaseService.updateUserProfile(user.id, formData);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const setupTelegramWebhook = async () => {
    setSettingUpWebhook(true);
    try {
      const success = await telegramService.setupWebhook();
      if (success) {
        alert('Telegram webhook set up successfully!');
        await loadWebhookInfo();
      } else {
        alert('Failed to set up Telegram webhook. Please try again.');
      }
    } catch (error) {
      console.error('Error setting up webhook:', error);
      alert('Failed to set up webhook. Please check your bot token.');
    } finally {
      setSettingUpWebhook(false);
    }
  };

  const settingSections = [
  const settingsSections = [
{
      id: 'profile',
      title: 'Profile & Business',
      description: 'Manage your account and business information',
      icon: User,
      color: 'bg-blue-50 text-blue-600',
      count: '4 Settings'
      id: 'business',
      title: 'Business Information',
      description: 'Update your restaurant details and contact information',
      icon: Building2,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      iconColor: 'text-blue-600'
},
{
      id: 'restaurant',
      title: 'Restaurant Details',
      description: 'About us, hours, and customer information',
      icon: Building,
      color: 'bg-green-50 text-green-600',
      count: '8 Settings'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Telegram, delivery, and external services',
      icon: MessageSquare,
      color: 'bg-purple-50 text-purple-600',
      count: '3 Services'
      id: 'profile',
      title: 'Owner Profile',
      description: 'Manage your personal information and account settings',
      icon: User,
      color: 'bg-green-50 border-green-200 text-green-700',
      iconColor: 'text-green-600'
},
{
      id: 'operations',
      title: 'Operations',
      description: 'Tables, QR codes, and menu management',
      icon: Table,
      color: 'bg-orange-50 text-orange-600',
      count: '5 Tools'
      id: 'location',
      title: 'Location & Address',
      description: 'Set your restaurant location and delivery settings',
      icon: MapPin,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      iconColor: 'text-purple-600'
},
{
id: 'appearance',
      title: 'Appearance',
      description: 'Theme, language, and display preferences',
      title: 'Menu Appearance',
      description: 'Customize your menu theme and branding',
icon: Palette,
      color: 'bg-pink-50 text-pink-600',
      count: '4 Options'
      color: 'bg-pink-50 border-pink-200 text-pink-700',
      iconColor: 'text-pink-600'
},
{
id: 'notifications',
title: 'Notifications',
      description: 'Web notifications and alert preferences',
      description: 'Configure web notifications and alerts',
icon: Bell,
      color: 'bg-indigo-50 text-indigo-600',
      count: 'Configure'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">Manage your restaurant settings and preferences</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">All systems operational</span>
              </div>
            </div>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings Categories</h2>
              <nav className="space-y-2">
                {settingSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 text-left ${
                      activeSection === section.id
                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${section.color}`}>
                      <section.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{section.title}</div>
                      <div className="text-xs text-gray-500">{section.count}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile & Business Section */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                        <p className="text-gray-600">Manage your personal and business details</p>
                      </div>
                    </div>

                    {/* Profile Picture */}
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-4">Business Logo</label>
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200">
                            {formData.logo ? (
                              <img
                                src={formData.logo}
                                alt="Business Logo"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          {uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                            <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            Recommended: 400x400px, PNG or JPG
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Business Name
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.businessName}
                            onChange={(e) => handleInputChange('businessName', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            placeholder="Enter your business name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Business Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                          <textarea
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            placeholder="Enter your business address"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Restaurant Details Section */}
              {activeSection === 'restaurant' && (
                <div className="space-y-6">
                  {/* About Us */}
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-green-50 rounded-xl">
                        <Building className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Restaurant Information</h2>
                        <p className="text-gray-600">Information displayed to customers</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Restaurant Description
                        </label>
                        <textarea
                          value={formData.aboutUs.description}
                          onChange={(e) => handleAboutUsChange('description', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                          placeholder="Tell customers about your restaurant, cuisine, and what makes you special..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Public Address
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="text"
                              value={formData.aboutUs.address}
                              onChange={(e) => handleAboutUsChange('address', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                              placeholder="123 Main Street, City, State"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Public Phone
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="tel"
                              value={formData.aboutUs.phone}
                              onChange={(e) => handleAboutUsChange('phone', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Public Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="email"
                              value={formData.aboutUs.email}
                              onChange={(e) => handleAboutUsChange('email', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                              placeholder="info@restaurant.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Website
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="url"
                              value={formData.aboutUs.website}
                              onChange={(e) => handleAboutUsChange('website', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                              placeholder="https://www.restaurant.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-orange-50 rounded-xl">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Operating Hours</h3>
                        <p className="text-gray-600">Set your restaurant's opening hours</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(formData.aboutUs.operatingHours).map(([day, hours]) => (
                        <div key={day} className="bg-gray-50 p-4 rounded-xl">
                          <label className="block text-sm font-semibold text-gray-900 mb-3 capitalize">
                            {day}
                          </label>
                          <input
                            type="text"
                            value={hours}
                            onChange={(e) => handleOperatingHoursChange(day, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                            placeholder="9:00 AM - 10:00 PM"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-green-50 rounded-xl">
                        <Star className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Restaurant Features</h3>
                        <p className="text-gray-600">Highlight what makes your restaurant special</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Free WiFi', 'Fresh Food', 'Fast Service', 'Top Rated', 'Outdoor Seating', 'Delivery', 'Takeout', 'Parking'].map((feature) => (
                        <label key={feature} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.aboutUs.features.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleFeaturesChange([...formData.aboutUs.features, feature]);
                              } else {
                                handleFeaturesChange(formData.aboutUs.features.filter(f => f !== feature));
                              }
                            }}
                            className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations Section */}
              {activeSection === 'integrations' && (
                <div className="space-y-6">
                  {/* Telegram Integration */}
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Telegram Integration</h2>
                        <p className="text-gray-600">Configure bot notifications and webhooks</p>
                      </div>
                    </div>

                    {/* Webhook Status Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">Webhook Status</h4>
                          {webhookInfo ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  webhookInfo.result?.url ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <span className="text-blue-800">
                                  {webhookInfo.result?.url ? 'Active' : 'Not configured'}
                                </span>
                              </div>
                              {webhookInfo.result?.url && (
                                <p className="text-blue-700 font-mono text-xs">
                                  {webhookInfo.result.url}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-blue-700 text-sm">Loading webhook status...</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={setupTelegramWebhook}
                          disabled={settingUpWebhook}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                        >
                          {settingUpWebhook ? 'Setting up...' : 'Setup Webhook'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-900 mb-2">Department Management</h4>
                          <p className="text-sm text-yellow-800 mb-3">
                            Telegram integration is now managed through the Department Management section.
                          </p>
                          <p className="text-sm text-yellow-700">
                            Create departments for Kitchen, Bar, Cashier, and Admin to set up proper notification routing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Integration */}
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-orange-50 rounded-xl">
                        <Truck className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Delivery Integration</h2>
                        <p className="text-gray-600">Connect with delivery platforms</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-orange-900 mb-2">Delivery Platforms</h4>
                          <p className="text-sm text-orange-800 mb-4">
                            Configure your restaurant for delivery platforms like Uber Eats, DoorDash, and Grubhub.
                          </p>
                          <ul className="text-sm text-orange-700 space-y-1">
                            <li>• Connect with major delivery platforms</li>
                            <li>• Automatic menu synchronization</li>
                            <li>• Real-time order notifications</li>
                            <li>• Centralized order management</li>
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDeliverySettings(true)}
                          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 font-medium"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Configure</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Operations Section */}
              {activeSection === 'operations' && (
                <div className="space-y-6">
                  {/* Table Management */}
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <Table className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
                        <p className="text-gray-600">Configure tables and generate QR codes</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gray-50 p-6 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-900 mb-4">
                          Number of Tables
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.numberOfTables}
                          onChange={(e) => handleInputChange('numberOfTables', parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-2xl font-bold text-center"
                        />
                        <p className="text-sm text-gray-600 mt-2 text-center">
                          Total tables in your restaurant
                        </p>
                      </div>

                      <div className="space-y-4">
                        <button
                          type="button"
                          onClick={() => setShowQRGenerator(true)}
                          className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-3 font-medium"
                        >
                          <QrCode className="w-5 h-5" />
                          <span>Generate QR Codes</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setShowPrintMenu(true)}
                          disabled={menuItems.length === 0}
                          className="w-full bg-yellow-500 text-white py-4 px-6 rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-3 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <Printer className="w-5 h-5" />
                          <span>Generate Print Menu</span>
                        </button>
                      </div>
                    </div>
                  </div>
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

                  {/* Menu URLs */}
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-green-50 rounded-xl">
                        <Globe className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Menu URLs & Access</h3>
                        <p className="text-gray-600">Share your menu with customers</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Your Menu URL
                        </label>
                        {(() => {
                          const businessSlug = user?.businessName?.toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-')
                            .trim() || 'restaurant';
                          const menuUrl = `${window.location.origin}/${businessSlug}/table/1`;
                          
                          return (
                            <div className="flex items-center space-x-3">
                              <input
                                type="text"
                                value={menuUrl}
                                readOnly
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-700 font-mono text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(menuUrl);
                                  alert('URL copied to clipboard!');
                                }}
                                className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>Copy</span>
                              </button>
                            </div>
                          );
                        })()}
                        <p className="text-sm text-gray-500 mt-3">
                          Share this URL with customers. Change "table/1" to any table number.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-pink-50 rounded-xl">
                        <Palette className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Appearance & Display</h2>
                        <p className="text-gray-600">Customize how your menu looks and feels</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-4">
                            Menu Theme
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: 'classic', label: 'Classic', desc: 'Traditional style' },
                              { value: 'modern', label: 'Modern', desc: 'Contemporary look' },
                              { value: 'elegant', label: 'Elegant', desc: 'Sophisticated design' },
                              { value: 'minimal', label: 'Minimal', desc: 'Clean & simple' }
                            ].map((theme) => (
                              <label
                                key={theme.value}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  formData.settings.menuTheme === theme.value
                                    ? 'border-pink-500 bg-pink-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="menuTheme"
                                  value={theme.value}
                                  checked={formData.settings.menuTheme === theme.value}
                                  onChange={(e) => handleSettingsChange('menuTheme', e.target.value)}
                                  className="sr-only"
                                />
                                <div className="text-center">
                                  <div className="font-medium text-gray-900">{theme.label}</div>
                                  <div className="text-xs text-gray-500">{theme.desc}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-4">
                            Currency
                          </label>
                          <select
                            value={formData.settings.currency}
                            onChange={(e) => handleSettingsChange('currency', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="ETB">ETB (Br)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-4">
                            Default Language
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.settings.language === 'en'
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                            }`}>
                              <input
                                type="radio"
                                name="language"
                                value="en"
                                checked={formData.settings.language === 'en'}
                                onChange={(e) => handleSettingsChange('language', e.target.value)}
                                className="sr-only"
                              />
                              <div className="text-center">
                                <div className="font-medium text-gray-900">English</div>
                                <div className="text-xs text-gray-500">EN</div>
                              </div>
                            </label>
                            <label className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.settings.language === 'am'
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                            }`}>
                              <input
                                type="radio"
                                name="language"
                                value="am"
                                checked={formData.settings.language === 'am'}
                                onChange={(e) => handleSettingsChange('language', e.target.value)}
                                className="sr-only"
                              />
                              <div className="text-center">
                                <div className="font-medium text-gray-900">አማርኛ</div>
                                <div className="text-xs text-gray-500">AM</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-4">
                            Theme Mode
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'light', label: 'Light', icon: '☀️' },
                              { value: 'dark', label: 'Dark', icon: '🌙' },
                              { value: 'auto', label: 'Auto', icon: '🔄' }
                            ].map((theme) => (
                              <label
                                key={theme.value}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  formData.settings.theme === theme.value
                                    ? 'border-pink-500 bg-pink-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="theme"
                                  value={theme.value}
                                  checked={formData.settings.theme === theme.value}
                                  onChange={(e) => handleSettingsChange('theme', e.target.value)}
                                  className="sr-only"
                                />
                                <div className="text-center">
                                  <div className="text-lg mb-1">{theme.icon}</div>
                                  <div className="font-medium text-gray-900 text-sm">{theme.label}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border p-8">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="p-3 bg-indigo-50 rounded-xl">
                        <Bell className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
                        <p className="text-gray-600">Configure how you receive alerts and updates</p>
                      </div>
                    </div>

                    <NotificationSettings />
                  </div>
                </div>
              )}

              {/* Save Button - Fixed at bottom */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-t-2xl shadow-lg">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2 shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
                  </button>
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
            </form>
          </div>
              
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-sm opacity-80">{section.description}</p>
            </div>
          ))}
</div>
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

      {/* Modals */}
      {showQRGenerator && (
      {/* QR Code Generator Modal */}
      {showQRGenerator && userProfile && (
<QRCodeGenerator
userId={user?.id || ''}
          businessName={user?.businessName || 'Restaurant'}
          numberOfTables={formData.numberOfTables}
          businessLogo={formData.logo}
          businessName={userProfile.businessName || 'Restaurant'}
          businessLogo={userProfile.logo}
          numberOfTables={userProfile.numberOfTables || 10}
onClose={() => setShowQRGenerator(false)}
/>
)}
      
      {showPrintMenu && (

      {/* PDF Generator Modal */}
      {showPDFGenerator && userProfile && (
<TableTentPDFGenerator
userId={user?.id || ''}
          businessInfo={user || {} as UserType}
          businessInfo={userProfile}
menuItems={menuItems}
categories={categories}
          onClose={() => setShowPrintMenu(false)}
          onClose={() => setShowPDFGenerator(false)}
/>
)}
      
      {showDeliverySettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Delivery Settings</h2>
                <button 
                  onClick={() => setShowDeliverySettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
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
            <DeliverySettings />
</div>
          
          <button
            onClick={onShowQRGenerator}
            className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate QR Codes
          </button>
</div>
      )}

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