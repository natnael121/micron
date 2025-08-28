import { firebaseService } from './firebase';

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.checkPermission();
    this.registerServiceWorker();
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.warn('Service Worker registration failed (may not be supported in this environment):', error);
      }
    }
  }

  async showNotification(data: NotificationData): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      if (this.registration) {
        // Use Service Worker for better notification management
        await this.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192.png',
          badge: data.badge || '/icon-192.png',
          tag: data.tag,
          data: data.data,
          actions: data.actions,
          requireInteraction: true,
          silent: false,
        });
      } else {
        // Fallback to basic notification
        new Notification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192.png',
          tag: data.tag,
          data: data.data,
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Notification templates for different events
  async notifyNewOrder(order: any): Promise<void> {
    await this.showNotification({
      title: `New Order - Table ${order.tableNumber}`,
      body: `${order.items.length} items • $${order.totalAmount.toFixed(2)}`,
      icon: '/icon-192.png',
      tag: `order-${order.id}`,
      data: { type: 'order', orderId: order.id, tableNumber: order.tableNumber },
      actions: [
        { action: 'view', title: 'View Order' },
        { action: 'approve', title: 'Approve' }
      ]
    });
  }

  async notifyPaymentRequest(confirmation: any): Promise<void> {
    await this.showNotification({
      title: `Payment Confirmation - Table ${confirmation.tableNumber}`,
      body: `$${confirmation.total.toFixed(2)} • ${confirmation.method.replace('_', ' ')}`,
      icon: '/icon-192.png',
      tag: `payment-${confirmation.id}`,
      data: { type: 'payment', confirmationId: confirmation.id, tableNumber: confirmation.tableNumber },
      actions: [
        { action: 'approve', title: 'Approve' },
        { action: 'reject', title: 'Reject' }
      ]
    });
  }

  async notifyWaiterCall(tableNumber: string, waiterName?: string): Promise<void> {
    await this.showNotification({
      title: `Waiter Call - Table ${tableNumber}`,
      body: waiterName ? `Assigned to: ${waiterName}` : 'Customer needs assistance',
      icon: '/icon-192.png',
      tag: `waiter-call-${tableNumber}`,
      data: { type: 'waiter_call', tableNumber },
      actions: [
        { action: 'acknowledge', title: 'On My Way' }
      ]
    });
  }

  async notifyLowStock(itemName: string): Promise<void> {
    await this.showNotification({
      title: 'Low Stock Alert',
      body: `${itemName} is running low`,
      icon: '/icon-192.png',
      tag: `stock-${itemName}`,
      data: { type: 'stock', itemName },
      actions: [
        { action: 'restock', title: 'Mark Restocked' }
      ]
    });
  }

  async notifyOrderReady(order: any, departmentName: string): Promise<void> {
    await this.showNotification({
      title: `Order Ready - Table ${order.tableNumber}`,
      body: `${departmentName} has completed the order`,
      icon: '/icon-192.png',
      tag: `ready-${order.id}`,
      data: { type: 'order_ready', orderId: order.id, tableNumber: order.tableNumber },
      actions: [
        { action: 'deliver', title: 'Mark Delivered' }
      ]
    });
  }

  async notifyDayReport(report: any): Promise<void> {
    await this.showNotification({
      title: 'Day Report Generated',
      body: `${report.totalOrders} orders • $${report.totalRevenue.toFixed(2)} revenue`,
      icon: '/icon-192.png',
      tag: `report-${report.date}`,
      data: { type: 'day_report', reportId: report.id },
      actions: [
        { action: 'view', title: 'View Report' }
      ]
    });
  }

  // Check if notifications are supported and enabled
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  isEnabled(): boolean {
    return this.permission === 'granted';
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();