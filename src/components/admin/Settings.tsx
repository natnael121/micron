import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Upload, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Palette,
  QrCode,
  FileText,
  Bell,
  TestTube,
  Download,
  Printer
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { imgbbService } from '../../services/imgbb';
import { telegramService } from '../../services/telegram';
import { NotificationSettings } from './NotificationSettings';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { TableTentPDFGenerator } from '../TableTentPDFGenerator';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    businessName: user?.businessName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    numberOfTables: user?.numberOfTables || 10,
    logo: user?.logo || '',
    description: user?.aboutUs?.description || '',
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
    telegramBotUsername: user?.settings?.telegramBotUsername || '',
  });

  useEffect(() => {
    if (user) {
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const logoUrl = await imgbbService.uploadImage(file, `${user?.id}_logo`);
      setFormData(prev => ({ ...prev, logo: logoUrl }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const updates = {
        businessName: formData.businessName,
        phone: formData.phone,
        address: formData.address,
        numberOfTables: formData.numberOfTables,
        logo: formData.logo,
        aboutUs: {
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          socialMedia: formData.socialMedia,
          operatingHours: formData.operatingHours,
          features: formData.features,
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

  const testTelegramBot = async () => {
    if (!formData.telegramBotUsername) {
      alert('Please enter your Telegram bot username first');
      return;
    }

    try {
      const success = await telegramService.sendTestMessage('-1002701066037'); // Default test chat
      if (success) {
        alert('Telegram bot is working correctly!');
      } else {
        alert('Failed to send test message. Please check your bot configuration.');
      }
    } catch (error) {
      console.error('Error testing Telegram bot:', error);
      alert('Failed to test Telegram bot');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your restaurant settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowQRGenerator(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Generate QR Codes</span>
          </button>
          <button
            onClick={() => setShowPDFGenerator(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Menu</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Business Information</span>
          </h2>
          
          <div className="space-y-4">
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
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Tables
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.numberOfTables}
                onChange={(e) => handleInputChange('numberOfTables', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Logo
              </label>
              <div className="space-y-3">
                {formData.logo && (
                  <img
                    src={formData.logo}
                    alt="Business Logo"
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                )}
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
                  <span>{loading ? 'Uploading...' : 'Upload Logo'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* About Us Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About Us Information</h2>
          
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
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>
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
          
          <div className="space-y-4">
            {Object.entries(formData.socialMedia).map(([platform, url]) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {platform}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleNestedInputChange('socialMedia', platform, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={`https://${platform}.com/yourpage`}
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
              <div key={day}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {day}
                </label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => handleNestedInputChange('operatingHours', day, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="9:00 AM - 10:00 PM"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Telegram Integration */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Telegram Integration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram Bot Username
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.telegramBotUsername}
                  onChange={(e) => handleInputChange('telegramBotUsername', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="YourBotUsername"
                />
                <button
                  onClick={testTelegramBot}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Test</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for Telegram login widget and deep links
              </p>
            </div>
          </div>
        </div>

        {/* Web Notifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Web Notifications</span>
          </h2>
          <NotificationSettings />
        </div>

        {/* Tools & Utilities */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tools & Utilities</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">QR Code Generator</h3>
                <p className="text-sm text-gray-600">Generate QR codes for your tables</p>
              </div>
              <button
                onClick={() => setShowQRGenerator(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Generate</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Print Menu</h3>
                <p className="text-sm text-gray-600">Generate professional menu PDFs</p>
              </div>
              <button
                onClick={() => setShowPDFGenerator(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Generate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Generator Modal */}
      {showQRGenerator && user && (
        <QRCodeGenerator
          userId={user.id}
          businessName={formData.businessName}
          businessLogo={formData.logo}
          numberOfTables={formData.numberOfTables}
          onClose={() => setShowQRGenerator(false)}
        />
      )}

      {/* PDF Generator Modal */}
      {showPDFGenerator && user && (
        <TableTentPDFGenerator
          userId={user.id}
          businessInfo={user}
          menuItems={menuItems}
          categories={categories}
          onClose={() => setShowPDFGenerator(false)}
        />
      )}
    </div>
  );
};