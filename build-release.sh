#!/bin/bash

# QuickBill Release Build Script

echo "🚀 QuickBill Release Build Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Clean previous builds
echo -e "\n${YELLOW}Step 1: Cleaning previous builds...${NC}"
cd android
./gradlew clean
cd ..

# Clear caches
echo -e "\n${YELLOW}Step 2: Clearing caches...${NC}"
npx react-native start --reset-cache &
METRO_PID=$!
sleep 5
kill $METRO_PID 2>/dev/null

# Clear Metro bundler cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf node_modules/.cache

# Generate native code
echo -e "\n${YELLOW}Step 3: Generating native code...${NC}"
npx expo prebuild

# Generate fresh JavaScript bundle
echo -e "\n${YELLOW}Step 4: Generating fresh JavaScript bundle...${NC}"
cd android
mkdir -p app/src/main/assets

# Use Expo's bundling method
npx expo export:embed \
  --platform android \
  --dev false \
  --output app/src/main/assets/index.android.bundle \
  --assets-dest app/src/main/res

cd ..

# Build release APK
echo -e "\n${YELLOW}Step 5: Building release APK...${NC}"
cd android

# Check if keystore exists
if [ ! -f "../android/keystore.properties" ]; then
    echo -e "${YELLOW}Warning: No keystore.properties found. Using debug keystore for signing.${NC}"
    echo -e "${YELLOW}For production builds, create a proper keystore following keystore-setup.md${NC}"
fi

./gradlew assembleRelease

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Build successful!${NC}"
    
    # Find the APK
    APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" -type f | head -1)
    
    if [ -n "$APK_PATH" ]; then
        echo -e "${GREEN}APK location: android/$APK_PATH${NC}"
        
        # Copy to builds folder
        mkdir -p ../builds
        cp "$APK_PATH" ../builds/
        echo -e "${GREEN}APK copied to: builds/$(basename $APK_PATH)${NC}"
        
        # Show APK info
        echo -e "\n${YELLOW}APK Information:${NC}"
        aapt dump badging "$APK_PATH" | grep -E "package:|application-label:|launchable-activity:"
    else
        echo -e "${RED}Error: APK not found in expected location${NC}"
    fi
else
    echo -e "\n${RED}❌ Build failed! Check the error messages above.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Installation Instructions:${NC}"
echo "1. Uninstall any existing version of QuickBill from your device"
echo "2. Enable 'Install from Unknown Sources' in your device settings"
echo "3. Transfer the APK to your device and install"
echo ""
echo "If installation fails, try:"
echo "  adb uninstall com.quickbill.pos"
echo "  adb install builds/$(basename $APK_PATH)"