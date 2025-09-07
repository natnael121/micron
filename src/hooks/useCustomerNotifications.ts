import { useState, useEffect, useCallback } from 'react';
import { customerNotificationService } from '../services/customerNotifications';

export const useCustomerNotifications = (tableNumber: string, userId?: string) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsSupported(customerNotificationService.isSupported());
    setPermission(customerNotificationService.getPermissionStatus());
    setIsEnabled(customerNotificationService.isEnabled());
  }, []);

  useEffect(() => {
    if (userId && tableNumber && isEnabled) {
      startListening();
    }
  }, [userId, tableNumber, isEnabled]);

  const requestPermission = useCallback(async () => {
    const granted = await customerNotificationService.requestPermission();
    setPermission(customerNotificationService.getPermissionStatus());
    setIsEnabled(granted);
    return granted;
  }, []);

  const startListening = useCallback(() => {
    if (!userId || !tableNumber) return;

    // Set up real-time listeners for customer-relevant events
    const unsubscribers: (() => void)[] = [];

    // Listen for order status changes
    const ordersListener = customerNotificationService.listenToOrderUpdates(
      userId, 
      tableNumber, 
      (order) => {
        customerNotificationService.notifyOrderStatusUpdate(order);
      }
    );

    // Listen for payment confirmations
    const paymentsListener = customerNotificationService.listenToPaymentUpdates(
      userId,
      tableNumber,
      (confirmation) => {
        customerNotificationService.notifyPaymentUpdate(confirmation);
      }
    );

    // Listen for waiter responses
    const waiterListener = customerNotificationService.listenToWaiterResponses(
      userId,
      tableNumber,
      (response) => {
        customerNotificationService.notifyWaiterResponse(response);
      }
    );

    unsubscribers.push(ordersListener, paymentsListener, waiterListener);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [userId, tableNumber, isEnabled]);

  const testNotification = useCallback(async () => {
    if (!isEnabled) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    await customerNotificationService.showNotification({
      title: 'Test Notification',
      body: 'Notifications are working! You\'ll receive updates about your orders.',
      icon: '/icon-192.png',
      tag: 'test-notification'
    });

    return true;
  }, [isEnabled, requestPermission]);

  return {
    isSupported,
    isEnabled,
    permission,
    requestPermission,
    testNotification,
  };
};