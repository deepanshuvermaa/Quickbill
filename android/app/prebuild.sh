#!/bin/bash

echo "=== Pre-build: Ensuring fresh JavaScript bundle ==="

# Get project root
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Delete any existing bundles
echo "Deleting old bundles..."
find android -name "index.android.bundle" -type f -delete

# Kill any running Metro instances
pkill -f metro || true

# Clear Metro cache
rm -rf $TMPDIR/metro-*
rm -rf node_modules/.cache

# Ensure assets directory exists
mkdir -p android/app/src/main/assets

# Create fresh bundle
echo "Creating fresh JavaScript bundle..."
NODE_ENV=production npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/build/intermediates/res/merged/release \
  --reset-cache

# Verify bundle was created
if [ -f "android/app/src/main/assets/index.android.bundle" ]; then
  BUNDLE_SIZE=$(ls -lh android/app/src/main/assets/index.android.bundle | awk '{print $5}')
  echo "✓ Bundle created successfully: $BUNDLE_SIZE"
  
  # Check for HSN feature
  if grep -q "HSN" android/app/src/main/assets/index.android.bundle; then
    echo "✓ Bundle contains HSN feature"
  else
    echo "⚠️  WARNING: Bundle may not contain latest features!"
  fi
else
  echo "✗ Failed to create bundle!"
  exit 1
fi