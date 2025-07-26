# Running Android Simulator on Mac for Debugging

## 1. Start Android Emulator

```bash
# List available emulators
emulator -list-avds

# Start specific emulator (replace with your AVD name)
emulator -avd Pixel_3a_API_34_extension_level_7_arm64-v8a

# OR start with Android Studio
open -a "Android Studio"
# Then go to Tools > AVD Manager > Launch emulator
```

## 2. Run the App with Metro Bundler

```bash
# Terminal 1 - Start Metro bundler
cd /Users/mac/Desktop/quickbill
npx react-native start

# Terminal 2 - Run on Android
cd /Users/mac/Desktop/quickbill
npx react-native run-android

# OR using Expo
npx expo run:android
```

## 3. Enable Debug Mode

Once app is running:
- **Mac**: Press `Cmd + M` in emulator
- **Or**: Shake the device (in emulator menu)
- Select "Debug with Chrome" or "Open Debugger"

## 4. View Console Logs

### Option A: Metro Bundler Terminal
- Logs appear in the terminal running Metro

### Option B: Chrome DevTools
1. Open Chrome
2. Go to: http://localhost:8081/debugger-ui
3. Open Console tab

### Option C: React Native Debugger
```bash
# Install if not already
brew install --cask react-native-debugger

# Run it
open -a "React Native Debugger"
```

### Option D: Flipper (Recommended)
```bash
# Download from https://fbflipper.com/
# Or install via brew
brew install --cask flipper

# Run Flipper
open -a Flipper
```

## 5. ADB Commands for Debugging

```bash
# Check connected devices
adb devices

# View all logs
adb logcat

# Filter React Native logs
adb logcat *:S ReactNative:V ReactNativeJS:V

# Clear log buffer
adb logcat -c

# Save logs to file
adb logcat > debug.log
```

## 6. Quick Debug Steps for Subscription Issue

1. **Clear app data first:**
```bash
# Clear app data and cache
adb shell pm clear com.quickbill
```

2. **Run with fresh build:**
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx react-native run-android
```

3. **Watch for console logs:**
- Login as: deepanshuverma966@gmail.com
- Go to Reports screen
- Check console for:
  - "=== SUBSCRIPTION DEBUG ==="
  - "getCurrentLimits called:"
  - "Checking subscription active status:"

## 7. Add More Debug Logs

Add this to your login screen temporarily:

```javascript
// In login success handler
console.log('LOGIN RESPONSE:', JSON.stringify(response, null, 2));
console.log('SUBSCRIPTION DATA:', JSON.stringify(response.subscription, null, 2));
```

## 8. Force Refresh Subscription

After login, try:
1. Go to Settings
2. Tap "Refresh Subscription Data"
3. Check console logs
4. Navigate to Reports

## 9. Check AsyncStorage

In debug console, run:
```javascript
// Check stored subscription
AsyncStorage.getItem('auth-storage').then(data => {
  const parsed = JSON.parse(data);
  console.log('STORED SUBSCRIPTION:', parsed.state.subscription);
});
```

## Common Issues to Check:

1. **Date Format**: Check if dates are strings or numbers
2. **Plan Name**: Verify it's "platinum" not "platinum_monthly"
3. **Status**: Should be "active"
4. **Auth Token**: Make sure token is valid

Run these commands and share the console output, especially the subscription object structure!