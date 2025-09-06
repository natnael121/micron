// Supplier Management Types

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    position?: string;
  };
  businessInfo: {
    registrationNumber?: string;
    taxId?: string;
    website?: string;
    description?: string;
  };
  type: 'global' | 'restaurant_specific';
  isActive: boolean;
  created_at: string;
  updated_at: string;
  
  // For restaurant-specific suppliers
  restaurantId?: string;
  
  // For global suppliers
  createdBy?: string; // Super admin ID
  
  // Analytics
  totalOrders?: number;
  totalRevenue?: number;
  averageOrderValue?: number;
  lastOrderDate?: string;
  
  // Payment terms
  paymentTerms?: {
    method: 'cash' | 'bank_transfer' | 'check' | 'credit';
    daysNet: number; // e.g., 30 for Net 30
    discountPercent?: number;
    discountDays?: number;
  };
  
  // Delivery information
  deliveryInfo?: {
    minimumOrder?: number;
    deliveryFee?: number;
    freeDeliveryThreshold?: number;
    estimatedDeliveryDays: number;
    deliveryAreas: string[];
  };
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  sku?: string;
  barcode?: string;
  
  // Pricing
  unitPrice: number;
  currency: string;
  unit: string; // kg, lbs, pieces, boxes, etc.
  minimumOrderQuantity: number;
  
  // Availability
  isAvailable: boolean;
  stockQuantity?: number;
  leadTimeDays?: number;
  
  // Product details
  brand?: string;
  specifications?: Record<string, string>;
  images?: string[];
  documents?: Array<{
    name: string;
    url: string;
    type: 'spec_sheet' | 'safety_data' | 'certificate' | 'other';
  }>;
  
  // Nutritional info (for food products)
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    allergens?: string[];
  };
  
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // Auto-generated: PO-YYYY-MM-DD-XXX
  restaurantId: string;
  supplierId: string;
  
  // Order details
  items: Array<{
    productId: string;
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    total: number;
    notes?: string;
  }>;
  
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  
  // Status tracking
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'invoiced' | 'paid';
  
  // Dates
  orderDate: string;
  requestedDeliveryDate?: string;
  confirmedDeliveryDate?: string;
  actualDeliveryDate?: string;
  
  // Additional info
  notes?: string;
  internalNotes?: string;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  
  // Payment tracking
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentDueDate?: string;
  paymentMethod?: string;
  
  // Documents
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    type: 'purchase_order' | 'invoice' | 'receipt' | 'delivery_note' | 'other';
    uploadedAt: string;
    uploadedBy: string;
  }>;
  
  created_at: string;
  updated_at: string;
  createdBy: string;
}

export interface SupplierInvoice {
  id: string;
  purchaseOrderId: string;
  restaurantId: string;
  supplierId: string;
  
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  
  subtotal: number;
  tax: number;
  total: number;
  
  status: 'pending' | 'paid' | 'overdue' | 'disputed';
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  
  // Document
  invoiceUrl?: string;
  receiptUrl?: string;
  
  created_at: string;
  updated_at: string;
}

export interface SupplierAnalytics {
  totalSuppliers: number;
  globalSuppliers: number;
  restaurantSuppliers: number;
  
  totalPurchaseOrders: number;
  totalPurchaseValue: number;
  averageOrderValue: number;
  
  topSuppliers: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
    restaurants: number; // For global suppliers
  }>;
  
  topProducts: Array<{
    id: string;
    name: string;
    supplier: string;
    orders: number;
    revenue: number;
  }>;
  
  ordersByStatus: Record<PurchaseOrder['status'], number>;
  monthlyTrends: Array<{
    month: string;
    orders: number;
    value: number;
  }>;
  
  supplierPerformance: Array<{
    supplierId: string;
    name: string;
    onTimeDelivery: number; // percentage
    averageDeliveryDays: number;
    qualityRating: number;
    totalOrders: number;
  }>;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string; // For subcategories
  order: number;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

// Supplier Authentication Types
export interface SupplierUser {
  id: string;
  email: string;
  name: string;
  supplierId: string;
  role: 'supplier_admin' | 'supplier_staff';
  isActive: boolean;
  created_at: string;
  lastLogin?: string;
}

// Supplier Dashboard Types
export interface SupplierDashboardStats {
  activeOrders: number;
  monthlyRevenue: number;
  restaurantCustomers: number;
  averageDeliveryTime: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface RestaurantCustomer {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  averageOrderValue: number;
  status: 'active' | 'inactive';
}

export interface SupplierOrderLocation {
  orderId: string;
  restaurantName: string;
  address: string;
  latitude: number;
  longitude: number;
  orderTotal: number;
  status: PurchaseOrder['status'];
  orderDate: string;
  restaurantLocation?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}