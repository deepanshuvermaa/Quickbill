import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isGuestMode, user, subscription, checkSubscriptionStatus, isHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  
  // Debug: console.log('AuthGuard state:', { isAuthenticated, isGuestMode, isHydrated, segments: segments[0] });
  
  useEffect(() => {
    const checkAuth = async () => {
      // Check subscription status if authenticated
      if (isAuthenticated && user) {
        await checkSubscriptionStatus();
      }
      setIsChecking(false);
    };
    
    // Only proceed when store is hydrated
    if (isHydrated) {
      checkAuth();
    }
  }, [isHydrated, isAuthenticated, user]);
  
  useEffect(() => {
    if (isChecking) return;
    
    const inAuthGroup = segments[0] === 'auth';
    
    // If user is not authenticated and not in guest mode -> show login
    if (!isAuthenticated && !isGuestMode && !inAuthGroup) {
      router.replace('/auth/login');
      return;
    }
    
    // If user is authenticated (not guest) and on auth screens -> redirect to app
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
      return;
    }
    
    // If user is in guest mode and on auth screens, allow them to stay (they want to login)
    if (isGuestMode && inAuthGroup) {
      // Let them access auth screens to login
      return;
    }
    
    // Check subscription status for authenticated users
    if (isAuthenticated && subscription) {
      if (subscription.status === 'expired' && !subscription.isInGracePeriod) {
        router.replace('/auth/subscription');
        return;
      }
    }
  }, [isAuthenticated, isGuestMode, segments, isChecking, subscription]);
  
  if (!isHydrated || isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});