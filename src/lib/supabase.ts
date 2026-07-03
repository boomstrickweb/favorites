import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Memory storage fallback
const memoryStorage: Record<string, string> = {};

// Custom storage adapter to handle SSR and different environments
const UniversalStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        console.warn('LocalStorage access failed', e);
      }
      return memoryStorage[key] || null;
    }
    
    try {
      // SecureStore can throw if the key is invalid or if the storage is corrupted
      const result = await SecureStore.getItemAsync(key);
      return result;
    } catch (error) {
      console.warn('SecureStore.getItemAsync failed, falling back to memory storage', error);
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string) => {
    memoryStorage[key] = value; // Always sync with memory storage for immediate access

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('LocalStorage write failed', e);
      }
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('SecureStore.setItemAsync failed', error);
    }
  },
  removeItem: async (key: string) => {
    delete memoryStorage[key];

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('LocalStorage remove failed', e);
      }
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore.deleteItemAsync failed', error);
    }
  },
};

// Use the custom adapter to handle both Web (SSR) and Native environments reliably
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: UniversalStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
