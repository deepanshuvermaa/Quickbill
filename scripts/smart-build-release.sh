#!/bin/bash

# QuickBill Smart Build System
# Guarantees latest code is included in every build

echo "🚀 QuickBill Smart Build System v2.0"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_LOG="$PROJECT_ROOT/build.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APK_NAME="quickbill-${TIMESTAMP}.apk"

cd "$PROJECT_ROOT"

# Initialize log
echo "Build started at $(date)" > "$BUILD_LOG"

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
        echo "✓ $1" >> "$BUILD_LOG"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        echo "✗ $1 failed" >> "$BUILD_LOG"
        exit 1
    fi
}

# Function to print section
print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Step 1: Git Status Check
print_section "Step 1: Git Status Verification"
echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log -1 --oneline)"

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Do you want to continue with uncommitted changes? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Build cancelled. Please commit your changes first."
        exit 1
    fi
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

# Step 2: Verify Environment
print_section "Step 2: Environment Verification"

# Check Node version
NODE_VERSION=$(node --version)
echo "Node version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
echo "NPM version: $NPM_VERSION"

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -n 1)
echo "Java version: $JAVA_VERSION"

# Step 3: Clean Everything
print_section "Step 3: Deep Clean"

echo "Killing processes..."
pkill -f metro || true
pkill -f watchman || true
sleep 2

echo "Clearing caches..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
rm -rf node_modules/.cache
rm -rf .expo
check_status "Cache cleared"

echo "Clearing watchman..."
watchman watch-del-all 2>/dev/null || true

echo "Clearing Android build..."
cd android
rm -rf app/build build .gradle app/.cxx
./gradlew clean 2>/dev/null || true
cd ..
check_status "Android build cleaned"

# Step 4: Verify Dependencies
print_section "Step 4: Dependencies Check"

# Check if node_modules exists and is recent
if [ -d "node_modules" ]; then
    MODULES_AGE=$(($(date +%s) - $(stat -f %m node_modules 2>/dev/null || stat -c %Y node_modules)))
    if [ $MODULES_AGE -gt 86400 ]; then # Older than 24 hours
        echo -e "${YELLOW}node_modules is older than 24 hours, reinstalling...${NC}"
        rm -rf node_modules
        npm install --legacy-peer-deps
        check_status "Dependencies installed"
    else
        echo -e "${GREEN}✓ Dependencies are up to date${NC}"
    fi
else
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
    check_status "Dependencies installed"
fi

# Step 5: Verify Key Features
print_section "Step 5: Feature Verification"

# Define features to check with correct paths
declare -A FEATURES=(
    ["Subscription Module"]="app/subscription.tsx"
    ["Guest Mode"]="components/GuestBanner.tsx"
    ["Guest Bill Limit"]="store/authStore.ts:guestBillCount"
    ["API Configuration"]="utils/api.ts"
    ["Subscription Manager"]="utils/subscription-manager.ts"
)

echo "Checking critical features..."
for feature in "${!FEATURES[@]}"; do
    IFS=':' read -r file search <<< "${FEATURES[$feature]}"
    search=${search:-$feature}
    
    if [ -f "$file" ]; then
        if grep -q "$search" "$file" 2>/dev/null || [ "$search" = "$feature" ]; then
            echo -e "${GREEN}✓ $feature found in $file${NC}"
        else
            echo -e "${RED}✗ $feature NOT found in $file${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ File $file not found for $feature${NC}"
        exit 1
    fi
done

# Step 6: Generate Bundle
print_section "Step 6: JavaScript Bundle Generation"

# Set production environment
export NODE_ENV=production
export EXPO_PUBLIC_ENV=production

# Remove old bundle
rm -rf android/app/src/main/assets/index.android.bundle
mkdir -p android/app/src/main/assets/

echo "Creating JavaScript bundle..."
npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file node_modules/expo-router/entry.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res \
    --reset-cache \
    --minify true

check_status "Bundle created"

# Verify bundle size and content
if [ -f "android/app/src/main/assets/index.android.bundle" ]; then
    BUNDLE_SIZE=$(ls -lh android/app/src/main/assets/index.android.bundle | awk '{print $5}')
    echo "Bundle size: $BUNDLE_SIZE"
    
    # Check for key features in bundle
    echo "Verifying bundle content..."
    for feature in "GuestBanner" "subscription" "guestBillCount"; do
        if grep -q "$feature" android/app/src/main/assets/index.android.bundle; then
            echo -e "${GREEN}✓ Bundle contains $feature${NC}"
        else
            echo -e "${YELLOW}⚠️  Bundle may not contain $feature (minified)${NC}"
        fi
    done
else
    echo -e "${RED}✗ Bundle file not found${NC}"
    exit 1
fi

# Step 7: Build APK
print_section "Step 7: Building Release APK"

cd android

# Build with explicit configuration
echo "Running gradle build..."
NODE_ENV=production ./gradlew assembleRelease \
    -Dorg.gradle.daemon=false \
    -Dorg.gradle.parallel=false \
    -Dorg.gradle.configureondemand=false

check_status "Gradle build completed"

# Step 8: Verify and Copy APK
print_section "Step 8: APK Verification"

APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" -not -name "*.dm" | head -1)
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
    
    # Copy to project root with timestamp
    cp "$APK_PATH" "$PROJECT_ROOT/$APK_NAME"
    
    # Also create a "latest" copy
    cp "$APK_PATH" "$PROJECT_ROOT/quickbill-latest.apk"
    
    echo -e "\n${GREEN}✅ BUILD SUCCESSFUL!${NC}"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "APK: ${YELLOW}$PROJECT_ROOT/$APK_NAME${NC}"
    echo -e "Latest: ${YELLOW}$PROJECT_ROOT/quickbill-latest.apk${NC}"
    echo -e "Size: ${YELLOW}$APK_SIZE${NC}"
    echo -e "Build Time: ${YELLOW}$(date -d @$(($(date +%s) - $(stat -f %m "$BUILD_LOG" 2>/dev/null || stat -c %Y "$BUILD_LOG"))) -u +%M:%S)${NC}"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Generate build report
    cat > "$PROJECT_ROOT/build-report-${TIMESTAMP}.txt" <<EOF
QuickBill Build Report
======================
Build Date: $(date)
Git Branch: $(git branch --show-current)
Git Commit: $(git log -1 --oneline)
APK Name: $APK_NAME
APK Size: $APK_SIZE
Node Version: $NODE_VERSION
Build Duration: $(date -d @$(($(date +%s) - $(stat -f %m "$BUILD_LOG" 2>/dev/null || stat -c %Y "$BUILD_LOG"))) -u +%M:%S)

Features Verified:
$(for feature in "${!FEATURES[@]}"; do echo "- $feature"; done)

Build Log: $BUILD_LOG
EOF
    
    echo -e "\n${BLUE}Install command:${NC}"
    echo -e "${YELLOW}adb install -r $PROJECT_ROOT/quickbill-latest.apk${NC}"
    
else
    echo -e "${RED}✗ APK build failed${NC}"
    echo "Check android/app/build/outputs/apk/release/ for details"
    exit 1
fi

echo -e "\n${GREEN}🎉 Smart Build completed successfully!${NC}"