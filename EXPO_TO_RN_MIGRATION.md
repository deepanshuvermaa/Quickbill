# Expo to React Native Migration Guide

## Overview
This guide documents the migration from Expo to bare React Native for the QuickBill POS app, with focus on improving Bluetooth printing performance.

## Key Changes Made

### 1. Package.json Updates
- Removed all `expo-*` dependencies
- Added React Native equivalents:
  - `react-native-vector-icons` (replaces @expo/vector-icons)
  - `react-native-splash-screen` (replaces expo-splash-screen)
  - `react-native-print` (replaces expo-print)
  - `react-native-share` (replaces expo-sharing)

### 2. Navigation Changes
- Removed `expo-router` file-based routing
- Implemented `@react-navigation/native` with explicit navigation structure
- Created `/utils/navigation.ts` with helper functions:
  - `useRouter()` - replaces expo-router's useRouter
  - `useLocalSearchParams()` - replaces expo-router's params

### 3. Entry Point Changes
- Created `index.js` as new entry point
- Created `App.tsx` with full navigation structure
- Removed expo-router entry point from package.json

### 4. Import Updates Required
Replace these imports in all files:

```typescript
// OLD (Expo)
import { Stack, useRouter } from 'expo-router';
// NEW (React Native)
import { useRouter } from '@/utils/navigation';

// OLD (Expo)
import { StatusBar } from 'expo-status-bar';
// NEW (React Native)
import { StatusBar } from 'react-native';

// OLD (Expo)
import { Ionicons } from '@expo/vector-icons';
// NEW (React Native)
import Ionicons from 'react-native-vector-icons/Ionicons';
```

### 5. Screen Updates
- Remove all `<Stack.Screen>` components from screens
- Navigation options are now handled in App.tsx

### 6. Build Configuration
- Updated `metro.config.js` for standard React Native
- Updated `babel.config.js` for React Native preset
- Simplified `app.json` to basic React Native format

## Manual Steps Required

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Link Native Dependencies (iOS)
```bash
cd ios && pod install
```

### 3. Link Vector Icons
```bash
react-native link react-native-vector-icons
```

### 4. Android Permissions
Ensure these are in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
```

### 5. Update All Screen Files
Run through each screen file and:
1. Update imports as shown above
2. Remove `<Stack.Screen>` components
3. Update navigation calls if needed

## Benefits After Migration

1. **Faster Bluetooth Connection**: Direct access to native Bluetooth APIs
2. **Better Printer Performance**: No Expo abstraction layers
3. **Smaller App Size**: ~5-10MB reduction
4. **More Control**: Direct access to all native modules

## Testing Checklist

- [ ] App launches successfully
- [ ] Navigation works between all screens
- [ ] Bluetooth printer connects faster
- [ ] Printing works correctly
- [ ] All icons display properly
- [ ] Splash screen shows correctly
- [ ] Status bar styling is correct

## Troubleshooting

### Icons Not Showing
```bash
react-native link react-native-vector-icons
# For iOS
cd ios && pod install
```

### Navigation Not Working
- Ensure all screens are registered in App.tsx
- Check that navigation params match the types in navigation.ts

### Build Errors
```bash
# Clean and rebuild
cd android && ./gradlew clean
cd ios && xcodebuild clean
```

## Next Steps

1. Test Bluetooth printing performance
2. Verify all features work as before
3. Update any remaining Expo-specific code
4. Remove unused Expo files