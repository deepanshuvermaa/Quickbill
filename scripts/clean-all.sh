#!/bin/bash

# QuickBill Deep Clean Script
# Removes all caches and build artifacts

echo "🧹 QuickBill Deep Clean Script"
echo "This will remove all caches and build artifacts"
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."
sleep 3

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📍 Working in: $PROJECT_ROOT"

# Kill processes
echo "🔪 Killing Metro bundler..."
pkill -f metro || true

echo "🔪 Killing Gradle daemons..."
cd android && ./gradlew --stop || true
cd ..

# Clean caches
echo "🗑️  Removing Metro cache..."
rm -rf "$TMPDIR/metro-*" 2>/dev/null || true
rm -rf "$TMPDIR/haste-*" 2>/dev/null || true
rm -rf "$TMPDIR/react-*" 2>/dev/null || true

echo "🗑️  Removing React Native cache..."
rm -rf ~/Library/Caches/com.facebook.ReactNativeBuild 2>/dev/null || true

echo "🗑️  Removing Gradle caches..."
rm -rf ~/.gradle/caches/build-cache-* 2>/dev/null || true
rm -rf ~/.gradle/caches/transforms-* 2>/dev/null || true
rm -rf ~/.gradle/caches/jars-* 2>/dev/null || true

echo "🗑️  Removing Android build directories..."
rm -rf android/app/build 2>/dev/null || true
rm -rf android/build 2>/dev/null || true
rm -rf android/.gradle 2>/dev/null || true
rm -rf android/app/.cxx 2>/dev/null || true
rm -rf android/.kotlin 2>/dev/null || true

echo "🗑️  Removing iOS build directories..."
rm -rf ios/build 2>/dev/null || true
rm -rf ios/Pods 2>/dev/null || true

echo "🗑️  Removing node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true

echo "🗑️  Removing Expo cache..."
rm -rf .expo 2>/dev/null || true

echo "🗑️  Clearing watchman..."
if command -v watchman &> /dev/null; then
    watchman watch-del-all 2>/dev/null || true
fi

echo "🗑️  Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

echo "✅ Deep clean completed!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: cd ios && pod install (for iOS)"
echo "3. Run: npm run build:release (or ./scripts/build-release.sh)"
