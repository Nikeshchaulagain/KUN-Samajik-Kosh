/**
 * Notification and Reminder utility for KUN Samajik Kosh
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context may be restricted by user gesture policy
  }
}

export function sendBrowserPushNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    playNotificationChime();
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
    return true;
  } catch (err) {
    console.error('Push notification failed:', err);
    return false;
  }
}

export function formatWhatsAppUrl(phone: string, message: string): string {
  // Clean phone number: remove non-digits
  let clean = phone.replace(/[^0-9]/g, '');
  // Default Nepal country code 977 if 10 digits
  if (clean.length === 10 && (clean.startsWith('98') || clean.startsWith('97'))) {
    clean = '977' + clean;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function formatSmsUrl(phone: string, message: string): string {
  return `sms:${phone}?body=${encodeURIComponent(message)}`;
}
