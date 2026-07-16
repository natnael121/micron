// Core Types
export interface User {
  id: string;
  email: string;
  name?: string;
  businessName?: string;
  phone?: string;
  address?: string;
  logo?: string;
  status?: 'active' | 'inactive' | 'suspended';
  created_at: string;
  subscription?: 'free' | 'premium';
  numberOfTables?: number;
  telegramChatId?: string; // Backward compatibility
  telegramSettings?: {
    adminChatId?: string;
    kitchenChatId?: string;
    barChatId?: string;
  };
  aboutUs?: {
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
      whatsapp?: string;
    };
    operatingHours?: {
      monday?: string;
      tuesday?: string;
      wednesday?: string;
      thursday?: string;
      friday?: string;
      saturday?: string;
      sunday?: string;
    };
    features?: string[];
    specialMessage?: string;
  };
  settings?: {
    currency?: string;
    language?: string;
    theme?: string;
    notifications?: boolean;
    menuTheme?: string;
  };
}

export interface DayReport {
  id: string;
  userId: string;
  date: string;
  cashierInfo: {
    name: string;
    shift: string;
    notes: string;
  };
  totalOrders: number;
  totalRevenue: number;
  totalPayments: number;
  waiterCalls: number;
  mostOrderedItems: Array<{ name: string; count: number }>;
  mostActiveTable: string;
  departmentStats: {
    kitchen: { orders: number; avgPrepTime: number };
  };
  timestamp: string;
  status: 'open' | 'closed';
}

export interface WaiterAssignment {
  id: string;
  userId: string;
  waiterName: string;
  startTable: number;
  endTable: number;
  isActive: boolean;
  telegramChatId?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  workingDays?: number[]; // 0-6 (Sunday-Saturday)
  created_at: string;
  updated_at?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  photo?: string;
  category: string;
  available: boolean;
  preparation_time: number;
  ingredients?: string;
  allergens?: string;
  popularity_score: number;
  views: number;
  orders: number;
  last_updated: string;
  userId?: string;
  department?: 'kitchen';
  scheduleIds?: string[]; // Array of schedule IDs this item belongs to
  allergenIds?: string[]; // Array of allergen IDs for structured data
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  order: number;
  icon?: string;
  created_at: string;
}

export interface MenuSchedule {
  id: string;
  name: string;
  userId: string;
  startTime: string; // Format: "HH:MM" (24-hour)
  endTime: string; // Format: "HH:MM" (24-hour)
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  isActive: boolean;
  order: number;
  created_at: string;
}

export interface WaiterCall {
  id: string;
  userId: string;
  tableNumber: string;
  waiterName?: string;
  timestamp: string;
  status: 'pending' | 'acknowledged' | 'completed';
  updatedAt?: string;
}

export interface ScheduledMenuItem extends MenuItem {
  currentSchedule?: MenuSchedule;
  nextAvailableSchedule?: MenuSchedule;
  isCurrentlyAvailable: boolean;
}

export interface Department {
  id: string;
  name: string;
  userId: string;
  telegramChatId: string;
  adminChatId?: string; // For cashier department
  order: number;
  icon?: string;
  role: 'kitchen' | 'cashier' | 'admin';
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  userId: string;
  cafeId?: string; // New field for multi-café support
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'approved';
  paymentStatus: 'pending' | 'paid' | 'failed';
  timestamp: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    telegramId?: string;
    telegramUsername?: string;
    telegramPhoto?: string;
  };
  notes?: string;
  deliveryInfo?: {
    company: string;
    orderId: string;
    address: any;
    estimatedDeliveryTime?: string;
    driverName?: string;
    driverPhone?: string;
    estimatedPickupTime?: string;
  };
}

export interface PendingOrder {
  id: string;
  tableNumber: string;
  userId: string;
  cafeId?: string; // New field for multi-café support
  items: OrderItem[];
  totalAmount: number;
  timestamp: string;
  customerInfo?: {
    telegramId?: string;
    telegramUsername?: string;
    telegramPhoto?: string;
  };
}

export interface TableBill {
  id: string;
  tableNumber: string;
  userId: string;
  cafeId?: string; // New field for multi-café support
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'active' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  paymentConfirmationId?: string;
}

export interface PaymentConfirmation {
  id: string;
  tableNumber: string;
  userId: string;
  cafeId?: string; // New field for multi-café support
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  method: 'bank_transfer' | 'mobile_money';
  screenshotUrl: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  processedAt?: string;
  orderId?: string;
}

export interface Bill {
  id: string;
  orderId: string;
  userId: string;
  cafeId?: string; // New field for multi-café support
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: string;
  status: 'draft' | 'sent' | 'paid';
}

// New types for Telegram integration
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface CafeTableSession {
  cafeId: string;
  tableId: string;
  telegramUser?: TelegramUser;
  sessionId: string;
  timestamp: string;
  isGuest: boolean;
}

export interface DeepLinkParams {
  cafeId: string;
  tableId: string;
  botUsername?: string;
}

// Analytics and Stats
export interface Analytics {
  tableNumber: string;
  itemViews: Record<string, number>;
  itemOrders: Record<string, number>;
  waiterCalls: number;
  billRequests: number;
  totalSpent: number;
  orderCount: number;
  sessionStart: string;
}

export interface TableStats {
  tableNumber: string;
  orders: number;
  totalSpent: number;
  waiterCalls: number;
  billRequests: number;
  lastActivity: string;
}

export interface MenuStats {
  totalOrders: number;
  totalRevenue: number;
  totalViews: number;
  popularItems: Array<{ id: string; name: string; orders: number }>;
  recentOrders: Order[];
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

export interface OrderFeedback {
  orderId: string;
  tableNumber: string;
  rating: number;
  comment: string;
  timestamp: string;
  sessionId?: string;
  customerInfo?: {
    name?: string;
    telegramUsername?: string;
    telegramPhoto?: string;
  };
}

export interface AppSettings {
  language: 'en' | 'am';
  orderType: 'dine-in' | 'takeaway';
}

export interface RestaurantSettings {
  id: string;
  userId: string;
  businessName: string;
  logo?: string;
  theme: 'classic' | 'modern' | 'elegant' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  taxRate: number;
  serviceCharge: number;
  autoAcceptOrders: boolean;
  requirePaymentUpfront: boolean;
  allowGuestOrders: boolean;
  maxTablesPerCafe: number;
  telegramBotToken?: string;
  telegramBotUsername?: string;
  fallbackWebsiteUrl?: string;
  created_at: string;
  updated_at: string;
}

// Super Admin Types
export interface Restaurant {
  id: string;
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  totalOrders?: number;
  totalRevenue?: number;
}

export interface PlatformStats {
  totalRestaurants: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyGrowth: Array<{ month: string; restaurants: number; revenue: number }>;
}