// Notification System Types

export interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  userId: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledNotification {
  id: string;
  templateId: string;
  title: string;
  message: string;
  imageUrl?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  targetTables: number[] | 'all';
  scheduledFor: string; // ISO date string
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  userId: string;
  sentAt?: string;
  failureReason?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerNotificationPreferences {
  id: string;
  tableNumber: string;
  userId: string;
  sessionId: string;
  notificationsEnabled: boolean;
  consentGiven: boolean;
  consentTimestamp: string;
  preferences: {
    orderUpdates: boolean;
    promotions: boolean;
    generalInfo: boolean;
    emergencyAlerts: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  tableNumber: string;
  userId: string;
  sessionId?: string;
  status: 'delivered' | 'failed' | 'dismissed' | 'clicked';
  deliveredAt: string;
  dismissedAt?: string;
  clickedAt?: string;
  failureReason?: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  requireConsent: boolean;
  defaultPreferences: {
    orderUpdates: boolean;
    promotions: boolean;
    generalInfo: boolean;
    emergencyAlerts: boolean;
  };
  privacyPolicy: string;
  consentMessage: string;
  retentionDays: number;
  maxNotificationsPerHour: number;
  created_at: string;
  updated_at: string;
}

export interface LiveNotification {
  id: string;
  userId: string;
  tableNumber: string;
  title: string;
  message: string;
  imageUrl?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  timestamp: string;
  ttl: string;
  actionUrl?: string;
  actionText?: string;
}