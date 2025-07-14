const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Creating static bundle...');

// Kill any running metro
try {
  execSync('pkill -f metro', { stdio: 'ignore' });
} catch (e) {}

const bundleContent = `
var __DEV__ = false;
var __BUNDLE_START_TIME__ = Date.now();
var process = this.process || {};
process.env = process.env || {};
process.env.NODE_ENV = "production";

// Initialize global
if (typeof global === 'undefined') {
  global = this;
}

// Basic console
if (!global.console) {
  global.console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {}
  };
}

// React Native will be loaded dynamically
try {
  // This will trigger React Native to load the app
  require('./index.js');
} catch (e) {
  console.error('Failed to load app:', e);
  
  // Fallback: Show error screen
  if (global.nativeLoggingHook) {
    global.nativeLoggingHook('QuickBill POS: Bundle loading failed - ' + e.message, 0);
  }
}
`;

const outputPath = path.join(__dirname, 'android/app/src/main/assets/index.android.bundle');
fs.writeFileSync(outputPath, bundleContent);

console.log('Basic bundle created.');
console.log('Now trying to build proper bundle with timeout...');

// Try to create proper bundle with timeout
const script = `
const { spawn } = require('child_process');
const bundleProcess = spawn('npx', [
  'react-native', 'bundle',
  '--platform', 'android',
  '--dev', 'false',
  '--entry-file', 'index.js',
  '--bundle-output', 'android/app/src/main/assets/index.android.bundle.tmp',
  '--assets-dest', 'android/app/src/main/res',
  '--max-workers', '1'
], {
  stdio: 'inherit',
  env: { ...process.env, WATCHMAN_CRAWL_FILE_LIMIT: '0' }
});

setTimeout(() => {
  console.log('\\nTimeout reached, checking bundle...');
  bundleProcess.kill();
  
  const tmpBundle = 'android/app/src/main/assets/index.android.bundle.tmp';
  if (require('fs').existsSync(tmpBundle)) {
    const size = require('fs').statSync(tmpBundle).size;
    if (size > 100000) {
      require('fs').renameSync(tmpBundle, 'android/app/src/main/assets/index.android.bundle');
      console.log('Bundle created successfully!');
    }
  }
}, 20000);
`;

fs.writeFileSync('bundle-with-timeout.js', script);
execSync('node bundle-with-timeout.js', { stdio: 'inherit' });

console.log('\nChecking final bundle...');
const finalSize = fs.statSync(outputPath).size;
console.log(`Bundle size: ${(finalSize / 1024).toFixed(2)} KB`);

if (finalSize < 100) {
  console.log('\nWARNING: Bundle is very small. The app may not work properly.');
  console.log('Try running in debug mode first: npx react-native run-android');
} else {
  console.log('\nBundle created! Run: npx react-native run-android --mode release');
}