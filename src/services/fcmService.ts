import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { app, db } from '../firebase/config';

declare global {
  interface Window {
    AndroidNotification?: {
      showNotification: (title: string, body: string, channelId: string) => void;
      subscribeToTopic: (topic: string) => void;
      getFcmToken: () => string;
    };
  }
}

export interface InAppNotificationPayload {
  id: string;
  title: string;
  body: string;
  category: string;
  actionUrl?: string;
  timestamp: string;
}

/**
 * Initializes Firebase Cloud Messaging (FCM) on supported web & Android WebView environments,
 * subscribes Android devices to real-time topics ("new_services", "announcements"),
 * and saves the user's FCM token to Firestore so notifications arrive without updating the APK.
 */
export async function initializePushNotifications(
  userId: string,
  onForegroundMessage?: (payload: InAppNotificationPayload) => void
): Promise<string | null> {
  try {
    // 1. If running inside the Native Android App, subscribe via Native FCM bridge
    if (typeof window !== 'undefined' && window.AndroidNotification) {
      try {
        window.AndroidNotification.subscribeToTopic('new_services');
        window.AndroidNotification.subscribeToTopic('announcements');
        window.AndroidNotification.subscribeToTopic(`user_${userId}`);
        const nativeToken = window.AndroidNotification.getFcmToken();
        if (nativeToken) {
          await saveUserFcmToken(userId, nativeToken);
          return nativeToken;
        }
      } catch (e) {
        console.warn('Android native notification bridge notice:', e);
      }
    }

    // 2. Request standard Notification permission on supported browsers / Android WebView
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }

    // 3. Initialize Firebase Cloud Messaging Web SDK if supported
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      return null;
    }

    const messaging = getMessaging(app);

    // Foreground message listener
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Nautiyal Cyber Cafe';
      const body = payload.notification?.body || payload.data?.body || 'New update available';
      const category = payload.data?.category || 'Update';
      const actionUrl = payload.data?.actionUrl;

      triggerLocalNotification(title, body, 'new_services_channel');

      if (onForegroundMessage) {
        onForegroundMessage({
          id: `fcm_${Date.now()}`,
          title,
          body,
          category,
          actionUrl,
          timestamp: new Date().toISOString(),
        });
      }
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker?.register('/firebase-messaging-sw.js');
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
        });
        if (token) {
          await saveUserFcmToken(userId, token);
          return token;
        }
      } catch {
        // Fallback silently if VAPID or SW registration is restricted in preview iframe
      }
    }
  } catch (err) {
    console.warn('Push notification initialization notice:', err);
  }
  return null;
}

export async function saveUserFcmToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) return;
  try {
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token.slice(0, 256),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Ignore if user doc not yet created or admin-only account
  }
}

/**
 * Dispatches a native Android notification (via AndroidNotification bridge) or Web Notification
 * when a new service is published by an admin or an application status changes in real time.
 */
export function triggerLocalNotification(
  title: string,
  body: string,
  channelId: 'new_services_channel' | 'application_updates_channel' | 'messages_channel' = 'new_services_channel'
): void {
  try {
    // 1. Native Android Notification Channel via JavascriptInterface
    if (typeof window !== 'undefined' && window.AndroidNotification) {
      window.AndroidNotification.showNotification(title, body, channelId);
      return;
    }

    // 2. Web / PWA System Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/logo-circle.png',
              badge: '/logo-circle.png',
              tag: `${channelId}_${Date.now()}`,
            });
          })
          .catch(() => {
            new Notification(title, { body, icon: '/logo-circle.png' });
          });
      } else {
        new Notification(title, { body, icon: '/logo-circle.png' });
      }
    }
  } catch (err) {
    console.warn('Notification dispatch notice:', err);
  }
}
