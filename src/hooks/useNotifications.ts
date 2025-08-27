import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notifications';
import { useAuth } from './useAuth';
import { firebaseService } from '../services/firebase';

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsSupported(notificationService.isSupported());
    setPermission(notificationService.getPermissionStatus());
    setIsEnabled(notificationService.isEnabled());
  }, []);

  useEffect(() => {
    if (user && isEnabled) {
      startListening();
    }
  }, [user, isEnabled]);

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermissionStatus());
    setIsEnabled(granted);
    return granted;
  }, []);

  const startListening = useCallback(() => {
    if (!user) return;

    // Set up real-time listeners for different collections
    const unsubscribers: (() => void)[] = [];

    // Listen for new pending orders
    const pendingOrdersListener = firebaseService.listenToPendingOrders(user.id, (orders) => {
      orders.forEach(order => {
        if (isNewEvent(order.timestamp)) {
          notificationService.notifyNewOrder(order);
        }
      });
    });

    // Listen for new payment confirmations
    const paymentsListener = firebaseService.listenToPaymentConfirmations(user.id, (confirmations) => {
      confirmations.forEach(confirmation => {
        if (isNewEvent(confirmation.timestamp)) {
          notificationService.notifyPaymentRequest(confirmation);
        }
      });
    });

    // Listen for waiter calls
    const waiterCallsListener = firebaseService.listenToWaiterCalls(user.id, (calls) => {
      calls.forEach(call => {
        if (isNewEvent(call.timestamp)) {
          notificationService.notifyWaiterCall(call.tableNumber, call.waiterName);
        }
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, isEnabled]);

  const isNewEvent = (timestamp: string): boolean => {
    const eventTime = new Date(timestamp).getTime();
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    return eventTime > fiveMinutesAgo;
  };

  const testNotification = useCallback(async () => {
    if (!isEnabled) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    await notificationService.showNotification({
      title: 'Test Notification',
      body: 'Web notifications are working correctly!',
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