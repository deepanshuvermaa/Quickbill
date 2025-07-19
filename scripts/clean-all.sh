#!/bin/bash

# QuickBill Complete Clean Script
# This script ensures all caches are cleared before building

echo "🧹 QuickBill Complete Clean Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Clean React Native caches
echo -e "\n${YELLOW}Cleaning React Native caches...${NC}"
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
rm -rf node_modules/.cache

# Clean watchman
echo -e "\n${YELLOW}Cleaning Watchman...${NC}"
watchman watch-del-all 2>/dev/null || echo "Watchman not installed"

# Clean node modules (optional, uncomment if needed)
# echo -e "\n${YELLOW}Cleaning node_modules...${NC}"
# rm -rf node_modules
# npm install

# Clean Android build
echo -e "\n${YELLOW}Cleaning Android build...${NC}"
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
rm -rf build

# Remove old bundles
echo -e "\n${YELLOW}Removing old JavaScript bundles...${NC}"
rm -f app/src/main/assets/index.android.bundle
rm -f app/src/main/assets/index.android.bundle.map

cd ..

# Clean iOS build (if exists)
if [ -d "ios" ]; then
    echo -e "\n${YELLOW}Cleaning iOS build...${NC}"
    cd ios
    rm -rf build
    rm -rf Pods
    rm -rf ~/Library/Developer/Xcode/DerivedData
    cd ..
fi

echo -e "\n${GREEN}✅ All caches cleaned successfully!${NC}"
echo -e "${YELLOW}You can now run ./build-release.sh to create a fresh build.${NC}"