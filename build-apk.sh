#!/bin/bash

# Build APK for QuickBill

echo "Building QuickBill APK..."

# Set Android SDK path if available
if [ -d "$HOME/Library/Android/sdk" ]; then
    export ANDROID_HOME=$HOME/Library/Android/sdk
elif [ -d "/usr/local/share/android-sdk" ]; then
    export ANDROID_HOME=/usr/local/share/android-sdk
fi

# Clean previous builds
rm -rf android/app/build

# Run Expo build
npx expo run:android --no-install

echo "APK build complete!"
echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"