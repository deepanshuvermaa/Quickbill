#!/bin/bash

# QuickBill Build Verification Script
# This script verifies that the build includes the latest code

echo "🔍 QuickBill Build Verification Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if bundle exists
BUNDLE_PATH="android/app/src/main/assets/index.android.bundle"

if [ -f "$BUNDLE_PATH" ]; then
    echo -e "\n${YELLOW}Bundle Information:${NC}"
    echo "Path: $BUNDLE_PATH"
    echo "Size: $(ls -lh $BUNDLE_PATH | awk '{print $5}')"
    echo "Modified: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" $BUNDLE_PATH 2>/dev/null || stat -c "%y" $BUNDLE_PATH 2>/dev/null)"
    
    # Check if bundle contains recent code (search for a recent feature)
    echo -e "\n${YELLOW}Checking for recent features...${NC}"
    
    # You can add specific strings from your recent features here
    if grep -q "bluetooth" "$BUNDLE_PATH" 2>/dev/null; then
        echo -e "${GREEN}✓ Bluetooth feature found${NC}"
    else
        echo -e "${RED}✗ Bluetooth feature not found${NC}"
    fi
    
    if grep -q "guest mode" "$BUNDLE_PATH" 2>/dev/null; then
        echo -e "${GREEN}✓ Guest mode feature found${NC}"
    else
        echo -e "${RED}✗ Guest mode feature not found${NC}"
    fi
else
    echo -e "${RED}Bundle not found at $BUNDLE_PATH${NC}"
    echo -e "${YELLOW}Run the build script to generate it.${NC}"
fi

# Check git status
echo -e "\n${YELLOW}Git Status:${NC}"
git log --oneline -5

# Check for APK
APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" -type f 2>/dev/null | head -1)
if [ -n "$APK_PATH" ]; then
    echo -e "\n${YELLOW}APK Information:${NC}"
    echo "Path: $APK_PATH"
    echo "Size: $(ls -lh $APK_PATH | awk '{print $5}')"
    echo "Modified: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" $APK_PATH 2>/dev/null || stat -c "%y" $APK_PATH 2>/dev/null)"
fi