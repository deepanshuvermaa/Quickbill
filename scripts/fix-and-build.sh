#!/bin/bash

# QuickBill Fix and Build Script
# This fixes all issues and builds a working APK

echo "🔧 QuickBill Fix and Build Script"
echo "================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Step 1: Kill all processes
echo -e "${YELLOW}🔪 Step 1: Killing all processes...${NC}"
pkill -f metro || true
pkill -f expo || true
pkill -f gradle || true

# Step 2: Clean caches properly
echo -e "${YELLOW}🧹 Step 2: Cleaning caches...${NC}"
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
rm -rf ~/Library/Caches/com.facebook.ReactNativeBuild
rm -rf android/app/build
rm -rf android/build
rm -rf android/.gradle
rm -rf android/app/.cxx

# Step 3: Ensure gradle wrapper is correct
echo -e "${YELLOW}🔧 Step 3: Fixing gradle wrapper...${NC}"
if [ ! -f android/gradlew ]; then
    cd android
    gradle wrapper --gradle-version=8.13 --distribution-type=all
    cd ..
fi

# Step 4: Fix entry point
echo -e "${YELLOW}📝 Step 4: Ensuring correct entry point...${NC}"
echo '/**
 * @format
 */

import "expo-router/entry";' > index.js

# Step 5: Clear and rebuild node_modules if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install --legacy-peer-deps
fi

# Step 6: Generate codegen
echo -e "${YELLOW}⚙️ Step 6: Generating codegen...${NC}"
cd android
./gradlew generateCodegenArtifactsFromSchema || true
cd ..

# Step 7: Create fresh bundle using correct method
echo -e "${YELLOW}📱 Step 7: Creating JavaScript bundle...${NC}"
rm -rf android/app/src/main/assets/
mkdir -p android/app/src/main/assets/

# Try Expo's method first
echo "Using Expo export:embed..."
NODE_ENV=production npx expo export:embed \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/build/intermediates/res/merged/release \
    --platform android \
    --dev false \
    --minify true \
    --reset-cache \
    --entry-file node_modules/expo-router/entry.js

# Verify bundle exists
if [ ! -f "android/app/src/main/assets/index.android.bundle" ]; then
    echo -e "${RED}✗ Bundle creation failed with Expo, trying React Native CLI...${NC}"
    NODE_ENV=production npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/build/intermediates/res/merged/release \
        --reset-cache
fi

# Step 8: Verify bundle
echo -e "${YELLOW}🔍 Step 8: Verifying bundle...${NC}"
if [ -f "android/app/src/main/assets/index.android.bundle" ]; then
    BUNDLE_SIZE=$(ls -lh android/app/src/main/assets/index.android.bundle | awk '{print $5}')
    echo -e "${GREEN}✓ Bundle created: $BUNDLE_SIZE${NC}"
    
    # Quick check for features
    if strings android/app/src/main/assets/index.android.bundle | grep -q "HSN"; then
        echo -e "${GREEN}✓ Bundle appears to contain features${NC}"
    else
        echo -e "${YELLOW}⚠ Bundle might not contain all features${NC}"
    fi
else
    echo -e "${RED}✗ Bundle creation failed!${NC}"
    exit 1
fi

# Step 9: Build APK
echo -e "${YELLOW}🔨 Step 9: Building APK...${NC}"
cd android

# Set all required environment variables
export NODE_ENV=production
export EXPO_PUBLIC_ENV=production

# Build with proper configuration
./gradlew assembleRelease \
    -Dorg.gradle.jvmargs="-Xmx4096m -XX:MaxMetaspaceSize=512m" \
    -Dorg.gradle.daemon=false

# Step 10: Find and copy APK
cd ..
APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" -not -name "*.dm" | head -1)

if [ -f "$APK_PATH" ]; then
    cp "$APK_PATH" quickbill-fixed-release.apk
    echo -e "\n${GREEN}✅ SUCCESS!${NC}"
    echo -e "APK: ${YELLOW}quickbill-fixed-release.apk${NC}"
    echo -e "Size: ${YELLOW}$(ls -lh quickbill-fixed-release.apk | awk '{print $5}')${NC}"
    echo -e "\nInstall with:"
    echo -e "${YELLOW}adb install -r quickbill-fixed-release.apk${NC}"
else
    echo -e "${RED}✗ Build failed!${NC}"
    
    # Show recent errors
    echo -e "\n${YELLOW}Recent errors:${NC}"
    find android -name "*.log" -mmin -5 -exec tail -20 {} \; 2>/dev/null
fi