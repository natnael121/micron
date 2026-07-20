import { useState, useEffect, useCallback } from 'react';
import { customerNotificationService } from '../services/customerNotifications';
import { getFCMToken, onFCMMessage } from '../config/firebase';
import { notificationSystemService } from '../services/notificationSystem';

export const useCustomerNotifications = (tableNumber: string, userId?: string) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsSupported(customerNotificationService.isSupported());
    setPermission(customerNotificationService.getPermissionStatus());
    setIsEnabled(customerNotificationService.isEnabled());
  }, []);

  // When already enabled on mount (e.g. after page refresh), re-register token silently
  useEffect(() => {
    if (userId && tableNumber && isEnabled) {
      registerFCMToken();
      startListening();
    }
  }, [userId, tableNumber, isEnabled]);

  /**
   * Ask browser for notification permission AND register an FCM push token.
   * This is the one function to call from UI consent buttons.
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await customerNotificationService.requestPermission();
    setPermission(customerNotificationService.getPermissionStatus());
    setIsEnabled(granted);

    if (granted && userId && tableNumber) {
      await registerFCMToken();
    }

    return granted;
  }, [userId, tableNumber]);

  /**
   * Fetch the FCM token and save it to Firestore so the restaurant can push to this device.
   */
  const registerFCMToken = useCallback(async () => {
    if (!userId || !tableNumber) return;
    try {
      const token = await getFCMToken();
      if (token) {
        await notificationSystemService.savePushToken(userId, tableNumber, token);
      }
    } catch (err) {
      // Token registration is best-effort; never block UI
      console.warn('FCM token registration failed:', err);
    }
  }, [userId, tableNumber]);

  /**
   * Set up Firestore real-time listeners for order/payment/waiter events.
   * Also listen to foreground FCM messages so they display as popups while the tab is open.
   */
  const startListening = useCallback(() => {
    if (!userId || !tableNumber) return;

    const unsubscribers: (() => void)[] = [];

    // Order status changes
    unsubscribers.push(
      customerNotificationService.listenToOrderUpdates(userId, tableNumber, (order) => {
        customerNotificationService.notifyOrderStatusUpdate(order);
      })
    );

    // Payment confirmations
    unsubscribers.push(
      customerNotificationService.listenToPaymentUpdates(userId, tableNumber, (confirmation) => {
        customerNotificationService.notifyPaymentUpdate(confirmation);
      })
    );

    // Waiter responses
    unsubscribers.push(
      customerNotificationService.listenToWaiterResponses(userId, tableNumber, (response) => {
        customerNotificationService.notifyWaiterResponse(response);
      })
    );

    // Foreground FCM messages (when tab is open, FCM doesn't show a system notification —
    // we need to show it ourselves via the service worker)
    const unsubFCM = onFCMMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (title && body) {
        customerNotificationService.showNotification({
          title,
          body,
          icon: '/icon-192.png',
          tag: `fcm-foreground-${Date.now()}`,
          data: payload.data,
        });
      }
    });
    unsubscribers.push(unsubFCM);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [userId, tableNumber]);

  const testNotification = useCallback(async (): Promise<boolean> => {
    if (!isEnabled) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    await customerNotificationService.showNotification({
      title: 'Notifications are working! ✅',
      body: "You'll receive updates about your orders and restaurant services.",
      icon: '/icon-192.png',
      tag: 'test-notification',
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