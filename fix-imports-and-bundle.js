const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fix imports in all screens
const screensToFix = [
  'screens/billing/BillingScreen.tsx',
  'screens/history/HistoryScreen.tsx',
  'screens/settings/SettingsScreen.tsx'
];

console.log('Fixing imports in screens...');

screensToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix useHamburgerMenu import
    content = content.replace(
      /import { useHamburgerMenu } from ['"]\.\..*?\/_layout['"]/g,
      "import { useHamburgerMenu } from '../../utils/hamburgerMenuContext'"
    );
    
    // Remove Stack.Screen usage
    content = content.replace(
      /<Stack\.Screen[\s\S]*?\/>/g,
      ''
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

// Update App.tsx to include HamburgerMenuProvider
const appPath = path.join(__dirname, 'App.tsx');
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  
  // Add import if not present
  if (!appContent.includes('HamburgerMenuProvider')) {
    appContent = appContent.replace(
      "import { NavigationContainer } from '@react-navigation/native';",
      `import { NavigationContainer } from '@react-navigation/native';
import { HamburgerMenuProvider } from './utils/hamburgerMenuContext';`
    );
    
    // Wrap RootNavigator with HamburgerMenuProvider
    appContent = appContent.replace(
      '<RootNavigator />',
      `<HamburgerMenuProvider>
          <RootNavigator />
        </HamburgerMenuProvider>`
    );
    
    fs.writeFileSync(appPath, appContent);
    console.log('Updated App.tsx with HamburgerMenuProvider');
  }
}

console.log('\nCreating bundle...');

// Create a simple bundle command
try {
  execSync('cd android && ./gradlew bundleReleaseJsAndAssets', { stdio: 'inherit' });
} catch (error) {
  console.log('Gradle bundle failed, trying direct metro bundler...');
  
  try {
    // Kill any existing metro processes
    try {
      execSync('pkill -f "metro"', { stdio: 'ignore' });
    } catch (e) {
      // Ignore if no metro process is running
    }
    
    // Wait a moment
    execSync('sleep 2');
    
    // Create bundle directly
    const bundleCommand = `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res --reset-cache`;
    
    execSync(bundleCommand, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });
    
    console.log('Bundle created successfully!');
  } catch (bundleError) {
    console.error('Bundle creation failed:', bundleError.message);
    console.log('Please try running: npm start -- --reset-cache in a separate terminal, then run this script again.');
  }
}

console.log('\nDone! You can now run: npx react-native run-android --mode release');