# QuickBill Build Guide

## 🚨 Important: Ensuring Latest Code in Builds

This guide ensures your builds ALWAYS contain the latest code changes.

## Quick Build Commands

### For Release Build with Latest Code:
```bash
./scripts/build-release.sh
```

### For Complete Clean:
```bash
./scripts/clean-all.sh
```

## Manual Build Process

If scripts don't work, follow these steps:

### 1. Clean Everything
```bash
# Kill Metro
pkill -f metro

# Clean caches
rm -rf $TMPDIR/metro-*
rm -rf ~/Library/Caches/com.facebook.ReactNativeBuild
rm -rf android/app/build android/build android/.gradle android/app/.cxx

# Clean npm cache
npm cache clean --force
```

### 2. Generate Fresh Bundle
```bash
# Set environment
export NODE_ENV=production

# Create bundle
mkdir -p android/app/src/main/assets/
npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file node_modules/expo-router/entry.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res \
    --reset-cache
```

### 3. Verify Bundle Contains Your Changes
```bash
# Check if bundle has your features
grep "HSN Code" android/app/src/main/assets/index.android.bundle
# Should return matches if HSN code feature is included
```

### 4. Build APK
```bash
cd android
NODE_ENV=production ./gradlew assembleRelease
```

## Common Issues & Solutions

### Issue: Changes Not Appearing in Built App

**Symptoms:**
- New features missing in APK
- Old code running instead of new code

**Solutions:**
1. Run `./scripts/clean-all.sh`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Ensure no Metro bundler is running: `pkill -f metro`
4. Check you're on the correct git branch: `git branch`

### Issue: Build Fails with CMake Errors

**Solution:**
```bash
rm -rf android/app/.cxx
rm -rf android/app/build/generated
```

### Issue: Metro Cache Not Clearing

**Solution:**
```bash
# Force clear all Metro caches
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
npx expo start -c
```

## Build Configuration

### Key Files:
- `metro.config.js` - Metro bundler configuration (cache reset enabled)
- `android/app/build.gradle` - Android build settings
- `app.json` - Expo configuration

### Environment Variables:
```bash
NODE_ENV=production  # For release builds
```

## Verification Steps

After building, always verify:

1. **Check APK exists:**
   ```bash
   ls -la android/app/build/outputs/apk/release/
   ```

2. **Install and test:**
   ```bash
   adb install -r android/app/build/outputs/apk/release/quickbill-*.apk
   ```

3. **Check features:**
   - Open app
   - Go to Add Item → Look for HSN Code field
   - Go to Settings → Printer Settings → Check paper size options
   - Add item with tax → Verify tax calculations

## Best Practices

1. **Always clean before release builds**
2. **Verify bundle contains your features**
3. **Test on real device after building**
4. **Commit all changes before building**
5. **Use the build scripts provided**

## Build Scripts

### `scripts/build-release.sh`
- Cleans all caches
- Verifies source files
- Generates fresh bundle
- Builds release APK
- Validates output

### `scripts/clean-all.sh`
- Removes ALL caches
- Cleans build directories
- Kills running processes
- Prepares for fresh build

## Troubleshooting Checklist

- [ ] All changes committed? (`git status`)
- [ ] Metro bundler killed? (`pkill -f metro`)
- [ ] Caches cleared? (`./scripts/clean-all.sh`)
- [ ] Bundle regenerated? (Check file date)
- [ ] APK rebuilt? (Check APK date)
- [ ] Features visible in app? (Manual test)

## Emergency Reset

If nothing else works:
```bash
# Complete reset
./scripts/clean-all.sh
rm -rf node_modules
npm install
cd ios && pod install && cd ..
./scripts/build-release.sh
```

---

**Remember:** The key to ensuring latest code is included is to ALWAYS clear caches and regenerate the JavaScript bundle before building!