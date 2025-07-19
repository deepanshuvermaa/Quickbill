# Testing QuickBill New Features

## Features to Test

### 1. HSN Code & Item Tax (Add Item Screen)
- Go to Items tab
- Tap "Add Item" button
- You should see:
  - **HSN Code** field (optional text input)
  - **Tax Rate (%)** field (optional number input)
  - When you enter a tax rate, it should show CGST/SGST breakdown

### 2. Item-Level Tax in Billing
- Go to Billing tab
- Add items with different tax rates:
  - Item A: No tax
  - Item B: 5% tax
  - Item C: 18% tax
- Open the cart
- You should see:
  - "Item Taxes" row showing total of item-level taxes
  - "Bill Tax" only applies to items WITHOUT individual tax

### 3. 3-inch Paper Format
- Go to Settings tab
- Open "Printer Settings"
- You should see a toggle for "Paper Size" (2 inch / 3 inch)
- Select 3 inch and try printing a bill

### 4. Verify Tax Calculation Logic
Example scenario:
- Item 1: ₹100 with 5% tax = ₹5 tax
- Item 2: ₹200 with NO tax
- Bill tax: 18%

Expected calculation:
- Item 1 tax: ₹5
- Item 2 tax: ₹200 × 18% = ₹36
- Total tax: ₹41

## If Features Are Missing

The code verification shows all features are implemented. If you don't see them:

1. **Force rebuild the app:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx expo prebuild --clean
   cd android
   ./gradlew assembleRelease
   ```

2. **Check the APK date:**
   Look for the newest APK in:
   - `android/app/build/outputs/apk/release/`
   - It should be named like: `quickbill-v1.0.0-2025-07-18-HHMM-release.apk`

3. **Install the correct APK:**
   Make sure you're installing the newly built APK, not an old one.