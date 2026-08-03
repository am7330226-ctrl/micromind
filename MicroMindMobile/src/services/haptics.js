import * as Haptics from 'expo-haptics';

export function triggerTaskCompletionHaptic() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Fallback silently if haptics aren't supported on device
  }
}

export function triggerLightImpact() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Fallback silently if haptics aren't supported on device
  }
}

export function triggerMediumImpact() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Fallback silently if haptics aren't supported on device
  }
}

export function triggerSelectionHaptic() {
  try {
    Haptics.selectionAsync();
  } catch {
    // Fallback silently if haptics aren't supported on device
  }
}
