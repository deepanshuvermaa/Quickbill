// API Configuration for QuickBill POS
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// Railway Backend URL
const API_BASE_URL = 'https://quickbill-production.up.railway.app/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
  },
  
  // Subscription endpoints
  SUBSCRIPTIONS: {
    PLANS: `${API_BASE_URL}/subscriptions/plans`,
    STATUS: `${API_BASE_URL}/subscriptions/status`,
    CREATE_ORDER: `${API_BASE_URL}/subscriptions/create-order`,
    VERIFY_PAYMENT: `${API_BASE_URL}/subscriptions/verify-payment`,
    SUBMIT_REFERENCE: `${API_BASE_URL}/subscriptions/submit-payment-reference`,
    SUBMIT_PAYMENT_SIMPLE: `${API_BASE_URL}/subscriptions-simple/submit-payment-simple`,
    PENDING_PAYMENTS: `${API_BASE_URL}/subscriptions-simple/pending-payments`,
    VERIFY_PAYMENT_ADMIN: `${API_BASE_URL}/subscriptions-simple/verify-payment`,
    CANCEL: `${API_BASE_URL}/subscriptions/cancel`,
    CHECK_FEATURE: `${API_BASE_URL}/subscriptions/check-feature`,
    GRACE_NOTIFICATIONS: `${API_BASE_URL}/subscriptions/grace-notifications`,
    ACKNOWLEDGE_NOTIFICATION: `${API_BASE_URL}/subscriptions/acknowledge-grace-notification`,
  },
  
  // Usage endpoints
  USAGE: {
    LOG: `${API_BASE_URL}/usage/log`,
    STATS: `${API_BASE_URL}/usage/stats`,
    SYNC: `${API_BASE_URL}/usage/sync`,
    HEALTH: `${API_BASE_URL}/usage/health`,
  },
};

// Helper function for API calls with error handling
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (isDevelopment) {
      console.log('🌐 API Call:', endpoint, config);
    }

    const response = await fetch(endpoint, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}`,
        message: response.statusText 
      }));
      
      throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (isDevelopment) {
      console.log('✅ API Response:', data);
    }

    return data;
  } catch (error) {
    if (isDevelopment) {
      console.error('❌ API Call Error:', error);
    }
    throw error;
  }
};

// Authenticated API call helper
export const authenticatedApiCall = async (
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<any> => {
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Test API connectivity
export const testApiConnection = async (): Promise<boolean> => {
  try {
    await apiCall(API_ENDPOINTS.USAGE.HEALTH);
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};