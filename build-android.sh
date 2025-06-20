#!/bin/bash

# QuickBill Android Build Script

echo "🚀 Building QuickBill Android App..."

# Set up environment variables
export PATH="/usr/local/opt/openjdk@17/bin:$PATH"
export JAVA_HOME="/usr/local/opt/openjdk@17"
export ANDROID_HOME="/usr/local/share/android-commandlinetools"
export NODE_ENV="production"

# Navigate to android directory
cd android

# Build APK
echo "📱 Building APK..."
./gradlew assembleRelease

# Build AAB for Play Store
echo "📦 Building AAB for Play Store..."
./gradlew bundleRelease

echo "✅ Build complete!"
echo ""
echo "📍 APK Location: ./app/build/outputs/apk/release/app-release.apk"
echo "📍 AAB Location: ./app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "To install on device: adb install app/build/outputs/apk/release/app-release.apk"