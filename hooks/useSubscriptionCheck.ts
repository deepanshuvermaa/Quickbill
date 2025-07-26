import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

/**
 * Hook to ensure subscription data is fresh when entering protected screens
 * This helps overcome caching issues by refreshing subscription data
 */
export const useSubscriptionCheck = (featureName?: string) => {
  const { checkSubscriptionStatus, isAuthenticated, subscription } = useAuthStore();
  
  // Refresh subscription when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        // Always refresh subscription data when entering a protected screen
        checkSubscriptionStatus().catch(error => {
          console.error('Failed to refresh subscription:', error);
        });
      }
    }, [isAuthenticated, checkSubscriptionStatus])
  );
  
  // Also refresh on mount (in case focus effect doesn't trigger)
  useEffect(() => {
    if (isAuthenticated) {
      checkSubscriptionStatus().catch(error => {
        console.error('Failed to refresh subscription on mount:', error);
      });
    }
  }, [isAuthenticated]);
  
  return {
    subscription,
    isRefreshing: false, // Could add loading state if needed
  };
};