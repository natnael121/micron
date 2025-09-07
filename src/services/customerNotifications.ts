import { firebaseService } from './firebase';
import { Order, PaymentConfirmation, WaiterCall } from '../types';

export interface CustomerNotificationData {
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

class CustomerNotificationService {
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
        console.log('Customer Service Worker registered successfully');
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  async showNotification(data: CustomerNotificationData): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      if (this.registration) {
        await this.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192.png',
          badge: data.badge || '/icon-192.png',
          tag: data.tag,
          data: data.data,
          actions: data.actions,
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200], // Vibration pattern for mobile
        });
      } else {
        new Notification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192.png',
          tag: data.tag,
          data: data.data,
        });
      }
    } catch (error) {
      console.error('Error showing customer notification:', error);
    }
  }

  // =======================
  // Real-time Listeners
  // =======================

  listenToOrderUpdates(userId: string, tableNumber: string, callback: (order: Order) => void): () => void {
    return firebaseService.listenToTableOrders(userId, tableNumber, (orders) => {
      orders.forEach(order => {
        if (this.isRecentUpdate(order.timestamp)) {
          callback(order);
        }
      });
    });
  }

  listenToPaymentUpdates(userId: string, tableNumber: string, callback: (confirmation: PaymentConfirmation) => void): () => void {
    return firebaseService.listenToTablePayments(userId, tableNumber, (confirmations) => {
      confirmations.forEach(confirmation => {
        if (confirmation.processedAt && this.isRecentUpdate(confirmation.processedAt)) {
          callback(confirmation);
        }
      });
    });
  }

  listenToWaiterResponses(userId: string, tableNumber: string, callback: (call: WaiterCall) => void): () => void {
    return firebaseService.listenToTableWaiterCalls(userId, tableNumber, (calls) => {
      calls.forEach(call => {
        if (call.updatedAt && this.isRecentUpdate(call.updatedAt)) {
          callback(call);
        }
      });
    });
  }

  private isRecentUpdate(timestamp: string): boolean {
    const updateTime = new Date(timestamp).getTime();
    const now = Date.now();
    const twoMinutesAgo = now - (2 * 60 * 1000);
    
    return updateTime > twoMinutesAgo;
  }

  // =======================
  // Notification Templates
  // =======================

  async notifyOrderStatusUpdate(order: Order): Promise<void> {
    const statusMessages = {
      confirmed: {
        title: '✅ Order Confirmed!',
        body: `Your order for Table ${order.tableNumber} has been approved and sent to the kitchen.`,
        icon: '/icon-192.png'
      },
      preparing: {
        title: '👨‍🍳 Order Being Prepared',
        body: `Your order for Table ${order.tableNumber} is now being prepared in the kitchen.`,
        icon: '/icon-192.png'
      },
      ready: {
        title: '🍽️ Order Ready!',
        body: `Your order for Table ${order.tableNumber} is ready! It will be served shortly.`,
        icon: '/icon-192.png'
      },
      delivered: {
        title: '✨ Order Served!',
        body: `Your order for Table ${order.tableNumber} has been served. Enjoy your meal!`,
        icon: '/icon-192.png'
      },
      cancelled: {
        title: '❌ Order Cancelled',
        body: `Your order for Table ${order.tableNumber} has been cancelled. Please contact staff for assistance.`,
        icon: '/icon-192.png'
      }
    };

    const notification = statusMessages[order.status as keyof typeof statusMessages];
    if (notification) {
      await this.showNotification({
        ...notification,
        tag: `order-${order.id}`,
        data: { 
          type: 'order_update', 
          orderId: order.id, 
          tableNumber: order.tableNumber,
          status: order.status
        },
        actions: [
          { action: 'view', title: 'View Order' }
        ]
      });
    }
  }

  async notifyPaymentUpdate(confirmation: PaymentConfirmation): Promise<void> {
    const isApproved = confirmation.status === 'approved';
    
    await this.showNotification({
      title: isApproved ? '💳 Payment Approved!' : '❌ Payment Rejected',
      body: isApproved 
        ? `Your payment of $${confirmation.total.toFixed(2)} for Table ${confirmation.tableNumber} has been approved.`
        : `Your payment for Table ${confirmation.tableNumber} was rejected. Please try again or contact staff.`,
      icon: '/icon-192.png',
      tag: `payment-${confirmation.id}`,
      data: { 
        type: 'payment_update', 
        confirmationId: confirmation.id, 
        tableNumber: confirmation.tableNumber,
        status: confirmation.status,
        amount: confirmation.total
      },
      actions: isApproved ? [
        { action: 'view_bill', title: 'View Bill' }
      ] : [
        { action: 'retry_payment', title: 'Try Again' }
      ]
    });
  }

  async notifyWaiterResponse(call: WaiterCall): Promise<void> {
    const statusMessages = {
      acknowledged: {
        title: '👋 Waiter Responding',
        body: `Your waiter is on the way to Table ${call.tableNumber}!`,
        icon: '/icon-192.png'
      },
      completed: {
        title: '✅ Assistance Complete',
        body: `Your request for Table ${call.tableNumber} has been handled.`,
        icon: '/icon-192.png'
      }
    };

    const notification = statusMessages[call.status as keyof typeof statusMessages];
    if (notification) {
      await this.showNotification({
        ...notification,
        tag: `waiter-${call.id}`,
        data: { 
          type: 'waiter_response', 
          callId: call.id, 
          tableNumber: call.tableNumber,
          status: call.status
        }
      });
    }
  }

  async notifyOrderApproved(order: Order): Promise<void> {
    await this.showNotification({
      title: '🎉 Order Approved!',
      body: `Your order for Table ${order.tableNumber} has been approved! The kitchen is now preparing your food.`,
      icon: '/icon-192.png',
      tag: `order-approved-${order.id}`,
      data: { 
        type: 'order_approved', 
        orderId: order.id, 
        tableNumber: order.tableNumber 
      },
      actions: [
        { action: 'view', title: 'View Order' }
      ]
    });
  }

  async notifyOrderRejected(tableNumber: string): Promise<void> {
    await this.showNotification({
      title: '❌ Order Rejected',
      body: `Your order for Table ${tableNumber} was not approved. Please contact staff for assistance.`,
      icon: '/icon-192.png',
      tag: `order-rejected-${tableNumber}`,
      data: { 
        type: 'order_rejected', 
        tableNumber 
      },
      actions: [
        { action: 'view_menu', title: 'View Menu' }
      ]
    });
  }

  async notifyKitchenUpdate(order: Order, departmentName: string): Promise<void> {
    await this.showNotification({
      title: `👨‍🍳 ${departmentName} Update`,
      body: `Your order for Table ${order.tableNumber} is being prepared by the ${departmentName.toLowerCase()}.`,
      icon: '/icon-192.png',
      tag: `kitchen-${order.id}`,
      data: { 
        type: 'kitchen_update', 
        orderId: order.id, 
        tableNumber: order.tableNumber,
        department: departmentName
      }
    });
  }

  async notifySpecialOffer(offer: {
    title: string;
    description: string;
    discount?: number;
    validUntil?: string;
  }): Promise<void> {
    await this.showNotification({
      title: `🎉 ${offer.title}`,
      body: offer.description,
      icon: '/icon-192.png',
      tag: 'special-offer',
      data: { type: 'special_offer', offer },
      actions: [
        { action: 'view_menu', title: 'View Menu' }
      ]
    });
  }

  async notifyTableBillUpdate(tableNumber: string, total: number): Promise<void> {
    await this.showNotification({
      title: '📄 Bill Updated',
      body: `Your bill for Table ${tableNumber} has been updated. Total: $${total.toFixed(2)}`,
      icon: '/icon-192.png',
      tag: `bill-${tableNumber}`,
      data: { 
        type: 'bill_update', 
        tableNumber, 
        total 
      },
      actions: [
        { action: 'view_bill', title: 'View Bill' }
      ]
    });
  }

  async notifyMenuUpdate(newItemsCount: number): Promise<void> {
    if (newItemsCount > 0) {
      await this.showNotification({
        title: '🍽️ Menu Updated!',
        body: `${newItemsCount} new items have been added to the menu. Check them out!`,
        icon: '/icon-192.png',
        tag: 'menu-update',
        data: { type: 'menu_update', newItemsCount },
        actions: [
          { action: 'view_menu', title: 'View New Items' }
        ]
      });
    }
  }

  async notifyWelcomeMessage(businessName: string, tableNumber: string): Promise<void> {
    await this.showNotification({
      title: `Welcome to ${businessName}!`,
      body: `You're seated at Table ${tableNumber}. Browse our menu and place your order when ready.`,
      icon: '/icon-192.png',
      tag: 'welcome',
      data: { type: 'welcome', tableNumber },
      actions: [
        { action: 'view_menu', title: 'View Menu' }
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

export const customerNotificationService = new CustomerNotificationService();