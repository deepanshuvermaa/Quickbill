#!/bin/bash

# QuickBill Force Build Release Script
# This script GUARANTEES a fresh build with latest code

echo "🔥 QuickBill FORCE Build Release"
echo "This will take longer but ensures 100% fresh build"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Step 1: Kill EVERYTHING
echo -e "${YELLOW}🔪 Step 1: Killing all processes...${NC}"
pkill -f metro || true
pkill -f expo || true
pkill -f gradle || true
pkill -f node || true
sleep 2

# Step 2: Nuclear clean
echo -e "${YELLOW}💣 Step 2: Nuclear clean...${NC}"
rm -rf node_modules
rm -rf android/app/build
rm -rf android/build
rm -rf android/.gradle
rm -rf android/app/.cxx
rm -rf android/.kotlin
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
rm -rf ~/Library/Caches/com.facebook.ReactNativeBuild
npm cache clean --force

# Step 3: Fresh install
echo -e "${YELLOW}📦 Step 3: Fresh install...${NC}"
npm install --legacy-peer-deps

# Step 4: Verify features exist
echo -e "${YELLOW}🔍 Step 4: Verifying features...${NC}"
if ! grep -q "HSN Code" screens/items/AddItemScreen.tsx; then
    echo -e "${RED}✗ HSN Code feature NOT in source!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Features confirmed in source${NC}"

# Step 5: Generate codegen
echo -e "${YELLOW}⚙️ Step 5: Generating native code...${NC}"
cd android
./gradlew generateCodegenArtifactsFromSchema || true
cd ..

# Step 6: Bundle with explicit clear
echo -e "${YELLOW}📱 Step 6: Creating JavaScript bundle...${NC}"
rm -rf android/app/src/main/assets/index.android.bundle
mkdir -p android/app/src/main/assets/

# Use React Native CLI directly with all flags
NODE_ENV=production npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res \
    --minify true \
    --reset-cache \
    --max-workers 2

# Step 7: Verify bundle
echo -e "${YELLOW}🔍 Step 7: Verifying bundle...${NC}"
BUNDLE_SIZE=$(ls -lh android/app/src/main/assets/index.android.bundle | awk '{print $5}')
echo "Bundle size: $BUNDLE_SIZE"

# Check bundle content more thoroughly
echo "Checking bundle content..."
if strings android/app/src/main/assets/index.android.bundle | grep -q "HSN Code"; then
    echo -e "${GREEN}✓ Bundle contains HSN Code feature${NC}"
else
    echo -e "${RED}✗ Bundle missing features - trying alternative method${NC}"
    
    # Alternative: Use Expo's method
    echo -e "${YELLOW}Trying Expo export method...${NC}"
    rm -rf android/app/src/main/assets/index.android.bundle
    NODE_ENV=production npx expo export:embed \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res \
        --platform android \
        --dev false \
        --minify true \
        --reset-cache \
        --entry-file node_modules/expo-router/entry.js
fi

# Step 8: Build APK
echo -e "${YELLOW}🔨 Step 8: Building APK...${NC}"
cd android
NODE_ENV=production ./gradlew assembleRelease

# Step 9: Find and report APK
APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" -not -name "*.dm" | head -1)
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
    cp "$APK_PATH" "$PROJECT_ROOT/quickbill-FORCED-release.apk"
    
    echo -e "\n${GREEN}✅ BUILD SUCCESSFUL!${NC}"
    echo -e "APK: ${YELLOW}$PROJECT_ROOT/quickbill-FORCED-release.apk${NC}"
    echo -e "Size: ${YELLOW}$APK_SIZE${NC}"
    echo -e "\nInstall with:"
    echo -e "${YELLOW}adb install -r quickbill-FORCED-release.apk${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi