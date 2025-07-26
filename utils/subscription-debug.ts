import { useAuthStore } from '@/store/authStore';

/**
 * Debug utility to log subscription state and feature access
 */
export const debugSubscription = () => {
  const state = useAuthStore.getState();
  const { subscription, isAuthenticated, isGuestMode } = state;
  
  console.log('=== SUBSCRIPTION DEBUG ===');
  console.log('Is Authenticated:', isAuthenticated);
  console.log('Is Guest Mode:', isGuestMode);
  console.log('Subscription Object:', JSON.stringify(subscription, null, 2));
  
  if (subscription) {
    console.log('Plan:', subscription.plan);
    console.log('Status:', subscription.status);
    console.log('End Date:', subscription.endDate);
    console.log('End Date Type:', typeof subscription.endDate);
    console.log('Is Trial:', subscription.isTrial);
    
    // Check date validity
    const now = new Date().getTime();
    const endDate = new Date(subscription.endDate).getTime();
    console.log('Current Time:', now);
    console.log('End Date Time:', endDate);
    console.log('Is End Date Valid:', !isNaN(endDate));
    console.log('Is Active (date check):', now <= endDate);
  }
  
  console.log('=== END DEBUG ===');
};

/**
 * Debug feature access for a specific feature
 */
export const debugFeatureAccess = (feature: string) => {
  console.log(`=== FEATURE ACCESS DEBUG: ${feature} ===`);
  
  const { subscriptionManager } = require('./subscription-manager');
  const hasAccess = subscriptionManager.hasFeatureAccess(feature);
  
  console.log('Feature:', feature);
  console.log('Has Access:', hasAccess);
  
  const limits = subscriptionManager.getCurrentLimits();
  console.log('Current Limits:', limits);
  
  const { subscription } = useAuthStore.getState();
  if (subscription) {
    console.log('Is Subscription Active:', subscriptionManager.isSubscriptionActive(subscription));
  }
  
  console.log('=== END FEATURE DEBUG ===');
};