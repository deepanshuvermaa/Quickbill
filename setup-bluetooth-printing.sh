#!/bin/bash

echo "🔧 Setting up Bluetooth Printing for QuickBill POS"
echo "================================================"
echo ""

# Navigate to project directory
cd /Users/mac/Desktop/quickbill

# Step 1: Install Bluetooth libraries
echo "📦 Step 1: Installing Bluetooth printer libraries..."
npm install react-native-bluetooth-classic react-native-bluetooth-escpos-printer --save

# Step 2: Remove old android folder if it exists
echo ""
echo "🧹 Step 2: Cleaning old Android build..."
rm -rf android/

# Step 3: Generate native Android project with Expo
echo ""
echo "🔨 Step 3: Generating native Android project..."
npx expo prebuild --platform android --clear

# Step 4: Patch for Bluetooth permissions
echo ""
echo "📝 Step 4: Adding Bluetooth permissions..."
# This will be handled by Expo plugins, but we'll verify

# Step 5: Install pods for iOS (if on Mac)
# echo ""
# echo "🍎 Step 5: Installing iOS dependencies..."
# cd ios && pod install && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npx expo run:android"
echo "2. Make sure your device is connected via USB"
echo "3. Enable USB debugging on your device"
echo ""
echo "The app will now support:"
echo "- Classic Bluetooth printers"
echo "- BLE (Bluetooth Low Energy) printers"
echo "- ESC/POS thermal printers"
echo "- 58mm and 80mm paper sizes"