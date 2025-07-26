import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall, authenticatedApiCall, API_ENDPOINTS } from '@/utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  phone?: string;
  isEmailVerified: boolean;
  createdAt: number;
}

interface Subscription {
  id: string;
  plan: 'trial' | 'silver' | 'gold' | 'platinum' | 'monthly' | 'quarterly' | 'yearly';
  planDisplayName?: string;
  tierLevel?: 'silver' | 'gold' | 'platinum';
  status: 'active' | 'expired' | 'cancelled' | 'grace_period' | 'trial';
  isTrial?: boolean;
  trialDaysRemaining?: number;
  startDate: number;
  endDate: number;
  gracePeriodEnd?: number;
  isInGracePeriod: boolean;
  daysRemaining: number;
  graceDaysRemaining?: number;
  features?: {
    hasInventory: boolean;
    hasTaxReports: boolean;
    hasCustomerReports: boolean;
    hasUserReports: boolean;
    hasKotBilling: boolean;
    maxUsers: number;
  };
  autoRenew?: boolean;
}

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  isLoading: boolean;
  lastSyncTime: number | null;
  isHydrated: boolean;
  guestBillCount: number;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  updateSubscription: (subscription: Subscription) => void;
  checkSubscriptionStatus: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  hasAccess: (feature: string) => boolean;
  incrementGuestBillCount: () => void;
  canCreateBillAsGuest: () => boolean;
}

// Real API calls using Railway backend

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isGuestMode: false,
      isLoading: false,
      lastSyncTime: null,
      isHydrated: false,
      guestBillCount: 0,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // Real API call to Railway backend
          const response = await apiCall(API_ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          
          set({
            user: response.user,
            subscription: response.subscription,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isGuestMode: false, // Clear guest mode on login
            lastSyncTime: Date.now(),
          });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      register: async (userData: any) => {
        set({ isLoading: true });
        
        try {
          // Real API call to Railway backend
          const response = await apiCall(API_ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData),
          });
          
          set({
            user: response.user,
            subscription: response.subscription,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isGuestMode: false,
            lastSyncTime: Date.now(),
          });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      continueAsGuest: () => {
        set({
          user: {
            id: 'guest_' + Date.now(),
            email: 'guest@quickbill.app',
            name: 'Guest User',
            businessName: 'Guest Business',
            isEmailVerified: false,
            createdAt: Date.now(),
          },
          subscription: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isGuestMode: true,
          lastSyncTime: Date.now(),
        });
      },
      
      logout: () => {
        set({
          user: null,
          subscription: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isGuestMode: false,
          guestBillCount: 0, // Reset guest bill count on logout
          lastSyncTime: null,
        });
      },
      
      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');
        
        try {
          // Real API call to refresh tokens
          const response = await apiCall(API_ENDPOINTS.AUTH.REFRESH, {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
          
          set({
            token: response.token,
            refreshToken: response.refreshToken,
          });
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },
      
      updateSubscription: (subscription: Subscription) => {
        set({ subscription });
      },
      
      checkSubscriptionStatus: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          // Use the lightweight subscription refresh endpoint
          const response = await authenticatedApiCall(
            API_ENDPOINTS.AUTH.SUBSCRIPTION_REFRESH,
            token
          );
          
          if (response.subscription) {
            set({
              subscription: response.subscription,
              lastSyncTime: Date.now(),
            });
          }
          
          // Return true to indicate success
          return true;
        } catch (error) {
          console.error('Failed to check subscription status:', error);
          
          // Fallback to subscription status endpoint
          try {
            const response = await authenticatedApiCall(
              API_ENDPOINTS.SUBSCRIPTIONS.STATUS,
              token
            );
            
            set({
              subscription: response.data || response.subscription,
              lastSyncTime: Date.now(),
            });
            
            return true;
          } catch (fallbackError) {
            console.error('Fallback subscription check failed:', fallbackError);
            return false;
          }
        }
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      hasAccess: (feature: string) => {
        const { isAuthenticated, isGuestMode } = get();
        
        // If user is authenticated, they have access to everything
        if (isAuthenticated) return true;
        
        // If in guest mode, allow access to all features (with 50 bill limit enforced separately)
        if (isGuestMode) return true;
        
        // No access if not authenticated and not guest
        return false;
      },
      
      incrementGuestBillCount: () => {
        set((state) => ({ guestBillCount: state.guestBillCount + 1 }));
      },
      
      canCreateBillAsGuest: () => {
        const { isGuestMode, guestBillCount } = get();
        return !isGuestMode || guestBillCount < 50;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
      partialize: (state) => ({
        user: state.user,
        subscription: state.subscription,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isGuestMode: state.isGuestMode,
        lastSyncTime: state.lastSyncTime,
        guestBillCount: state.guestBillCount,
      }),
      skipHydration: false,
    }
  )
);