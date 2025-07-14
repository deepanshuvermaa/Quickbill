#!/bin/bash

echo "Building APKs with unique names..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Create JS bundle first
echo "Creating JavaScript bundle..."
npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res/

# Clean drawable resources that might conflict
rm -rf android/app/src/main/res/drawable-*

# Build APKs
cd android

echo "Building release APK..."
./gradlew assembleRelease

echo "Building debug APK..."
./gradlew assembleDebug

cd ..

# Create builds directory
mkdir -p builds

# Copy with unique names
DATE=$(date +%Y%m%d)
TIME=$(date +%H%M)

cp android/app/build/outputs/apk/release/app-release.apk "builds/QuickBill-v${DATE}-${TIME}-release.apk" 2>/dev/null
cp android/app/build/outputs/apk/debug/app-debug.apk "builds/QuickBill-v${DATE}-${TIME}-debug.apk" 2>/dev/null

echo ""
echo "✅ Build complete!"
echo ""
echo "Your APKs are ready:"
echo "  📱 Release: builds/QuickBill-v${DATE}-${TIME}-release.apk"
echo "  🔧 Debug: builds/QuickBill-v${DATE}-${TIME}-debug.apk"
echo ""
echo "Install on your device using:"
echo "  adb install builds/QuickBill-v${DATE}-${TIME}-release.apk"