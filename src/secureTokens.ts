/**
 * Session tokens live in the iOS Keychain / Android Keystore (expo-secure-store),
 * not in AsyncStorage, which is plain files on the device (checklist item 23).
 *
 * Older builds kept them in AsyncStorage: the first read moves a token found
 * there into secure storage and deletes the old copy, so nobody is logged out.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const PLAYER_TOKEN_KEY = 'sessionToken';
export const COMPANY_TOKEN_KEY = 'companySessionToken';

export async function getToken(key: string): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync(key);
    if (secure) return secure;
  } catch {
    // Keychain not available (rare): fall through to the old copy
  }
  const legacy = await AsyncStorage.getItem(key);
  if (legacy) {
    try {
      await SecureStore.setItemAsync(key, legacy);
      await AsyncStorage.removeItem(key);
    } catch {
      return legacy;
    }
  }
  return legacy;
}

export async function setToken(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
  await AsyncStorage.removeItem(key); // never leave a plain copy behind
}

export async function removeToken(key: string): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(key).catch(() => {}),
    AsyncStorage.removeItem(key),
  ]);
}

/** Logout / delete account: remove both tokens. */
export async function clearAllTokens(): Promise<void> {
  await Promise.all([removeToken(PLAYER_TOKEN_KEY), removeToken(COMPANY_TOKEN_KEY)]);
}
