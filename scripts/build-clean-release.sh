#!/bin/bash

# QuickBill Clean Release Build Script
# This script ensures a completely clean build environment

echo "🚀 QuickBill Clean Release Build Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Exit on error
set -e

# Navigate to project root
cd "$(dirname "$0")/.."

# Step 1: Clean everything
echo -e "\n${YELLOW}Step 1: Cleaning everything...${NC}"
./scripts/clean-all.sh

# Step 2: Uninstall old app (if connected device)
echo -e "\n${YELLOW}Step 2: Uninstalling old app (if device connected)...${NC}"
adb uninstall com.quickbill.pos 2>/dev/null || echo "No device connected or app not installed"

# Step 3: Run the main build script
echo -e "\n${YELLOW}Step 3: Running main build script...${NC}"
./build-release.sh

# Step 4: Show APK info
echo -e "\n${YELLOW}Build Complete! APK Information:${NC}"
APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" -type f | head -1)
if [ -n "$APK_PATH" ]; then
    echo "APK Path: $APK_PATH"
    echo "APK Size: $(ls -lh $APK_PATH | awk '{print $5}')"
    
    # Try to install if device connected
    echo -e "\n${YELLOW}Attempting to install on connected device...${NC}"
    adb install -r "$APK_PATH" 2>/dev/null && echo -e "${GREEN}✅ APK installed successfully!${NC}" || echo -e "${YELLOW}No device connected. Transfer APK manually to install.${NC}"
fi

echo -e "\n${GREEN}✅ Build process complete!${NC}"