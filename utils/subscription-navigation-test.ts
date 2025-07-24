import { router } from 'expo-router';

/**
 * Temporary test navigation with multiple fallback methods
 */
export const navigateToSubscriptionTest = () => {
  console.log('[NavigationTest] Starting navigation test');
  
  // Test 1: Try the safe version first
  try {
    console.log('[NavigationTest] Trying safe subscription screen');
    router.push('/subscription-safe');
    return;
  } catch (error) {
    console.error('[NavigationTest] Safe screen failed:', error);
  }
  
  // Test 2: Try minimal version
  try {
    console.log('[NavigationTest] Trying minimal subscription screen');
    router.push('/subscription-minimal');
    return;
  } catch (error) {
    console.error('[NavigationTest] Minimal screen failed:', error);
  }
  
  // Test 3: Try regular version with navigate
  try {
    console.log('[NavigationTest] Trying regular with navigate');
    router.navigate('/subscription');
    return;
  } catch (error) {
    console.error('[NavigationTest] Navigate failed:', error);
  }
  
  // Test 4: Try with replace
  try {
    console.log('[NavigationTest] Trying with replace');
    router.replace('/subscription');
    return;
  } catch (error) {
    console.error('[NavigationTest] Replace failed:', error);
  }
  
  console.error('[NavigationTest] All navigation methods failed');
};