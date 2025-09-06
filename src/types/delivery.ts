// Delivery Integration Types

export interface DeliveryCompany {
  id: string;
  name: string;
  apiEndpoint: string;
  authType: 'api_key' | 'oauth' | 'basic';
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
  };
  webhookUrl?: string;
  isActive: boolean;
  supportedFeatures: {
    menuSync: boolean;
    orderReceiving: boolean;
    statusUpdates: boolean;
    realTimeUpdates: boolean;
  };
  created_at: string;
}

export interface RestaurantProfile {
  // Basic Information
  restaurantName: string;
  restaurantId: string;
  legalBusinessName: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  
  // Contact Information
  ownerName: string;
  managerName?: string;
  contactEmail: string;
  contactPhone: string;
  
  // Address Information
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  
  // Operational Information
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  timeZone: string;
  cuisineTypes: string[];
  averagePrepTime: number; // in minutes
  deliveryRadius: number; // in kilometers
  
  // Financial Information
  financialDetails?: {
    bankAccount: string;
    iban?: string;
    swift?: string;
    currency: string;
    payoutMethod: 'direct' | 'platform';
  };
  
  // Additional Information
  description?: string;
  logo?: string;
  coverImage?: string;
  minimumOrderAmount?: number;
  deliveryFee?: number;
  isActive: boolean;
}

export interface DeliveryMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  image?: string;
  isAvailable: boolean;
  preparationTime: number;
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  tags?: string[]; // vegetarian, vegan, spicy, etc.
  variants?: Array<{
    name: string;
    priceModifier: number;
    isDefault: boolean;
  }>;
  addOns?: Array<{
    name: string;
    price: number;
    isRequired: boolean;
  }>;
}

export interface DeliveryOrder {
  id: string;
  deliveryCompanyOrderId: string;
  deliveryCompany: string;
  restaurantId: string;
  
  // Customer Information
  customer: {
    name: string;
    phone: string;
    email?: string;
    deliveryAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      latitude?: number;
      longitude?: number;
      instructions?: string;
    };
  };
  
  // Order Details
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    variants?: Array<{
      name: string;
      price: number;
    }>;
    addOns?: Array<{
      name: string;
      price: number;
    }>;
    specialInstructions?: string;
  }>;
  
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip?: number;
  total: number;
  
  // Status and Timing
  status: 'received' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  estimatedPrepTime: number;
  estimatedDeliveryTime?: string;
  
  // Payment Information
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  
  // Timestamps
  orderTime: string;
  acceptedAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  
  // Special Instructions
  specialInstructions?: string;
  deliveryInstructions?: string;
  
  // Metadata
  source: string; // delivery company name
  metadata?: Record<string, any>;
}

export interface DeliveryIntegration {
  id: string;
  userId: string;
  deliveryCompanyId: string;
  isActive: boolean;
  lastSync: string;
  syncStatus: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  settings: {
    autoAcceptOrders: boolean;
    defaultPrepTime: number;
    markupPercentage: number;
    syncFrequency: number; // in minutes
  };
  created_at: string;
  updated_at: string;
}

export interface DeliveryWebhookEvent {
  id: string;
  type: 'order_placed' | 'order_cancelled' | 'payment_confirmed' | 'delivery_assigned';
  deliveryCompany: string;
  restaurantId: string;
  orderId: string;
  data: any;
  timestamp: string;
  processed: boolean;
  processedAt?: string;
  errorMessage?: string;
}

export interface DeliveryAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByCompany: Record<string, number>;
  revenueByCompany: Record<string, number>;
  popularItems: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    orders: number;
  }>;
  customerSatisfaction: {
    averageRating: number;
    totalReviews: number;
  };
}