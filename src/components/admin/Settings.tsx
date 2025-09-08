import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Upload, 
  X, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Palette,
  QrCode,
  FileText,
  TestTube,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { telegramService } from '../../services/telegram';
import { imgbbService } from '../../services/imgbb';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { TableTentPDFGenerator } from '../TableTentPDFGenerator';
import { User, MenuItem, Category } from '../../types';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
      loadMenuData();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProfile = await firebaseService.getUserProfile(user.id);
      if (userProfile) {
        setFormData(userProfile);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
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

  const handleInputChange = (field: keyof User, value: any) => {
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
          ...prev.aboutUs?.socialMedia,
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
          ...prev.aboutUs?.operatingHours,
          [day]: value
        }
      }
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
      await firebaseService.updateUserProfile(user.id, formData);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
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
        alert('Failed to send test message. Please check your Chat ID.');
      }
    } catch (error) {
      console.error('Error testing Telegram:', error);
      alert('Failed to send test message');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
          <p className="text-gray-600">Manage your restaurant information and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
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
            <FileText className="w-4 h-4" />
            <span>Print Menu</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.businessName || ''}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                value={formData.numberOfTables || 10}
                onChange={(e) => handleInputChange('numberOfTables', parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your restaurant address"
              />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Logo</h2>
          
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {formData.logo ? (
                <img 
                  src={formData.logo} 
                  alt="Restaurant Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="w-8 h-8 text-gray-400" />
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
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center space-x-2"
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

        {/* Telegram Integration */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Telegram Integration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram Chat ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.telegramChatId || ''}
                  onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., -1002701066037"
                />
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={testingTelegram}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
                >
                  <TestTube className="w-4 h-4" />
                  <span>{testingTelegram ? 'Testing...' : 'Test'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your Chat ID by messaging @userinfobot on Telegram
              </p>
            </div>
          </div>
        </div>

        {/* About Us Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About Us Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.aboutUs?.description || ''}
                onChange={(e) => handleAboutUsChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tell customers about your restaurant..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.aboutUs?.email || ''}
                    onChange={(e) => handleAboutUsChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={formData.aboutUs?.website || ''}
                    onChange={(e) => handleAboutUsChange('website', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
                  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourpage' },
                  { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/yourpage' },
                  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+1234567890' },
                ].map((social) => (
                  <div key={social.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {social.label}
                    </label>
                    <input
                      type="text"
                      value={formData.aboutUs?.socialMedia?.[social.key as keyof typeof formData.aboutUs.socialMedia] || ''}
                      onChange={(e) => handleSocialMediaChange(social.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={social.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Operating Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'monday', 'tuesday', 'wednesday', 'thursday', 
                  'friday', 'saturday', 'sunday'
                ].map((day) => (
                  <div key={day}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {day}
                    </label>
                    <input
                      type="text"
                      value={formData.aboutUs?.operatingHours?.[day] || ''}
                      onChange={(e) => handleOperatingHoursChange(day, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="9:00 AM - 10:00 PM"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Message
              </label>
              <textarea
                value={formData.aboutUs?.specialMessage || ''}
                onChange={(e) => handleAboutUsChange('specialMessage', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="A special message for your customers..."
              />
            </div>
          </div>
        </div>

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
          numberOfTables={formData.numberOfTables || 10}
          onClose={() => setShowQRGenerator(false)}
        />
      )}

      {/* PDF Generator Modal */}
      {showPDFGenerator && (
        <TableTentPDFGenerator
          userId={user?.id || ''}
          businessInfo={formData as User}
          menuItems={menuItems}
          categories={categories}
          onClose={() => setShowPDFGenerator(false)}
        />
      )}
    </div>
  );
};