import { router } from 'expo-router';

/**
 * Simple navigation to subscription screen with error handling
 * No workarounds needed - subscription is now at root level
 */
export const navigateToSubscription = () => {
  try {
    console.log('[Navigation] Navigating to subscription screen');
    console.log('[Navigation] Current route:', router.canGoBack());
    
    // Back to regular subscription route
    router.push('/subscription');
    
    console.log('[Navigation] Navigation initiated');
  } catch (error) {
    console.error('[Navigation] Error navigating to subscription:', error);
    // Fallback navigation method
    try {
      router.navigate('/subscription');
    } catch (fallbackError) {
      console.error('[Navigation] Fallback navigation also failed:', fallbackError);
    }
  }
};