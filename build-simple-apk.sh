#!/bin/bash

echo "Building QuickBill APK (Simple build without NDK)..."

# Navigate to android directory
cd android

# Skip NDK license check by removing NDK version
sed -i.bak 's/ndkVersion rootProject.ext.ndkVersion/\/\/ ndkVersion rootProject.ext.ndkVersion/' app/build.gradle

# Clean build
./gradlew clean

# Build APK without NDK
./gradlew assembleDebug -PskipNdkBuild=true

# Restore original build.gradle
mv app/build.gradle.bak app/build.gradle

cd ..

if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"
    
    # Get APK size
    APK_SIZE=$(ls -lh android/app/build/outputs/apk/debug/app-debug.apk | awk '{print $5}')
    echo "📦 APK size: $APK_SIZE"
else
    echo "❌ APK build failed"
fi