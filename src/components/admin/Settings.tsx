import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Upload, 
  X, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Camera,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  QrCode,
  FileText,
  Printer,
  Settings as SettingsIcon,
  Palette
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { telegramService } from '../../services/telegram';
import { imgbbService } from '../../services/imgbb';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { TableTentPDFGenerator } from '../TableTentPDFGenerator';
import { MenuItem, Category } from '../../types';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    website: '',
    numberOfTables: 10,
    logo: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      youtube: '',
      whatsapp: '',
    },
    operatingHours: {
      monday: '9:00 AM - 10:00 PM',
      tuesday: '9:00 AM - 10:00 PM',
      wednesday: '9:00 AM - 10:00 PM',
      thursday: '9:00 AM - 10:00 PM',
      friday: '9:00 AM - 11:00 PM',
      saturday: '10:00 AM - 11:00 PM',
      sunday: '10:00 AM - 9:00 PM',
    },
    features: ['Free WiFi', 'Fresh Food', 'Fast Service', 'Top Rated'],
    specialMessage: '',
    telegramBotUsername: '',
    telegramChatId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'about' | 'telegram' | 'tools'>('general');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadMenuData();
      loadWebhookInfo();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProfile = await firebaseService.getUserProfile(user.id);
      
      if (userProfile) {
        setFormData({
          businessName: userProfile.businessName || '',
          name: userProfile.name || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          address: userProfile.address || '',
          description: userProfile.aboutUs?.description || '',
          website: userProfile.aboutUs?.website || '',
          numberOfTables: userProfile.numberOfTables || 10,
          logo: userProfile.logo || '',
          socialMedia: {
            facebook: userProfile.aboutUs?.socialMedia?.facebook || '',
            instagram: userProfile.aboutUs?.socialMedia?.instagram || '',
            twitter: userProfile.aboutUs?.socialMedia?.twitter || '',
            tiktok: userProfile.aboutUs?.socialMedia?.tiktok || '',
            youtube: userProfile.aboutUs?.socialMedia?.youtube || '',
            whatsapp: userProfile.aboutUs?.socialMedia?.whatsapp || '',
          },
          operatingHours: {
            monday: userProfile.aboutUs?.operatingHours?.monday || '9:00 AM - 10:00 PM',
            tuesday: userProfile.aboutUs?.operatingHours?.tuesday || '9:00 AM - 10:00 PM',
            wednesday: userProfile.aboutUs?.operatingHours?.wednesday || '9:00 AM - 10:00 PM',
            thursday: userProfile.aboutUs?.operatingHours?.thursday || '9:00 AM - 10:00 PM',
            friday: userProfile.aboutUs?.operatingHours?.friday || '9:00 AM - 11:00 PM',
            saturday: userProfile.aboutUs?.operatingHours?.saturday || '10:00 AM - 11:00 PM',
            sunday: userProfile.aboutUs?.operatingHours?.sunday || '10:00 AM - 9:00 PM',
          },
          features: userProfile.aboutUs?.features || ['Free WiFi', 'Fresh Food', 'Fast Service', 'Top Rated'],
          specialMessage: userProfile.aboutUs?.specialMessage || '',
          telegramBotUsername: userProfile.settings?.telegramBotUsername || '',
          telegramChatId: userProfile.telegramChatId || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

  const loadWebhookInfo = async () => {
    try {
      setWebhookLoading(true);
      setWebhookError(null);
      const info = await telegramService.getWebhookInfo();
      setWebhookInfo(info);
    } catch (error) {
      console.error('Error getting webhook info:', error);
      setWebhookError(error instanceof Error ? error.message : 'Failed to get webhook information');
      setWebhookInfo(null);
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleOperatingHoursChange = (day: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: value
      }
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const logoUrl = await imgbbService.uploadImage(file, `${user?.id}_logo`);
      setFormData(prev => ({ ...prev, logo: logoUrl }));
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
      const updates = {
        businessName: formData.businessName,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        numberOfTables: formData.numberOfTables,
        logo: formData.logo,
        telegramChatId: formData.telegramChatId,
        aboutUs: {
          description: formData.description,
          website: formData.website,
          socialMedia: formData.socialMedia,
          operatingHours: formData.operatingHours,
          features: formData.features.filter(f => f.trim()),
          specialMessage: formData.specialMessage,
        },
        settings: {
          ...user.settings,
          telegramBotUsername: formData.telegramBotUsername,
        }
      };

      await firebaseService.updateUserProfile(user.id, updates);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testTelegramConnection = async () => {
    if (!formData.telegramChatId) {
      alert('Please enter a Telegram Chat ID first');
      return;
    }

    setTestingTelegram(true);
    try {
      const success = await telegramService.sendTestMessage(formData.telegramChatId);
      if (success) {
        alert('Test message sent successfully! Check your Telegram.');
      } else {
        alert('Failed to send test message. Please check your Chat ID and bot configuration.');
      }
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      alert('Failed to send test message. Please check your configuration.');
    } finally {
      setTestingTelegram(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your restaurant settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'about', label: 'About Us', icon: Building },
            { id: 'telegram', label: 'Telegram', icon: TestTube },
            { id: 'tools', label: 'Tools', icon: QrCode },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Owner Name
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tables
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.numberOfTables}
                  onChange={(e) => handleInputChange('numberOfTables', parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Logo</h2>
              
              <div className="space-y-4">
                {formData.logo && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={formData.logo}
                      alt="Restaurant Logo"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Current logo</p>
                      <button
                        type="button"
                        onClick={() => handleInputChange('logo', '')}
                        className="text-red-600 text-sm hover:text-red-700"
                      >
                        Remove logo
                      </button>
                    </div>
                  </div>
                )}
                
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
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center space-x-2 w-fit"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Us Tab */}
        {activeTab === 'about' && (
          <div className="space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Description</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Tell customers about your restaurant..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://yourrestaurant.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Message
                  </label>
                  <textarea
                    value={formData.specialMessage}
                    onChange={(e) => handleInputChange('specialMessage', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="A special message for your customers..."
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(formData.socialMedia).map(([platform, url]) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {platform}
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleSocialMediaChange(platform, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={`https://${platform}.com/yourrestaurant`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h2>
              
              <div className="space-y-4">
                {Object.entries(formData.operatingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {day}
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={hours}
                        onChange={(e) => handleOperatingHoursChange(day, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="9:00 AM - 10:00 PM"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Features</h2>
              
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Free WiFi"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  + Add Feature
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Telegram Tab */}
        {activeTab === 'telegram' && (
          <div className="space-y-8">
            {/* Bot Configuration */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bot Configuration</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Username
                  </label>
                  <input
                    type="text"
                    value={formData.telegramBotUsername}
                    onChange={(e) => handleInputChange('telegramBotUsername', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="YourBot"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Bot username without @ symbol (for Telegram login widget)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Chat ID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.telegramChatId}
                      onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., -1002701066037"
                    />
                    <button
                      type="button"
                      onClick={testTelegramConnection}
                      disabled={testingTelegram}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {testingTelegram ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Fallback chat ID for notifications (use Department Management for specific routing)
                  </p>
                </div>
              </div>
            </div>

            {/* Webhook Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Webhook Status</h2>
                <button
                  type="button"
                  onClick={loadWebhookInfo}
                  disabled={webhookLoading}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors disabled:bg-gray-50"
                >
                  {webhookLoading ? 'Checking...' : 'Refresh'}
                </button>
              </div>
              
              {webhookLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Checking webhook status...</span>
                </div>
              ) : webhookError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Webhook Error</span>
                  </div>
                  <p className="text-red-700 text-sm mt-2">{webhookError}</p>
                  <div className="mt-3 text-xs text-red-600">
                    <p><strong>Common solutions:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Verify your bot token is correct in the .env file</li>
                      <li>Make sure the bot token starts with a number followed by a colon</li>
                      <li>Check that the bot was created properly with @BotFather</li>
                      <li>Ensure the bot token hasn't expired or been revoked</li>
                    </ul>
                  </div>
                </div>
              ) : webhookInfo ? (
                <div className="space-y-3">
                  <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                    webhookInfo.result?.url ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    {webhookInfo.result?.url ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className={`font-medium ${
                      webhookInfo.result?.url ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {webhookInfo.result?.url ? 'Webhook Active' : 'No Webhook Set'}
                    </span>
                  </div>
                  
                  {webhookInfo.result && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Webhook Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">URL:</span> {webhookInfo.result.url || 'Not set'}</div>
                        <div><span className="font-medium">Pending Updates:</span> {webhookInfo.result.pending_update_count || 0}</div>
                        <div><span className="font-medium">Last Error:</span> {webhookInfo.result.last_error_message || 'None'}</div>
                        {webhookInfo.result.last_error_date && (
                          <div><span className="font-medium">Last Error Date:</span> {new Date(webhookInfo.result.last_error_date * 1000).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 mb-3">Telegram Setup Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Create a bot with @BotFather on Telegram</li>
                <li>Get your bot token and add it to the .env file as VITE_TELEGRAM_BOT_TOKEN</li>
                <li>Set your bot username in the field above</li>
                <li>Create groups/chats for different departments</li>
                <li>Add @userinfobot to each group to get Chat IDs</li>
                <li>Configure departments in Department Management</li>
                <li>Test the connection using the Test button</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-8">
            {/* QR Code Generator */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">QR Code Generator</h2>
                  <p className="text-gray-600">Generate QR codes for your restaurant tables</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQRGenerator(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate QR Codes</span>
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Generate QR codes for individual tables or in bulk</li>
                  <li>• Download as PNG images or PDF document</li>
                  <li>• Professional table tent design with your branding</li>
                  <li>• Direct links to your menu for each table</li>
                </ul>
              </div>
            </div>

            {/* Print Menu Generator */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Print Menu Generator</h2>
                  <p className="text-gray-600">Create beautiful PDF menus for printing</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPDFGenerator(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Menu PDF</span>
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Available Designs:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Modern:</strong> Stylish layout with circular images and elegant typography</li>
                  <li>• <strong>Classic:</strong> Traditional restaurant menu with clean sections</li>
                  <li>• <strong>Elegant:</strong> Premium design with gold accents for fine dining</li>
                  <li>• <strong>Minimal:</strong> Clean, simple design with focus on readability</li>
                </ul>
              </div>
            </div>

            {/* Menu Statistics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Statistics</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{menuItems.length}</div>
                  <div className="text-sm text-gray-600">Menu Items</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{menuItems.filter(i => i.available).length}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{formData.numberOfTables}</div>
                  <div className="text-sm text-gray-600">Tables</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
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
          businessName={formData.businessName || 'Restaurant'}
          businessLogo={formData.logo}
          numberOfTables={formData.numberOfTables}
          onClose={() => setShowQRGenerator(false)}
        />
      )}

      {/* PDF Generator Modal */}
      {showPDFGenerator && (
        <TableTentPDFGenerator
          userId={user?.id || ''}
          businessInfo={user!}
          menuItems={menuItems}
          categories={categories}
          onClose={() => setShowPDFGenerator(false)}
        />
      )}
    </div>
  );
};