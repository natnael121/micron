// Service Worker for handling notifications
const CACHE_NAME = 'restaurant-notifications-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  // Handle different notification actions
  if (action === 'view' || !action) {
    // Open appropriate page based on notification type
    event.waitUntil(
      self.clients.openWindow(
        data?.type === 'order_update' || data?.type === 'payment_update' || data?.type === 'waiter_response'
          ? `/menu/${data.userId || ''}/table/${data.tableNumber || '1'}`
          : '/admin'
      )
    );
  } else if (action === 'view_menu') {
    // Open menu page
    event.waitUntil(
      self.clients.openWindow(`/menu/${data.userId || ''}/table/${data.tableNumber || '1'}`)
    );
  } else if (action === 'view_bill') {
    // Open menu page and trigger bill modal
    event.waitUntil(
      self.clients.openWindow(`/menu/${data.userId || ''}/table/${data.tableNumber || '1'}?action=view_bill`)
    );
  } else if (action === 'retry_payment') {
    // Open menu page and trigger payment modal
    event.waitUntil(
      self.clients.openWindow(`/menu/${data.userId || ''}/table/${data.tableNumber || '1'}?action=retry_payment`)
    );
  } else if (action === 'approve' && data?.type === 'order') {
    // Handle order approval
    event.waitUntil(
      handleOrderAction(data.orderId, 'approve')
    );
  } else if (action === 'approve' && data?.type === 'payment') {
    // Handle payment approval
    event.waitUntil(
      handlePaymentAction(data.confirmationId, 'approve')
    );
  } else if (action === 'reject' && data?.type === 'payment') {
    // Handle payment rejection
    event.waitUntil(
      handlePaymentAction(data.confirmationId, 'reject')
    );
  } else if (action === 'acknowledge' && data?.type === 'waiter_call') {
    // Handle waiter call acknowledgment
    event.waitUntil(
      handleWaiterCallAck(data.tableNumber)
    );
  }
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle push messages (for future server-sent notifications)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag,
        data: data.data,
        actions: data.actions,
        requireInteraction: true,
      })
    );
  }
});

// Helper functions for handling actions
async function handleOrderAction(orderId, action) {
  try {
    // This would typically make an API call to your backend
    console.log(`Handling order ${orderId} with action: ${action}`);
    
    // Show success notification
    self.registration.showNotification('Action Completed', {
      body: `Order ${action}d successfully`,
      icon: '/icon-192.png',
      tag: 'action-success'
    });
  } catch (error) {
    console.error('Error handling order action:', error);
    
    // Show error notification
    self.registration.showNotification('Action Failed', {
      body: 'Please try again from the admin panel',
      icon: '/icon-192.png',
      tag: 'action-error'
    });
  }
}

async function handlePaymentAction(confirmationId, action) {
  try {
    console.log(`Handling payment ${confirmationId} with action: ${action}`);
    
    self.registration.showNotification('Payment Processed', {
      body: `Payment ${action}d successfully`,
      icon: '/icon-192.png',
      tag: 'payment-success'
    });
  } catch (error) {
    console.error('Error handling payment action:', error);
    
    self.registration.showNotification('Action Failed', {
      body: 'Please try again from the admin panel',
      icon: '/icon-192.png',
      tag: 'payment-error'
    });
  }
}

async function handleWaiterCallAck(tableNumber) {
  try {
    console.log(`Acknowledging waiter call for table ${tableNumber}`);
    
    self.registration.showNotification('Call Acknowledged', {
      body: `On the way to Table ${tableNumber}`,
      icon: '/icon-192.png',
      tag: 'waiter-ack'
    });
  } catch (error) {
    console.error('Error acknowledging waiter call:', error);
  }
}

async function handleBackgroundSync() {
  // Handle any pending actions that were queued while offline
  console.log('Handling background sync');
}