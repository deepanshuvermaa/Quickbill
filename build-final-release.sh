#!/bin/bash

echo "Building Final Release APK with Bluetooth fixes..."

# Clean previous builds
cd android
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Create a builds directory if it doesn't exist
mkdir -p ../builds

# Copy and rename the APKs with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Copy release APK
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    cp app/build/outputs/apk/release/app-release.apk ../builds/quickbill-final-release-${TIMESTAMP}.apk
    echo "✅ Release APK created: builds/quickbill-final-release-${TIMESTAMP}.apk"
else
    echo "❌ Release APK not found"
fi

# Build debug APK
./gradlew assembleDebug

# Copy debug APK
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    cp app/build/outputs/apk/debug/app-debug.apk ../builds/quickbill-final-debug-${TIMESTAMP}.apk
    echo "✅ Debug APK created: builds/quickbill-final-debug-${TIMESTAMP}.apk"
else
    echo "❌ Debug APK not found"
fi

cd ..

echo ""
echo "Build complete! Your APKs are in the 'builds' directory:"
ls -lh builds/quickbill-final-*.apk