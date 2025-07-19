#!/bin/bash

# QuickBill Android Release Build Script
# This ensures consistent builds every time

set -e  # Exit on error

echo "🚀 QuickBill Android Release Build"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Clean everything
echo -e "\n${YELLOW}Step 1: Cleaning previous builds...${NC}"
cd android
./gradlew clean
cd ..
rm -rf android/app/build
rm -rf android/.gradle
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 2. Create necessary directories
echo -e "\n${YELLOW}Step 2: Creating directories...${NC}"
mkdir -p android/app/src/main/assets

# 3. Clear Metro cache
echo -e "\n${YELLOW}Step 3: Clearing Metro cache...${NC}"
npx react-native start --reset-cache &
METRO_PID=$!
sleep 5
kill $METRO_PID 2>/dev/null || true

# 4. Generate fresh native code
echo -e "\n${YELLOW}Step 4: Running Expo prebuild...${NC}"
npx expo prebuild --clean

# 5. Bundle JavaScript
echo -e "\n${YELLOW}Step 5: Bundling JavaScript...${NC}"
NODE_ENV=production npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res \
  --reset-cache

# 6. Remove duplicate resources
echo -e "\n${YELLOW}Step 6: Cleaning duplicate resources...${NC}"
rm -rf android/app/src/main/res/drawable-*
rm -rf android/app/src/main/res/raw

# 7. Build APK
echo -e "\n${YELLOW}Step 7: Building release APK...${NC}"
cd android
./gradlew assembleRelease

# 8. Verify build
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Build successful!${NC}"
    
    # Find APK
    APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" -type f | grep -v "unaligned" | head -1)
    
    if [ -n "$APK_PATH" ]; then
        echo -e "${GREEN}APK location: android/$APK_PATH${NC}"
        
        # Show APK info
        echo -e "\n${YELLOW}APK Information:${NC}"
        aapt dump badging "$APK_PATH" | grep -E "package:|versionCode|versionName|application-label:"
        
        # Copy to builds folder
        cd ..
        mkdir -p builds
        cp "android/$APK_PATH" builds/
        echo -e "\n${GREEN}APK copied to: builds/$(basename $APK_PATH)${NC}"
    fi
else
    echo -e "\n${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Build process complete!${NC}"