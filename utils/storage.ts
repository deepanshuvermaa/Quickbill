import { Platform } from 'react-native';

// Platform-specific storage implementation
let storage: any;

if (Platform.OS === 'web') {
  // Web implementation using localStorage
  storage = {
    getItem: async (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error getting item from localStorage:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting item in localStorage:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item from localStorage:', error);
      }
    },
    multiRemove: async (keys: string[]) => {
      try {
        keys.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('Error removing multiple items from localStorage:', error);
      }
    },
    getAllKeys: async () => {
      try {
        return Object.keys(localStorage);
      } catch (error) {
        console.error('Error getting all keys from localStorage:', error);
        return [];
      }
    },
    clear: async () => {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  };
} else {
  // Native implementation using AsyncStorage
  storage = require('@react-native-async-storage/async-storage').default;
}

export default storage;