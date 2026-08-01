import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_STATE_KEY = 'micromind_app_state_v2';
const ACTIVE_THEME_KEY = 'micromind_active_theme';

export async function loadSavedState() {
  try {
    const raw = await AsyncStorage.getItem(APP_STATE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading app state from AsyncStorage:', err);
  }
  return null;
}

export async function saveAppState(state) {
  try {
    await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving app state to AsyncStorage:', err);
  }
}

export async function getSavedThemeId() {
  try {
    return (await AsyncStorage.getItem(ACTIVE_THEME_KEY)) || 'dark';
  } catch {
    return 'dark';
  }
}

export async function saveThemeId(themeId) {
  try {
    await AsyncStorage.setItem(ACTIVE_THEME_KEY, themeId);
  } catch (err) {
    console.error('Error saving theme ID:', err);
  }
}
