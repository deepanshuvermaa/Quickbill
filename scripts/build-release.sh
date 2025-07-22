#!/bin/bash

# QuickBill Release Build Script
# This script ensures a clean build with fresh JavaScript bundle

echo "🚀 Starting QuickBill Release Build Process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}📍 Project root: $PROJECT_ROOT${NC}"

# Step 1: Clean all caches
echo -e "\n${YELLOW}🧹 Step 1: Cleaning all caches...${NC}"

# Kill any running Metro instances
echo "Killing Metro bundler..."
pkill -f metro || true

# Clear Metro cache
echo "Clearing Metro cache..."
rm -rf "$TMPDIR/metro-*" 2>/dev/null || true
rm -rf "$TMPDIR/haste-*" 2>/dev/null || true
rm -rf "$TMPDIR/react-*" 2>/dev/null || true

# Clear React Native cache
echo "Clearing React Native cache..."
rm -rf ~/Library/Caches/com.facebook.ReactNativeBuild 2>/dev/null || true

# Clear node_modules cache
echo "Clearing node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true

# Clear watchman cache if available
if command -v watchman &> /dev/null; then
    echo "Clearing Watchman cache..."
    watchman watch-del-all
fi

# Step 2: Verify source files
echo -e "\n${YELLOW}🔍 Step 2: Verifying source files...${NC}"

# Check for key features
if grep -q "HSN Code" screens/items/AddItemScreen.tsx; then
    echo -e "${GREEN}✓ HSN Code feature found${NC}"
else
    echo -e "${RED}✗ HSN Code feature NOT found${NC}"
    exit 1
fi

if grep -q "2 inch\|3 inch" screens/settings/PrinterSettingsScreen.tsx; then
    echo -e "${GREEN}✓ Paper size settings found${NC}"
else
    echo -e "${RED}✗ Paper size settings NOT found${NC}"
    exit 1
fi

# Step 3: Clean Android build
echo -e "\n${YELLOW}🧹 Step 3: Cleaning Android build...${NC}"
cd android

# Remove build directories
rm -rf app/build build .gradle app/.cxx 2>/dev/null || true

# Clean with Gradle (skip if it fails due to CMake issues)
./gradlew clean 2>/dev/null || echo "Gradle clean skipped due to errors"

cd ..

# Step 4: Generate fresh JavaScript bundle
echo -e "\n${YELLOW}📦 Step 4: Generating fresh JavaScript bundle...${NC}"

# Set environment variables
export NODE_ENV=production
export EXPO_PUBLIC_ENV=production

# Generate the bundle using React Native CLI
echo "Creating bundle directory..."
mkdir -p android/app/src/main/assets/

echo "Bundling JavaScript..."
npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file node_modules/expo-router/entry.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res \
    --reset-cache

# Verify bundle was created
if [ -f "android/app/src/main/assets/index.android.bundle" ]; then
    BUNDLE_SIZE=$(ls -lh android/app/src/main/assets/index.android.bundle | awk '{print $5}')
    echo -e "${GREEN}✓ Bundle created successfully (Size: $BUNDLE_SIZE)${NC}"
    
    # Check if bundle contains our features
    if grep -q "HSN Code" android/app/src/main/assets/index.android.bundle; then
        echo -e "${GREEN}✓ Bundle contains HSN Code feature${NC}"
    else
        echo -e "${RED}✗ Bundle does NOT contain HSN Code feature${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Bundle creation failed${NC}"
    exit 1
fi

# Step 5: Build the APK
echo -e "\n${YELLOW}🔨 Step 5: Building Release APK...${NC}"
cd android

# Build with explicit environment
NODE_ENV=production ./gradlew assembleRelease

# Check if APK was created
APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" | grep -v ".dm" | head -1)
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
    echo -e "\n${GREEN}✅ Build Successful!${NC}"
    echo -e "APK Location: ${YELLOW}$APK_PATH${NC}"
    echo -e "APK Size: ${YELLOW}$APK_SIZE${NC}"
    
    # Copy to a known location
    cp "$APK_PATH" "$PROJECT_ROOT/quickbill-latest-release.apk"
    echo -e "Copied to: ${YELLOW}$PROJECT_ROOT/quickbill-latest-release.apk${NC}"
else
    echo -e "${RED}✗ APK build failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Build process completed successfully!${NC}"
echo -e "${YELLOW}To install on your device:${NC}"
echo -e "adb install -r $PROJECT_ROOT/quickbill-latest-release.apk"