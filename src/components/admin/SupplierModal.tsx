import React, { useState } from 'react';
import { X, Save, Building2, User, MapPin, CreditCard, Truck } from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '../../types/supplier';

interface SupplierModalProps {
  supplier: Supplier | null;
  restaurantId: string;
  isGlobal?: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  supplier,
  restaurantId,
  isGlobal = false,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    // Basic Info
    name: supplier?.name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    
    // Address
    address: {
      line1: supplier?.address.line1 || '',
      line2: supplier?.address.line2 || '',
      city: supplier?.address.city || '',
      state: supplier?.address.state || '',
      postalCode: supplier?.address.postalCode || '',
      country: supplier?.address.country || 'US',
    },
    
    // Contact Person
    contactPerson: {
      name: supplier?.contactPerson.name || '',
      email: supplier?.contactPerson.email || '',
      phone: supplier?.contactPerson.phone || '',
      position: supplier?.contactPerson.position || '',
    },
    
    // Business Info
    businessInfo: {
      registrationNumber: supplier?.businessInfo?.registrationNumber || '',
      taxId: supplier?.businessInfo?.taxId || '',
      website: supplier?.businessInfo?.website || '',
      description: supplier?.businessInfo?.description || '',
    },
    
    // Payment Terms
    paymentTerms: {
      method: supplier?.paymentTerms?.method || 'bank_transfer' as const,
      daysNet: supplier?.paymentTerms?.daysNet || 30,
      discountPercent: supplier?.paymentTerms?.discountPercent || 0,
      discountDays: supplier?.paymentTerms?.discountDays || 0,
    },
    
    // Delivery Info
    deliveryInfo: {
      minimumOrder: supplier?.deliveryInfo?.minimumOrder || 0,
      deliveryFee: supplier?.deliveryInfo?.deliveryFee || 0,
      freeDeliveryThreshold: supplier?.deliveryInfo?.freeDeliveryThreshold || 0,
      estimatedDeliveryDays: supplier?.deliveryInfo?.estimatedDeliveryDays || 3,
      deliveryAreas: supplier?.deliveryInfo?.deliveryAreas || [],
    },
    
    isActive: supplier?.isActive ?? true,
  });
  
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'business' | 'payment' | 'delivery'>('basic');

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supplierData: Omit<Supplier, 'id'> = {
        ...formData,
        type: isGlobal ? 'global' : 'restaurant_specific',
        created_at: supplier?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Only add createdBy field for global suppliers
      if (isGlobal) {
        (supplierData as any).createdBy = 'super_admin';
      } else {
        (supplierData as any).restaurantId = restaurantId;
      }

      if (supplier) {
        await supplierService.updateSupplier(supplier.id, supplierData);
        onSave({ ...supplier, ...supplierData });
      } else {
        const id = await supplierService.addSupplier(supplierData);
        onSave({ id, ...supplierData } as Supplier);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'delivery', label: 'Delivery', icon: Truck },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {supplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Section Navigation */}
          <div className="w-48 border-r bg-gray-50 p-4">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Section */}
              {activeSection === 'basic' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Supplier is active
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {activeSection === 'contact' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Person</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson.name}
                        onChange={(e) => handleInputChange('contactPerson', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson.position}
                        onChange={(e) => handleInputChange('contactPerson', 'position', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Sales Manager"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={formData.contactPerson.email}
                        onChange={(e) => handleInputChange('contactPerson', 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPerson.phone}
                        onChange={(e) => handleInputChange('contactPerson', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pt-4 border-t">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          value={formData.address.line1}
                          onChange={(e) => handleInputChange('address', 'line1', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={formData.address.line2}
                          onChange={(e) => handleInputChange('address', 'line2', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address', 'state', e.target.value)}
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
                          value={formData.address.postalCode}
                          onChange={(e) => handleInputChange('address', 'postalCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country *
                        </label>
                        <select
                          value={formData.address.country}
                          onChange={(e) => handleInputChange('address', 'country', e.target.value)}
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
                    </div>
                  </div>
                </div>
              )}

              {/* Business Section */}
              {activeSection === 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Registration Number
                      </label>
                      <input
                        type="text"
                        value={formData.businessInfo.registrationNumber}
                        onChange={(e) => handleInputChange('businessInfo', 'registrationNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={formData.businessInfo.taxId}
                        onChange={(e) => handleInputChange('businessInfo', 'taxId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.businessInfo.website}
                        onChange={(e) => handleInputChange('businessInfo', 'website', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://supplier-website.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.businessInfo.description}
                        onChange={(e) => handleInputChange('businessInfo', 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Brief description of the supplier's business..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Section */}
              {activeSection === 'payment' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Terms</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={formData.paymentTerms.method}
                        onChange={(e) => handleInputChange('paymentTerms', 'method', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="check">Check</option>
                        <option value="credit">Credit Terms</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms (Days)
                      </label>
                      <input
                        type="number"
                        value={formData.paymentTerms.daysNet}
                        onChange={(e) => handleInputChange('paymentTerms', 'daysNet', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-500 mt-1">Net payment days (e.g., 30 for Net 30)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Early Payment Discount (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.paymentTerms.discountPercent}
                        onChange={(e) => handleInputChange('paymentTerms', 'discountPercent', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="2.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Days
                      </label>
                      <input
                        type="number"
                        value={formData.paymentTerms.discountDays}
                        onChange={(e) => handleInputChange('paymentTerms', 'discountDays', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="10"
                      />
                      <p className="text-xs text-gray-500 mt-1">Days to pay for early discount</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Section */}
              {activeSection === 'delivery' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Delivery Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Order Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.deliveryInfo.minimumOrder}
                        onChange={(e) => handleInputChange('deliveryInfo', 'minimumOrder', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Fee ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.deliveryInfo.deliveryFee}
                        onChange={(e) => handleInputChange('deliveryInfo', 'deliveryFee', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Delivery Threshold ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.deliveryInfo.freeDeliveryThreshold}
                        onChange={(e) => handleInputChange('deliveryInfo', 'freeDeliveryThreshold', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Delivery Days
                      </label>
                      <input
                        type="number"
                        value={formData.deliveryInfo.estimatedDeliveryDays}
                        onChange={(e) => handleInputChange('deliveryInfo', 'estimatedDeliveryDays', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation and Save */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex space-x-2">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id as any)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        activeSection === section.id ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Supplier'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};