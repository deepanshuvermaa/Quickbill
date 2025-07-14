# Fix Build Steps

## Issues Found and Fixed:

1. **Expo modules still being included** ✅
   - Fixed: Updated `android/settings.gradle` to remove all Expo autolinking

2. **Build tools version warning** ✅
   - Fixed: Updated to version 35.0.0

3. **Metro config module missing** ✅
   - Already in package.json, but node_modules needs refresh

## Steps to Fix Build:

1. **Clean everything**:
```bash
chmod +x clean-build.sh
./clean-build.sh
```

OR manually:
```bash
# Clean node modules
rm -rf node_modules
rm -f package-lock.json

# Clean Android
cd android
./gradlew clean
rm -rf app/build
rm -rf build
rm -rf .gradle
cd ..

# Clean Metro cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*

# Reinstall
npm install
```

2. **Build release APK**:
```bash
cd android
./gradlew assembleRelease
```

## What Changed:

### android/settings.gradle
- Removed all Expo autolinking configuration
- Removed expo-modules-autolinking
- Kept only React Native configuration

### android/build.gradle
- Updated buildToolsVersion from "34.0.0" to "35.0.0"

The build should now work without any Expo dependencies!