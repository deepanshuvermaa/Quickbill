# Bluetooth Printer Setup Guide for QuickBill POS

## Prerequisites
- Android device with Bluetooth
- Thermal printer (ESC/POS compatible)
- USB cable for device connection
- Android Studio (optional but recommended)

## Step 1: Install Dependencies

Open terminal in your project directory and run:

```bash
cd /Users/mac/Desktop/quickbill

# Install Bluetooth libraries
npm install react-native-bluetooth-classic react-native-bluetooth-escpos-printer --save

# Install patch-package to fix any library issues
npm install patch-package --save-dev
```

## Step 2: Clean and Prepare

```bash
# Remove any existing android folder
rm -rf android/

# Clear all caches
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start --clear
# Press Ctrl+C to stop
```

## Step 3: Generate Native Android Project

```bash
# This creates the native Android project with all permissions
npx expo prebuild --platform android --clear
```

## Step 4: Add Bluetooth Configuration

After prebuild, update `android/app/src/main/AndroidManifest.xml` to ensure all permissions are present:

```xml
<!-- Add these permissions if not already present -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- For Android 12+ -->
<uses-feature android:name="android.hardware.bluetooth" android:required="true" />
<uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />
```

## Step 5: Build Development APK

### Option A: Using Expo (Recommended)
```bash
# Make sure your device is connected
adb devices

# Build and run
npx expo run:android
```

### Option B: Using Gradle Directly
```bash
cd android
./gradlew assembleDebug
cd ..

# Install on device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Option C: Using EAS Build (Cloud Build)
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for development
eas build --platform android --profile development
```

## Step 6: Update Your Code

Replace the imports in your printer-related files:

In `utils/bluetooth-print.ts`:
```typescript
import { thermalPrinterService } from './thermal-printer-service';

// Use the new service
export const scanForPrinters = async () => {
  return await thermalPrinterService.scanForPrinters();
};

export const connectToPrinter = async (printer) => {
  return await thermalPrinterService.connectToPrinter(printer);
};

export const printBillToPrinter = async (deviceId, bill) => {
  return await thermalPrinterService.printBill(bill);
};
```

## Step 7: Test Bluetooth Printing

1. **Enable Bluetooth** on your Android device
2. **Pair your thermal printer** in Android Bluetooth settings
3. **Open the app** and go to Settings > Printer Settings
4. **Scan for printers** - your paired printer should appear
5. **Select the printer** and test print

## Troubleshooting

### "Bluetooth not available" error
- Make sure you're running the development build, not Expo Go
- Check that Bluetooth libraries are properly linked

### Cannot find printers
- Ensure printer is paired in Android settings first
- Check Bluetooth permissions are granted
- Try turning Bluetooth off and on

### Print output issues
- Most thermal printers use 58mm or 80mm paper
- Adjust paper width in printer settings
- Check printer compatibility with ESC/POS commands

### Build errors
- Clean and rebuild: `cd android && ./gradlew clean && cd ..`
- Reset Metro cache: `npx react-native start --reset-cache`
- Delete node_modules and reinstall

## Supported Printers

This setup supports:
- Most ESC/POS compatible thermal printers
- Bluetooth Classic printers (most common)
- BLE printers (through react-native-ble-plx)
- Popular brands: Epson, Star, Bixolon, HOIN, RONGTA

## Next Steps

After successful setup:
1. Test with your specific printer model
2. Customize print layout in `thermal-printer-service.ts`
3. Add printer settings (paper size, density, etc.)
4. Implement receipt templates