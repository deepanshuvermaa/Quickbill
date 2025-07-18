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
  plan: 'trial' | 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled' | 'grace_period';
  startDate: number;
  endDate: number;
  gracePeriodEnd?: number;
  isInGracePeriod: boolean;
  daysRemaining: number;
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
          // Real API call to check subscription status
          const response = await authenticatedApiCall(
            API_ENDPOINTS.SUBSCRIPTIONS.STATUS,
            token
          );
          
          set({
            subscription: response.subscription,
            lastSyncTime: Date.now(),
          });
        } catch (error) {
          console.error('Failed to check subscription status:', error);
        }
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      hasAccess: (feature: string) => {
        const { isAuthenticated, isGuestMode } = get();
        
        // If user is authenticated, they have access to everything
        if (isAuthenticated) return true;
        
        // If in guest mode, only allow specific features
        if (isGuestMode) {
          const allowedGuestFeatures = [
            'dashboard',
            'billing',
            'items_view', // Can view items but not add/edit
          ];
          return allowedGuestFeatures.includes(feature);
        }
        
        // No access if not authenticated and not guest
        return false;
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
      }),
      skipHydration: false,
    }
  )
);