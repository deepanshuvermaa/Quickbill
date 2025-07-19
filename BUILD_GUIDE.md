# QuickBill Build Guide

## Quick Build Commands

### For Release Build:
```bash
./scripts/build-android-release.sh
```

### To Verify Build:
```bash
./scripts/verify-build.sh
```

## Manual Build Process

If automated scripts fail, follow these steps:

### 1. Clean Everything
```bash
cd android && ./gradlew clean && cd ..
rm -rf android/app/build
rm -rf android/.gradle
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
```

### 2. Prepare Environment
```bash
# Create assets directory
mkdir -p android/app/src/main/assets

# Clear and restart Metro
npx react-native start --reset-cache &
sleep 5 && pkill -f metro
```

### 3. Generate Native Code
```bash
npx expo prebuild --platform android --clear
```

### 4. Bundle JavaScript (CRITICAL STEP)
```bash
NODE_ENV=production npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res \
  --reset-cache
```

### 5. Build APK
```bash
cd android
./gradlew assembleRelease
```

## Common Issues and Solutions

### Issue: "App not installed - package invalid"
**Solution:**
1. Increment `versionCode` in `android/app/build.gradle`
2. Uninstall old app: `adb uninstall com.quickbill.pos`
3. Clear package installer cache on device

### Issue: Changes not appearing in APK
**Solution:**
1. JavaScript bundle not updated. Always run step 4 above
2. Verify with: `./scripts/verify-build.sh`
3. Check bundle date: `stat android/app/src/main/assets/index.android.bundle`

### Issue: Build fails with vector icons error
**Solution:**
Metro config already excludes problematic files. If persists:
```bash
find . -name "MainNavigator.tsx" -delete
```

### Issue: Version downgrade error
**Solution:**
Always increment `versionCode` in `build.gradle`:
```gradle
versionCode 6  // Increment this
versionName "1.0.3"  // Update this
```

## Build Checklist

Before releasing:
- [ ] Clean all caches
- [ ] Increment version numbers
- [ ] Run automated build script
- [ ] Verify build contains changes
- [ ] Test on device
- [ ] Document any issues

## Version Management

Current versions:
- versionCode: 5
- versionName: "1.0.2"

Always increment `versionCode` for each build!

## Signing Configuration

Release builds use debug keystore by default. For production:
1. Create `android/keystore.properties`
2. Follow `android/keystore-setup.md`

## Environment Variables

Set these for production builds:
```bash
export NODE_ENV=production
export EXPO_NO_CACHE=1
```

## Testing the APK

1. Find APK: `ls -la android/app/build/outputs/apk/release/`
2. Install: `adb install -r <apk-path>`
3. Or use: `npx react-native run-android --mode release`

## Troubleshooting

Run diagnostics:
```bash
# Check React Native environment
npx react-native doctor

# Check Expo setup
npx expo doctor

# Verify file changes
grep -n "hsnCode" types/index.ts
grep -n "taxRate" types/index.ts
```

## Build Artifacts

Builds are saved to:
- APK: `android/app/build/outputs/apk/release/`
- Copied to: `builds/`

## Important Notes

1. **Always bundle JavaScript manually** for release builds
2. **Clean build** when switching between debug/release
3. **Verify builds** before distribution
4. **Keep version numbers** incrementing

## Quick Commands Reference

```bash
# Full clean build
./scripts/build-android-release.sh

# Verify build
./scripts/verify-build.sh

# Install on device
adb install -r builds/quickbill-*.apk

# Check installed version
adb shell dumpsys package com.quickbill.pos | grep version
```