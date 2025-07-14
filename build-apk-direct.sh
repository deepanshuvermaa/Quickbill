#!/bin/bash

echo "🏗️  Building QuickBill APK directly..."

# Set ANDROID_HOME to a temporary location
export ANDROID_HOME=$HOME/.android-temp
mkdir -p $ANDROID_HOME

# Use Expo to handle the build
cd /Users/mac/Desktop/quickbill

# Build without device check
NODE_ENV=production npx expo export:embed

# If the above doesn't work, use React Native bundle
if [ ! -f "android/app/src/main/assets/index.android.bundle" ]; then
    echo "📦 Creating JavaScript bundle..."
    npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res || true
fi

# Build APK using gradle
cd android
./gradlew assembleDebug --no-daemon --max-workers=2 || true
cd ..

# Check if APK was created
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"
    APK_SIZE=$(ls -lh android/app/build/outputs/apk/debug/app-debug.apk | awk '{print $5}')
    echo "📦 APK size: $APK_SIZE"
else
    echo "❌ APK build failed. Checking for alternative build outputs..."
    find android -name "*.apk" -type f 2>/dev/null
fi