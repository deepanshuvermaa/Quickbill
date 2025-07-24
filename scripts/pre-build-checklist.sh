#!/bin/bash

# QuickBill Pre-Build Checklist
# Run this before any build to ensure everything is ready

echo "📋 QuickBill Pre-Build Checklist"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to perform check
check() {
    local description="$1"
    local command="$2"
    
    echo -n "Checking $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function to check file contains text
check_file_contains() {
    local description="$1"
    local file="$2"
    local text="$3"
    
    echo -n "Checking $description... "
    
    if [ -f "$file" ] && grep -q "$text" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

echo -e "\n${BLUE}1. Git Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected:${NC}"
    git status --short | head -10
    if [ $(git status --porcelain | wc -l) -gt 10 ]; then
        echo "... and $(($(git status --porcelain | wc -l) - 10)) more files"
    fi
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

# Show latest commits
echo -e "\nLatest commits:"
git log --oneline -5

echo -e "\n${BLUE}2. Environment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Node.js installed" "command -v node"
check "NPM installed" "command -v npm"
check "Java installed" "command -v java"
check "Android SDK" "[ -n \"\$ANDROID_HOME\" ]"
check "Gradle wrapper" "[ -f android/gradlew ]"

echo -e "\n${BLUE}3. Dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "node_modules exists" "[ -d node_modules ]"
check "package-lock.json exists" "[ -f package-lock.json ]"
check "react-native installed" "[ -d node_modules/react-native ]"
check "expo-router installed" "[ -d node_modules/expo-router ]"
check "react-native-qrcode-svg installed" "[ -d node_modules/react-native-qrcode-svg ]"

echo -e "\n${BLUE}4. Critical Files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Entry file exists" "[ -f node_modules/expo-router/entry.js ]"
check "App layout exists" "[ -f app/_layout.tsx ]"
check "Subscription screen exists" "[ -f app/subscription.tsx ]"
check "Guest banner exists" "[ -f components/GuestBanner.tsx ]"
check "Auth store exists" "[ -f store/authStore.ts ]"

echo -e "\n${BLUE}5. Feature Verification${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file_contains "Guest bill limit in authStore" "store/authStore.ts" "guestBillCount"
check_file_contains "canCreateBillAsGuest function" "store/authStore.ts" "canCreateBillAsGuest"
check_file_contains "Guest limit check in billing" "app/(tabs)/billing/index.tsx" "canCreateBillAsGuest"
check_file_contains "Subscription routes" "app/subscription.tsx" "PaymentModal"
check_file_contains "API endpoints configured" "utils/api.ts" "API_ENDPOINTS"

echo -e "\n${BLUE}6. Android Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Android manifest exists" "[ -f android/app/src/main/AndroidManifest.xml ]"
check "Gradle properties exists" "[ -f android/gradle.properties ]"
check "Build.gradle exists" "[ -f android/app/build.gradle ]"
check "Keystore configured" "grep -q 'signingConfigs' android/app/build.gradle"

echo -e "\n${BLUE}7. Backend Sync${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if backend files are committed
if [ -f "backend/routes/subscriptions-v2.js" ]; then
    if git ls-files --error-unmatch backend/routes/subscriptions-v2.js > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend subscription routes committed${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠️  Backend subscription routes not committed${NC}"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${RED}✗ Backend subscription routes missing${NC}"
    ((CHECKS_FAILED++))
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All checks passed! Ready to build.${NC}"
    echo -e "Run: ${YELLOW}./scripts/smart-build-release.sh${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some checks failed. Please fix the issues above before building.${NC}"
    
    # Provide helpful suggestions
    echo -e "\n${YELLOW}Suggestions:${NC}"
    
    if ! command -v node > /dev/null 2>&1; then
        echo "- Install Node.js from https://nodejs.org/"
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "- Run: npm install --legacy-peer-deps"
    fi
    
    if [[ -n $(git status --porcelain) ]]; then
        echo "- Commit your changes: git add . && git commit -m 'Your message'"
    fi
    
    exit 1
fi