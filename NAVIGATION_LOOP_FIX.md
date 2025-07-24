# Subscription Navigation Loop Fix

## Problem Description
When any screen tried to navigate to the subscription plan screen (`/auth/subscription`), it would load for a second and then immediately close/redirect away.

## Root Cause
The AuthGuard component was creating a redirect loop:
1. User navigates to `/auth/subscription`
2. AuthGuard checks if user is authenticated and on an auth screen
3. AuthGuard redirects authenticated users away from auth screens (to prevent them from seeing login/register)
4. But subscription screen is in the auth group, causing immediate redirect

## Solution Implemented

### 1. **Navigation State Flag** 
Added `isNavigatingToSubscription` flag to authStore to signal when navigation to subscription is in progress.

### 2. **AuthGuard Updates**
- Added check to skip auth redirects when `isNavigatingToSubscription` is true
- Always allow access to subscription screen for authenticated users
- Added comprehensive logging to track navigation flow

### 3. **Safe Navigation Updates**
- Sets the `isNavigatingToSubscription` flag before navigation
- Clears the flag after successful navigation (with 500ms delay)
- Clears the flag on navigation failure

### 4. **Navigation Lock Hook**
Created `useNavigationLock` to prevent immediate redirects for specified duration.

### 5. **Navigation State Store**
Created dedicated navigation state management to track navigation attempts and prevent loops.

## Files Modified

1. `/store/authStore.ts`
   - Added `isNavigatingToSubscription: boolean`
   - Added `setNavigatingToSubscription(value: boolean)` action

2. `/components/AuthGuard.tsx`
   - Added check for `isNavigatingToSubscription` flag
   - Skip auth checks when navigating to subscription
   - Added comprehensive debug logging

3. `/utils/safe-navigation.ts`
   - Sets navigation flag before attempting navigation
   - Clears flag after success/failure
   - Multiple navigation methods with fallbacks

4. `/store/navigationStore.ts` (new)
   - Tracks navigation state
   - Prevents rapid navigation attempts

5. `/hooks/useNavigationLock.ts` (new)
   - Temporarily blocks navigation to prevent loops

## Testing

To verify the fix works:

1. **From Hamburger Menu**:
   ```
   Tap "Subscription Plans" → Should open subscription screen
   ```

2. **From Banners**:
   ```
   Tap any subscription banner → Should open subscription screen
   ```

3. **From Reports/Inventory**:
   ```
   Tap locked features → Should open subscription screen
   ```

## Debug Output

When navigating, you'll see console logs like:
```
[AuthGuard] Navigation check: { isNavigatingToSubscription: true }
[AuthGuard] Navigation to subscription in progress - skipping checks
[SafeNav] Trying push...
[SafeNav] push succeeded
[SubscriptionScreen] Component mounted
[AuthGuard] Allowing access to subscription screen
```

## If Issues Persist

1. Check console logs for `[AuthGuard]` and `[SafeNav]` messages
2. Ensure Metro cache is cleared: `npx react-native start --reset-cache`
3. Check that all navigation calls use `navigateToSubscription()` function
4. Verify AuthGuard is not modified elsewhere

The navigation is now protected by multiple layers:
- Navigation state flag prevents auth checks during navigation
- Multiple navigation methods ensure at least one succeeds
- Error boundaries catch any rendering issues
- User-friendly fallbacks if all else fails