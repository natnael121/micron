import React, { useState, useEffect } from 'react';
import { 
  Save, Upload, User, Building, MessageSquare, Globe, 
  Palette, QrCode, Download, Table, Printer, Truck, X 
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
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    telegramChatId: user?.telegramChatId || '', // Keep for backward compatibility
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
      
      // Load webhook info
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

  const handleTelegramSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      telegramSettings: {
        ...prev.telegramSettings,
        [field]: value
      }
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

  const testTelegramConnection = async () => {
    if (!formData.telegramSettings.adminChatId) {
      alert('Please enter your Admin Telegram Chat ID first');
      return;
    }

    try {
      const { telegramService } = await import('../../services/telegram');
      const success = await telegramService.sendTestMessage(formData.telegramSettings.adminChatId);
      if (success) {
        alert('Test message sent to Admin chat! Check your Telegram.');
      } else {
        alert('Failed to send test message. Please check your Chat ID.');
      }
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      alert('Failed to send test message. Please check your Chat ID.');
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
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and restaurant settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <details className="bg-white rounded-lg shadow-sm border">
          <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
            </div>
          </summary>
          <div className="px-6 pb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Logo
              </label>
              <div className="space-y-4">
                {formData.logo && (
                  <img
                    src={formData.logo}
                    alt="Business Logo"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                )}
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          </div>
        </details>

        {/* Telegram Integration */}
        <details className="bg-white rounded-lg shadow-sm border">
          <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Bot Configuration</h2>
            </div>
          </summary>
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {/* Webhook Status */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Webhook Status</h3>
                {webhookInfo ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">URL:</span>
                      <span className="text-blue-900 font-mono text-xs">
                        {webhookInfo.result?.url || 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Status:</span>
                      <span className={`font-medium ${
                        webhookInfo.result?.url ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {webhookInfo.result?.url ? 'Active' : 'Not configured'}
                      </span>
                    </div>
                    {webhookInfo.result?.last_error_date && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Last Error:</span>
                        <span className="text-red-600 text-xs">
                          {new Date(webhookInfo.result.last_error_date * 1000).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-blue-700 text-sm">Loading webhook status...</p>
                )}
                
                <button
                  type="button"
                  onClick={setupTelegramWebhook}
                  disabled={settingUpWebhook}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {settingUpWebhook ? 'Setting up...' : 'Setup Webhook'}
                </button>
              </div>

              {/* Bot Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram Bot Username
                  </label>
                  <input
                    type="text"
                    value={formData.settings.telegramBotUsername || ''}
                    onChange={(e) => handleSettingsChange('telegramBotUsername', e.target.value)}
                    placeholder="YourBot (without @)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Your bot username for generating deep links
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Note:</strong> Telegram integration is now managed through the Department Management section.
                </p>
                <p className="text-sm text-yellow-700">
                  Create departments for Kitchen, Bar, Cashier, and Admin to set up proper notification routing.
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* Delivery Integration Settings */}
        <details className="bg-white rounded-lg shadow-sm border">
          <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Delivery Integration</h2>
            </div>
          </summary>
          <div className="px-6 pb-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Configure your restaurant for delivery platforms like Uber Eats, DoorDash, and Grubhub.
              </p>
              
              <button
                type="button"
                onClick={() => setShowDeliverySettings(true)}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <Truck className="w-4 h-4" />
                <span>Configure Delivery Settings</span>
              </button>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Delivery Integration Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Connect with major delivery platforms</li>
                  <li>• Automatic menu synchronization</li>
                  <li>• Real-time order notifications</li>
                  <li>• Centralized order management</li>
                  <li>• Revenue tracking and analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </details>

        {/* About Us Settings */}
        <details className="bg-white rounded-lg shadow-sm border">
          <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">About Us Information</h2>
            </div>
          </summary>
          <div className="px-6 pb-6 space-y-6">
            {/* Business Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                value={formData.aboutUs.description}
                onChange={(e) => handleAboutUsChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tell customers about your restaurant, cuisine, and what makes you special..."
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Address
                </label>
                <input
                  type="text"
                  value={formData.aboutUs.address}
                  onChange={(e) => handleAboutUsChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="123 Main Street, City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Phone
                </label>
                <input
                  type="tel"
                  value={formData.aboutUs.phone}
                  onChange={(e) => handleAboutUsChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Email
                </label>
                <input
                  type="email"
                  value={formData.aboutUs.email}
                  onChange={(e) => handleAboutUsChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="info@restaurant.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.aboutUs.website}
                  onChange={(e) => handleAboutUsChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://www.restaurant.com"
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Operating Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.aboutUs.operatingHours).map(([day, hours]) => (
                  <div key={day}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {day}
                    </label>
                    <input
                      type="text"
                      value={hours}
                      onChange={(e) => handleOperatingHoursChange(day, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="9:00 AM - 10:00 PM"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.aboutUs.socialMedia.facebook}
                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.aboutUs.socialMedia.instagram}
                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={formData.aboutUs.socialMedia.twitter}
                    onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://twitter.com/yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TikTok
                  </label>
                  <input
                    type="url"
                    value={formData.aboutUs.socialMedia.tiktok}
                    onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://tiktok.com/@yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={formData.aboutUs.socialMedia.youtube}
                    onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://youtube.com/c/yourchannel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.aboutUs.socialMedia.whatsapp}
                    onChange={(e) => handleSocialMediaChange('whatsapp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Free WiFi', 'Fresh Food', 'Fast Service', 'Top Rated', 'Outdoor Seating', 'Delivery', 'Takeout', 'Parking'].map((feature) => (
                  <label key={feature} className="flex items-center">
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
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Message
              </label>
              <textarea
                value={formData.aboutUs.specialMessage}
                onChange={(e) => handleAboutUsChange('specialMessage', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="A special message for your customers (e.g., welcome message, daily specials, etc.)"
              />
            </div>
          </div>
        </details>

        {/* App Settings */}
        <details className="bg-white rounded-lg shadow-sm border" open>
          <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">App Settings</h2>
            </div>
          </summary>
          <div className="px-6 pb-6 space-y-6">
          {/* Web Notifications */}
          <div className="border-t pt-6">
            <NotificationSettings />
          </div>
          
          {/* Table Management */}
          <div className="border-t pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <Table className="w-5 h-5 text-gray-500" />
              <h3 className="text-md font-semibold text-gray-900">Table Management</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tables
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.numberOfTables}
                  onChange={(e) => handleInputChange('numberOfTables', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set the total number of tables in your restaurant
                </p>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowQRGenerator(true)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate QR Codes</span>
                </button>
              </div>
            </div>
            
            {/* Print Menu Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Print Menu
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Generate a professional printed menu with pictures and prices
                </p>
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowPrintMenu(true)}
                  disabled={menuItems.length === 0}
                  className="w-full bg-yellow-400 text-black py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center space-x-2 font-semibold disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Menu</span>
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Theme
              </label>
              <select
                value={formData.settings.menuTheme || 'classic'}
                onChange={(e) => handleSettingsChange('menuTheme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="elegant">Elegant</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.settings.currency}
                onChange={(e) => handleSettingsChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                value={formData.settings.language}
                onChange={(e) => handleSettingsChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="am">አማርኛ (Amharic)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={formData.settings.theme}
                onChange={(e) => handleSettingsChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                checked={formData.settings.notifications}
                onChange={(e) => handleSettingsChange('notifications', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                Enable notifications
              </label>
            </div>
          </div>
          </div>
        </details>

        {/* Menu URL */}
        <details className="bg-white rounded-lg shadow-sm border">
          <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Menu URLs & Deep Links</h2>
            </div>
          </summary>
          <div className="px-6 pb-6">
          <div className="space-y-4">
            {/* Traditional Menu URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={menuUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(menuUrl);
                    alert('URL copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Copy
                </button>
              </div>
                );
              })()}
              <p className="text-sm text-gray-500 mt-1">
                Share this URL with your customers. Change "table/1" to any table number. Format: domain/business-name/table-number
              </p>
            </div>
          </div>
            {/* Telegram Deep Link */}
            {user?.settings?.telegramBotUsername && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telegram Deep Link (Table 1)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`https://t.me/${user.settings.telegramBotUsername}?start=${user?.id}_1`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://t.me/${user.settings.telegramBotUsername}?start=${user?.id}_1`);
                      alert('Deep link copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Telegram deep link that opens your bot. Change "_1" to any table number.
                </p>
              </div>
            )}
          </div>
        </details>

        {/* Save Button */}
        <div className="flex justify-end pb-20 lg:pb-0">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* QR Code Generator Modal */}
      {showQRGenerator && (
        <QRCodeGenerator
          userId={user?.id || ''}
          businessName={user?.businessName || 'Restaurant'}
          numberOfTables={formData.numberOfTables}
          businessLogo={formData.logo}
          onClose={() => setShowQRGenerator(false)}
        />
      )}
      
      {/* Print Menu Generator Modal */}
      {showPrintMenu && (
        <TableTentPDFGenerator
          userId={user?.id || ''}
          businessInfo={user || {} as UserType}
          menuItems={menuItems}
          categories={categories}
          onClose={() => setShowPrintMenu(false)}
        />
      )}
      
      {/* Delivery Settings Modal */}
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