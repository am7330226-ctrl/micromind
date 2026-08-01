import * as Haptics from 'expo-haptics';

export function triggerTaskCompletionHaptic() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (err) {
    // Fallback silently if haptics aren't supported on device
  }
}

export function triggerLightImpact() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (err) {}
}

export function triggerMediumImpact() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (err) {}
}

export function triggerSelectionHaptic() {
  try {
    Haptics.selectionAsync();
  } catch (err) {}
}
