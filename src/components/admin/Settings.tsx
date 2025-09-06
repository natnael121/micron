import React, { useState, useEffect } from 'react';
import { 
  Save, Upload, User, Building, MessageSquare, Globe, 
  Palette, QrCode, Download, Table, Printer, Truck, X,
  Shield, Bell, CreditCard, MapPin, Phone, Mail,
  Settings as SettingsIcon, Camera, Check, AlertTriangle,
  Wifi, Clock, Star, ExternalLink
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

export const Settings: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
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
      loadMenuData();
    }
  }, [user]);

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

  const loadWebhookInfo = async () => {
    try {
      const info = await telegramService.getWebhookInfo();
      setWebhookInfo(info);
    } catch (error) {
      console.error('Error loading webhook info:', error);
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

    setUploading(true);
    try {
      const logoUrl = await imgbbService.uploadImage(file, `${user.id}_logo_${Date.now()}`);
      handleInputChange('logo', logoUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
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
    {
      id: 'profile',
      title: 'Profile & Business',
      description: 'Manage your account and business information',
      icon: User,
      color: 'bg-blue-50 text-blue-600',
      count: '4 Settings'
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
    },
    {
      id: 'operations',
      title: 'Operations',
      description: 'Tables, QR codes, and menu management',
      icon: Table,
      color: 'bg-orange-50 text-orange-600',
      count: '5 Tools'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Theme, language, and display preferences',
      icon: Palette,
      color: 'bg-pink-50 text-pink-600',
      count: '4 Options'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Web notifications and alert preferences',
      icon: Bell,
      color: 'bg-indigo-50 text-indigo-600',
      count: 'Configure'
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
          </div>
        </div>
      </div>

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
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQRGenerator && (
        <QRCodeGenerator
          userId={user?.id || ''}
          businessName={user?.businessName || 'Restaurant'}
          numberOfTables={formData.numberOfTables}
          businessLogo={formData.logo}
          onClose={() => setShowQRGenerator(false)}
        />
      )}
      
      {showPrintMenu && (
        <TableTentPDFGenerator
          userId={user?.id || ''}
          businessInfo={user || {} as UserType}
          menuItems={menuItems}
          categories={categories}
          onClose={() => setShowPrintMenu(false)}
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
            </div>
            <DeliverySettings />
          </div>
        </div>
      )}
    </div>
  );
};