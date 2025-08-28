import React, { useState, useEffect } from 'react';
import { Save, MapPin, Clock, DollarSign, Truck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { deliveryIntegrationService } from '../../services/deliveryIntegration';

interface DeliverySettingsData {
  // Business Information
  legalBusinessName: string;
  businessRegistrationNumber: string;
  taxId: string;
  managerName: string;
  
  // Address with Coordinates
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  
  // Operational Settings
  timeZone: string;
  cuisineTypes: string[];
  averagePrepTime: number;
  deliveryRadius: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  
  // Financial Information
  financialDetails: {
    bankAccount: string;
    iban: string;
    swift: string;
    payoutMethod: 'direct' | 'platform';
  };
}

export const DeliverySettings: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<DeliverySettingsData>({
    legalBusinessName: '',
    businessRegistrationNumber: '',
    taxId: '',
    managerName: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    latitude: 0,
    longitude: 0,
    timeZone: 'America/New_York',
    cuisineTypes: [],
    averagePrepTime: 20,
    deliveryRadius: 5,
    minimumOrderAmount: 15,
    deliveryFee: 2.99,
    financialDetails: {
      bankAccount: '',
      iban: '',
      swift: '',
      payoutMethod: 'platform'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const cuisineOptions = [
    'American', 'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai',
    'Mediterranean', 'French', 'Greek', 'Korean', 'Vietnamese', 'Middle Eastern',
    'Ethiopian', 'Caribbean', 'Brazilian', 'German', 'Spanish', 'Turkish'
  ];

  const timezoneOptions = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'
  ];

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProfile = await firebaseService.getUserProfile(user.id);
      
      if (userProfile) {
        setFormData({
          legalBusinessName: userProfile.legalBusinessName || userProfile.businessName || '',
          businessRegistrationNumber: userProfile.businessRegistrationNumber || '',
          taxId: userProfile.taxId || '',
          managerName: userProfile.managerName || userProfile.name || '',
          addressLine2: userProfile.addressLine2 || '',
          city: userProfile.city || '',
          state: userProfile.state || '',
          postalCode: userProfile.postalCode || '',
          country: userProfile.country || 'US',
          latitude: userProfile.latitude || 0,
          longitude: userProfile.longitude || 0,
          timeZone: userProfile.timeZone || 'America/New_York',
          cuisineTypes: userProfile.cuisineTypes || [],
          averagePrepTime: userProfile.averagePrepTime || 20,
          deliveryRadius: userProfile.deliveryRadius || 5,
          minimumOrderAmount: userProfile.minimumOrderAmount || 15,
          deliveryFee: userProfile.deliveryFee || 2.99,
          financialDetails: userProfile.financialDetails || {
            bankAccount: '',
            iban: '',
            swift: '',
            payoutMethod: 'platform'
          }
        });
      }
    } catch (error) {
      console.error('Error loading delivery settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DeliverySettingsData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFinancialChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      financialDetails: {
        ...prev.financialDetails,
        [field]: value
      }
    }));
  };

  const handleCuisineToggle = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }));
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGettingLocation(false);
        alert('Location updated successfully!');
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get current location. Please enter coordinates manually.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Update user profile with delivery settings
      await firebaseService.updateUserProfile(user.id, formData);
      
      // Sync updated profile to all connected delivery companies
      const integrations = await deliveryIntegrationService.getUserIntegrations(user.id);
      const activeIntegrations = integrations.filter(i => i.isActive);
      
      for (const integration of activeIntegrations) {
        try {
          await deliveryIntegrationService.syncMenuToDeliveryCompany(user.id, integration.deliveryCompanyId);
        } catch (error) {
          console.error(`Failed to sync to ${integration.deliveryCompanyId}:`, error);
        }
      }
      
      alert('Delivery settings saved and synced successfully!');
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Delivery Settings</h1>
        <p className="text-gray-600">Configure your restaurant for delivery platforms</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legal Business Name *
              </label>
              <input
                type="text"
                value={formData.legalBusinessName}
                onChange={(e) => handleInputChange('legalBusinessName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Registration Number
              </label>
              <input
                type="text"
                value={formData.businessRegistrationNumber}
                onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / EIN
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 12-3456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Name
              </label>
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => handleInputChange('managerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Location Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Suite, Unit, Building, Floor, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="ET">Ethiopia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone *
              </label>
              <select
                value={formData.timeZone}
                onChange={(e) => handleInputChange('timeZone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                {timezoneOptions.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Coordinates (Required for delivery)
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {gettingLocation ? 'Getting...' : 'Get Current Location'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="40.7128"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="-74.0060"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Operational Settings</h2>
          </div>
          
          <div className="space-y-6">
            {/* Cuisine Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Types *
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {cuisineOptions.map(cuisine => (
                  <label key={cuisine} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.cuisineTypes.includes(cuisine)}
                      onChange={() => handleCuisineToggle(cuisine)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{cuisine}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Prep Time (minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={formData.averagePrepTime}
                  onChange={(e) => handleInputChange('averagePrepTime', parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Radius (km) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={formData.deliveryRadius}
                  onChange={(e) => handleInputChange('deliveryRadius', parseFloat(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumOrderAmount}
                  onChange={(e) => handleInputChange('minimumOrderAmount', parseFloat(e.target.value) || 15)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Financial Information</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payoutMethod"
                    value="platform"
                    checked={formData.financialDetails.payoutMethod === 'platform'}
                    onChange={(e) => handleFinancialChange('payoutMethod', e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Platform Managed</div>
                    <div className="text-xs text-gray-500">Delivery company handles payouts</div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payoutMethod"
                    value="direct"
                    checked={formData.financialDetails.payoutMethod === 'direct'}
                    onChange={(e) => handleFinancialChange('payoutMethod', e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Direct Deposit</div>
                    <div className="text-xs text-gray-500">Direct to your bank account</div>
                  </div>
                </label>
              </div>
            </div>

            {formData.financialDetails.payoutMethod === 'direct' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.financialDetails.bankAccount}
                    onChange={(e) => handleFinancialChange('bankAccount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN (International)
                  </label>
                  <input
                    type="text"
                    value={formData.financialDetails.iban}
                    onChange={(e) => handleFinancialChange('iban', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="GB29 NWBK 6016 1331 9268 19"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SWIFT Code
                  </label>
                  <input
                    type="text"
                    value={formData.financialDetails.swift}
                    onChange={(e) => handleFinancialChange('swift', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="NWBKGB2L"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Configuration */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Truck className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Delivery Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Base delivery fee (may be overridden by delivery company)
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Important Notes</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Accurate coordinates are essential for delivery radius calculation</li>
                <li>• Business registration details must match your legal documents</li>
                <li>• Changes will be synced to all connected delivery platforms</li>
                <li>• Financial information is required for direct payouts</li>
              </ul>
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
            <span>{saving ? 'Saving...' : 'Save Delivery Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};