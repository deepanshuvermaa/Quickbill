# QuickBill Installation Troubleshooting

## Common Installation Errors and Solutions

### 1. "App not installed - Package appears to be invalid"

**Causes:**
- Different signing key than previous installation
- Lower version code than previously installed
- Corrupted APK file
- Incompatible device architecture

**Solutions:**

#### Solution A: Complete Uninstall
```bash
# Using ADB (recommended)
adb uninstall com.quickbill.pos
adb uninstall -k com.quickbill.pos  # Force uninstall with data

# Or manually on device:
Settings → Apps → QuickBill → Uninstall for all users
```

#### Solution B: Clear Package Installer Cache
1. Go to Settings → Apps → Show system apps
2. Find "Package Installer" or "Google Play Store"
3. Clear cache and data
4. Restart device

#### Solution C: Check APK Integrity
```bash
# Verify APK is valid
aapt dump badging your-app.apk

# Check APK signature
jarsigner -verify -verbose -certs your-app.apk
```

### 2. "App not installed - Conflicting package"

**Solution:**
```bash
# Find all installed packages
adb shell pm list packages | grep quickbill

# Uninstall for all users
adb uninstall --user 0 com.quickbill.pos
```

### 3. "Parse error - Problem parsing the package"

**Causes:**
- Corrupted download
- Android version too old
- Missing required features

**Solutions:**
- Re-download the APK
- Check minimum Android version (API 24 / Android 7.0)
- Verify device architecture compatibility

### 4. Device-Specific Solutions

#### For Samsung Devices:
- Disable "Secure Folder" temporarily
- Check if app is in "Dual Messenger" apps

#### For Xiaomi/MIUI:
- Turn off MIUI Optimization
- Settings → Developer options → Turn off MIUI optimization

#### For Huawei:
- Check if app is in "App Twin"
- Clear AppGallery cache

### 5. Build Configuration

The app now uses different package names for debug and release:
- **Debug**: `com.quickbill.pos.debug`
- **Release**: `com.quickbill.pos`

This prevents conflicts between debug and release builds.

### 6. Using Debug Build for Testing

If you're having persistent issues with release builds:

```bash
# Build debug APK instead
cd android
./gradlew assembleDebug

# Install debug APK
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 7. Version Management

Always increment `versionCode` in `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 3  // Increment this number
    versionName "1.0.2"  // Update version string
}
```

### 8. Complete Reset Procedure

If nothing else works:

```bash
# 1. Uninstall app completely
adb uninstall com.quickbill.pos
adb uninstall com.quickbill.pos.debug

# 2. Clear all app data
adb shell pm clear com.quickbill.pos

# 3. Restart device
adb reboot

# 4. Install fresh APK
adb install -r your-new-apk.apk
```

### 9. Checking Installation Logs

```bash
# Enable verbose installation
adb install -r -d your-app.apk

# Check logcat for errors
adb logcat | grep -i "packageinstaller\|installd"
```

### 10. Prevention Tips

1. **Always use the same keystore** for all release builds
2. **Increment versionCode** for every release
3. **Test on multiple devices** before distribution
4. **Keep keystore backups** in secure locations
5. **Document your build process**

## Need More Help?

If you're still experiencing issues:
1. Check the exact error message
2. Note your device model and Android version
3. Try building a fresh APK with incremented version code
4. Consider using the debug build for testing