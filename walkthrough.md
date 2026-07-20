# Walkthrough - Push Notification System

We have completed the implementation of the Firebase Cloud Messaging (FCM) web push notification system so the restaurant can send real browser push notifications to customers (which will pop up even when the browser tab is closed).

## Changes Made

### 1. Firebase Client Configuration
- **File modified**: [firebase.ts](file:///c:/Users/Micro%20Tech/Desktop/wood/micron/micron/src/config/firebase.ts)
- Guarded FCM setup so it only runs in the browser context (not in server-side/build environments).
- Exported the `messaging` service and added a `getFCMToken()` helper to fetch the user's current push subscription token using the VAPID public key.
- Added `onFCMMessage()` to support foreground notification handlers.

### 2. Service Worker Upgrade
- **File modified**: [sw.js](file:///c:/Users/Micro%20Tech/Desktop/wood/micron/micron/public/sw.js)
- Loaded Firebase App and Messaging compat scripts.
- Configured FCM background listener `messaging.onBackgroundMessage` to capture push notifications and invoke `self.registration.showNotification` when the browser tab is not active/focused.
- Maintained the existing custom action handlers (e.g., viewing bills, retrying payments, etc.).

### 3. Serverless API Route to Send Push Notifications
- **File created**: [send-push.js](file:///c:/Users/Micro%20Tech/Desktop/wood/micron/micron/api/send-push.js)
- Created Vercel serverless function that uses `firebase-admin` to send push messages.
- Accepts an array of tokens, chunking them in groups of 500 (FCM maximum limit) to run multicast pushes.

### 4. FCM Token Registration
- **File modified**: [useCustomerNotifications.ts](file:///c:/Users/Micro%20Tech/Desktop/wood/micron/micron/src/hooks/useCustomerNotifications.ts)
- Hooks now request the FCM push token when notification permissions are granted (or silently during mount if already granted).
- Calls the save handler to write the token to Firestore linked to the specific table session.

### 5. Push Orchestration and Sending
- **File modified**: [notificationSystem.ts](file:///c:/Users/Micro%20Tech/Desktop/wood/micron/micron/src/services/notificationSystem.ts)
- Created the token storage model in Firestore under a `pushTokens` collection.
- Re-wired `triggerCustomerNotification` to query all registered tokens for a specific table and fire the multicast API call.
- Re-wired `sendImmediateNotification` so that when broadcasting to all tables, it executes a single multicast batch to all active restaurant tokens.

### 6. Environment Configuration
- **File modified**: [.env](file:///c:/Users/Micro%20Tech/Desktop/wood/micron/micron/.env)
- Added `VITE_FIREBASE_VAPID_KEY` placeholder.

---

## 🛠️ Actions Needed from You

To activate the real push notification delivery:
1. Go to your **[Firebase Console](https://console.firebase.google.com)**.
2. Select your project **`menu-ordering-app-fe429`**.
3. Click the gear icon next to "Project Overview" and choose **Project Settings**.
4. Go to the **Cloud Messaging** tab.
5. In the **Web configuration** section, click **Generate key pair** under "Web Push certificates" (or copy it if one already exists).
6. Paste that key into your [.env](file:///c:/Users/Micro%20Tech/Desktop/wood/micron/micron/.env) file:
   ```env
   VITE_FIREBASE_VAPID_KEY=YOUR_GENERATED_KEY_HERE
   ```
7. Restart your development server (`npm run dev`) or redeploy to Vercel/production so the environment changes are picked up by the build tool.
