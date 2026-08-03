/**
 * Haptic feedback helper optimized for Android touch interactions
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'double' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(40);
        break;
      case 'double':
        navigator.vibrate([15, 30, 15]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch {
    // Ignore permissions or browser policy errors for vibrations
  }
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}
