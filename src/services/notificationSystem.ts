import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Base URL for the /api/send-push serverless function
const PUSH_API_URL = import.meta.env.VITE_TELEGRAM_WEBHOOK_URL
  ? import.meta.env.VITE_TELEGRAM_WEBHOOK_URL.replace('/api/telegram-webhook', '/api/send-push')
  : '/api/send-push';
import { 
  NotificationTemplate,
  ScheduledNotification,
  CustomerNotificationPreferences,
  NotificationDelivery,
  NotificationSettings
} from '../types/notifications';

class NotificationSystemService {
  // =======================
  // Notification Templates
  // =======================
  
  async getNotificationTemplates(userId: string): Promise<NotificationTemplate[]> {
    try {
      const q = query(
        collection(db, 'notificationTemplates'),
        where('userId', '==', userId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationTemplate));
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      throw error;
    }
  }

  async addNotificationTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notificationTemplates'), {
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding notification template:', error);
      throw error;
    }
  }

  async updateNotificationTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<void> {
    try {
      const docRef = doc(db, 'notificationTemplates', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating notification template:', error);
      throw error;
    }
  }

  async deleteNotificationTemplate(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notificationTemplates', id));
    } catch (error) {
      console.error('Error deleting notification template:', error);
      throw error;
    }
  }

  // =======================
  // Scheduled Notifications
  // =======================
  
  async getScheduledNotifications(userId: string): Promise<ScheduledNotification[]> {
    try {
      const q = query(
        collection(db, 'scheduledNotifications'),
        where('userId', '==', userId),
        orderBy('scheduledFor', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledNotification));
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      throw error;
    }
  }

  async scheduleNotification(notification: Omit<ScheduledNotification, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'scheduledNotifications'), {
        ...notification,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async updateScheduledNotification(id: string, updates: Partial<ScheduledNotification>): Promise<void> {
    try {
      const docRef = doc(db, 'scheduledNotifications', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating scheduled notification:', error);
      throw error;
    }
  }

  async cancelScheduledNotification(id: string): Promise<void> {
    try {
      await this.updateScheduledNotification(id, { 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      throw error;
    }
  }

  // =======================
  // Customer Preferences
  // =======================
  
  async getCustomerPreferences(userId: string, tableNumber: string, sessionId: string): Promise<CustomerNotificationPreferences | null> {
    try {
      const q = query(
        collection(db, 'customerNotificationPreferences'),
        where('userId', '==', userId),
        where('tableNumber', '==', tableNumber),
        where('sessionId', '==', sessionId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as CustomerNotificationPreferences;
      }
      return null;
    } catch (error) {
      console.error('Error fetching customer preferences:', error);
      return null;
    }
  }

  async updateCustomerPreferences(preferences: Omit<CustomerNotificationPreferences, 'id'> | CustomerNotificationPreferences): Promise<string> {
    try {
      if ('id' in preferences) {
        // Update existing preferences
        const docRef = doc(db, 'customerNotificationPreferences', preferences.id);
        await updateDoc(docRef, {
          ...preferences,
          updated_at: new Date().toISOString(),
        });
        return preferences.id;
      } else {
        // Create new preferences
        const docRef = await addDoc(collection(db, 'customerNotificationPreferences'), {
          ...preferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error updating customer preferences:', error);
      throw error;
    }
  }

  // =======================
  // Notification Settings
  // =======================
  
  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const q = query(
        collection(db, 'notificationSettings'),
        where('userId', '==', userId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as NotificationSettings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
  }

  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<string> {
    try {
      const existing = await this.getNotificationSettings(userId);
      
      if (existing) {
        const docRef = doc(db, 'notificationSettings', existing.id);
        await updateDoc(docRef, {
          ...settings,
          updated_at: new Date().toISOString(),
        });
        return existing.id;
      } else {
        const defaultSettings: Omit<NotificationSettings, 'id'> = {
          userId,
          requireConsent: true,
          defaultPreferences: {
            orderUpdates: true,
            promotions: false,
            generalInfo: true,
            emergencyAlerts: true,
          },
          privacyPolicy: 'We use notifications to keep you updated about your orders and restaurant services.',
          consentMessage: 'Would you like to receive notifications about your order status and restaurant updates?',
          retentionDays: 30,
          maxNotificationsPerHour: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...settings,
        };
        
        const docRef = await addDoc(collection(db, 'notificationSettings'), defaultSettings);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // =======================
  // Notification Delivery
  // =======================
  
  async sendImmediateNotification(
    userId: string,
    targetTables: number[] | 'all',
    notification: {
      title: string;
      message: string;
      imageUrl?: string;
      type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
    }
  ): Promise<string[]> {
    try {
      const deliveryIds: string[] = [];

      // === BULK SEND: target is 'all' tables ===
      // Send one FCM multicast to all registered tokens instead of iterating dummy table numbers
      if (targetTables === 'all') {
        // 1. Firestore liveNotification with wildcard (customers with active listeners get it)
        const deliveryRef = await addDoc(collection(db, 'notificationDeliveries'), {
          notificationId: `broadcast_${Date.now()}`,
          tableNumber: 'all',
          userId,
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
        });
        deliveryIds.push(deliveryRef.id);

        // Write a broadcast liveNotification (tableNumber='all')
        await addDoc(collection(db, 'liveNotifications'), {
          userId,
          tableNumber: 'all',
          ...notification,
          timestamp: new Date().toISOString(),
          ttl: new Date(Date.now() + 120000).toISOString(),
        });

        // 2. FCM push to all tokens registered for this restaurant
        try {
          const allTokens = await this.getAllTokensForRestaurant(userId);
          if (allTokens.length > 0) {
            await fetch(PUSH_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tokens: allTokens,
                title: notification.title,
                body: notification.message,
                data: { type: notification.type, userId, tableNumber: 'all' },
              }),
            });
          }
        } catch (fcmErr) {
          console.warn('Bulk FCM push failed (non-critical):', fcmErr);
        }

        return deliveryIds;
      }

      // === TABLE-SPECIFIC SEND ===
      const settings = await this.getNotificationSettings(userId);

      for (const tableNumber of targetTables) {
        try {
          if (settings?.requireConsent) {
            const preferences = await this.getCustomerPreferencesForTable(userId, tableNumber.toString());
            if (!preferences?.notificationsEnabled || !preferences?.consentGiven) continue;
            const typeAllowed = this.checkNotificationTypeAllowed(notification.type, preferences.preferences);
            if (!typeAllowed) continue;
          }

          const delivery: Omit<NotificationDelivery, 'id'> = {
            notificationId: `immediate_${Date.now()}_${tableNumber}`,
            tableNumber: tableNumber.toString(),
            userId,
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
          };

          const deliveryRef = await addDoc(collection(db, 'notificationDeliveries'), delivery);
          deliveryIds.push(deliveryRef.id);

          await this.triggerCustomerNotification(userId, tableNumber.toString(), notification);
        } catch (error) {
          console.error(`Error sending notification to table ${tableNumber}:`, error);
        }
      }


      return deliveryIds;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      throw error;
    }
  }

  private async getCustomerPreferencesForTable(userId: string, tableNumber: string): Promise<CustomerNotificationPreferences | null> {
    try {
      const q = query(
        collection(db, 'customerNotificationPreferences'),
        where('userId', '==', userId),
        where('tableNumber', '==', tableNumber),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as CustomerNotificationPreferences;
      }
      return null;
    } catch (error) {
      console.error('Error fetching customer preferences for table:', error);
      return null;
    }
  }

  private checkNotificationTypeAllowed(type: string, preferences: any): boolean {
    switch (type) {
      case 'promotion':
        return preferences.promotions;
      case 'info':
        return preferences.generalInfo;
      case 'success':
      case 'warning':
        return preferences.orderUpdates;
      case 'error':
        return preferences.emergencyAlerts;
      default:
        return true;
    }
  }

  private async triggerCustomerNotification(userId: string, tableNumber: string, notification: any): Promise<void> {
    // 1. Write to Firestore liveNotifications so in-app popups still work
    try {
      await addDoc(collection(db, 'liveNotifications'), {
        userId,
        tableNumber,
        ...notification,
        timestamp: new Date().toISOString(),
        ttl: new Date(Date.now() + 60000).toISOString(),
      });
    } catch (error) {
      console.error('Error writing liveNotification:', error);
    }

    // 2. Send a real FCM push to every browser token registered for this table
    try {
      const tokens = await this.getTokensForTable(userId, tableNumber);
      if (tokens.length > 0) {
        await fetch(PUSH_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens,
            title: notification.title,
            body: notification.message,
            data: {
              type: notification.type,
              userId,
              tableNumber,
              url: `/menu/${userId}/table/${tableNumber}`,
            },
          }),
        });
      }
    } catch (error) {
      // FCM push failing should not break in-app delivery
      console.warn('FCM push failed (non-critical):', error);
    }
  }

  // =======================
  // FCM Token Management
  // =======================

  /**
   * Save a customer's FCM push token linked to their restaurant + table.
   * Called from the customer side after permission is granted.
   */
  async savePushToken(userId: string, tableNumber: string, token: string): Promise<void> {
    try {
      const tokenDocId = `${userId}_${tableNumber}_${token.slice(-16)}`;
      await setDoc(
        doc(db, 'pushTokens', tokenDocId),
        {
          userId,
          tableNumber,
          token,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  /**
   * Retrieve all active FCM tokens registered for a specific restaurant + table.
   */
  private async getTokensForTable(userId: string, tableNumber: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'pushTokens'),
        where('userId', '==', userId),
        where('tableNumber', '==', tableNumber)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data().token as string).filter(Boolean);
    } catch (error) {
      console.error('Error fetching push tokens:', error);
      return [];
    }
  }

  /**
   * Retrieve all FCM tokens for ALL tables of a restaurant (used for "send to all" broadcasts).
   */
  async getAllTokensForRestaurant(userId: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'pushTokens'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data().token as string).filter(Boolean);
    } catch (error) {
      console.error('Error fetching all push tokens:', error);
      return [];
    }
  }

  // =======================
  // Real-time Listeners
  // =======================
  
  listenToLiveNotifications(userId: string, tableNumber: string, callback: (notification: any) => void): () => void {
    const q = query(
      collection(db, 'liveNotifications'),
      where('userId', '==', userId),
      where('tableNumber', '==', tableNumber),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = { id: change.doc.id, ...change.doc.data() };
          callback(notification);
          
          // Clean up the notification after processing
          setTimeout(() => {
            deleteDoc(doc(db, 'liveNotifications', change.doc.id)).catch(console.error);
          }, 5000);
        }
      });
    });
  }

  listenToScheduledNotifications(userId: string, callback: (notifications: ScheduledNotification[]) => void): () => void {
    const q = query(
      collection(db, 'scheduledNotifications'),
      where('userId', '==', userId),
      orderBy('scheduledFor', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledNotification));
      callback(notifications);
    });
  }

  // =======================
  // Notification Processing
  // =======================
  
  async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const q = query(
        collection(db, 'scheduledNotifications'),
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', now)
      );
      
      const snapshot = await getDocs(q);
      
      for (const docSnapshot of snapshot.docs) {
        const notification = { id: docSnapshot.id, ...docSnapshot.data() } as ScheduledNotification;
        
        try {
          await this.sendImmediateNotification(
            notification.userId,
            notification.targetTables,
            {
              title: notification.title,
              message: notification.message,
              imageUrl: notification.imageUrl,
              type: notification.type,
            }
          );
          
          // Mark as sent
          await this.updateScheduledNotification(notification.id, {
            status: 'sent',
            sentAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error(`Error processing scheduled notification ${notification.id}:`, error);
          
          // Mark as failed
          await this.updateScheduledNotification(notification.id, {
            status: 'failed',
            failureReason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  // =======================
  // Analytics
  // =======================
  
  async getNotificationAnalytics(userId: string, dateRange?: { start: string; end: string }): Promise<any> {
    try {
      const [deliveries, scheduled] = await Promise.all([
        this.getNotificationDeliveries(userId, dateRange),
        this.getScheduledNotifications(userId)
      ]);
      
      const totalSent = deliveries.length;
      const totalDelivered = deliveries.filter(d => d.status === 'delivered').length;
      const totalClicked = deliveries.filter(d => d.status === 'clicked').length;
      const totalDismissed = deliveries.filter(d => d.status === 'dismissed').length;
      
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
      
      return {
        totalSent,
        totalDelivered,
        totalClicked,
        totalDismissed,
        deliveryRate,
        clickRate,
        scheduledCount: scheduled.filter(s => s.status === 'pending').length,
        failedCount: scheduled.filter(s => s.status === 'failed').length,
      };
    } catch (error) {
      console.error('Error calculating notification analytics:', error);
      throw error;
    }
  }

  private async getNotificationDeliveries(userId: string, dateRange?: { start: string; end: string }): Promise<NotificationDelivery[]> {
    try {
      let q = query(
        collection(db, 'notificationDeliveries'),
        where('userId', '==', userId),
        orderBy('deliveredAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      let deliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationDelivery));
      
      if (dateRange) {
        deliveries = deliveries.filter(d => {
          const deliveredAt = new Date(d.deliveredAt);
          return deliveredAt >= new Date(dateRange.start) && deliveredAt <= new Date(dateRange.end);
        });
      }
      
      return deliveries;
    } catch (error) {
      console.error('Error fetching notification deliveries:', error);
      return [];
    }
  }
}

export const notificationSystemService = new NotificationSystemService();