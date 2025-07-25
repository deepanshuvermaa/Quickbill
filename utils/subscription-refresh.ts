import { useAuthStore } from '@/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Force refresh subscription data by clearing cache and re-fetching
 */
export const forceRefreshSubscription = async () => {
  const { checkSubscriptionStatus, logout } = useAuthStore.getState();
  
  try {
    // First try to check subscription status
    const result = await checkSubscriptionStatus();
    
    if (result) {
      Alert.alert(
        'Subscription Refreshed',
        'Your subscription data has been updated.',
        [{ text: 'OK' }]
      );
    } else {
      // If check fails, force logout and clear all data
      Alert.alert(
        'Session Refresh Required',
        'Please log in again to refresh your subscription data.',
        [
          {
            text: 'OK',
            onPress: () => {
              logout();
            }
          }
        ]
      );
    }
  } catch (error) {
    console.error('Error refreshing subscription:', error);
    Alert.alert(
      'Refresh Failed',
      'Unable to refresh subscription. Please try logging out and back in.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: () => logout()
        }
      ]
    );
  }
};

/**
 * Clear all cached subscription data
 */
export const clearSubscriptionCache = async () => {
  try {
    // Clear specific subscription-related keys
    const keysToRemove = [
      'subscription',
      'subscriptionStatus',
      'subscriptionLastCheck',
      'userFeatures'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('Subscription cache cleared');
  } catch (error) {
    console.error('Error clearing subscription cache:', error);
  }
};

/**
 * Check if subscription data is stale and needs refresh
 */
export const isSubscriptionDataStale = async (): Promise<boolean> => {
  try {
    const lastCheck = await AsyncStorage.getItem('subscriptionLastCheck');
    if (!lastCheck) return true;
    
    const lastCheckTime = new Date(lastCheck).getTime();
    const now = new Date().getTime();
    const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);
    
    // Consider data stale if older than 1 hour
    return hoursSinceLastCheck > 1;
  } catch (error) {
    console.error('Error checking subscription staleness:', error);
    return true;
  }
};

/**
 * Auto-refresh subscription if data is stale
 */
export const autoRefreshSubscriptionIfNeeded = async () => {
  const isStale = await isSubscriptionDataStale();
  
  if (isStale) {
    console.log('Subscription data is stale, refreshing...');
    const { checkSubscriptionStatus } = useAuthStore.getState();
    await checkSubscriptionStatus();
  }
};