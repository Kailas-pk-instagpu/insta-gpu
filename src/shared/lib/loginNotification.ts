import { useNotificationStore } from './store';
import type { User } from '../types/auth';
import { ROLE_LABELS } from '../types/auth';

function detectOS(ua: string): string {
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  return 'Unknown browser';
}

export function notifyLogin(user: User) {
  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const os = detectOS(ua);
    const browser = detectBrowser(ua);
    const now = new Date();
    const time = now.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

    useNotificationStore.getState().addNotification({
      title: 'New sign-in',
      message: `${user.name} (${ROLE_LABELS[user.role]}) signed in at ${time} from ${browser} on ${os}.`,
      type: 'info',
    });
  } catch {
    // ignore
  }
}
