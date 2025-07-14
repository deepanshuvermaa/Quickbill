const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating production bundle with workaround...\n');

// Step 1: Start Metro in background with no file watching
console.log('Starting Metro bundler...');
const metro = require('child_process').spawn('npx', [
  'react-native', 'start',
  '--no-interactive',
  '--max-workers', '1',
  '--reset-cache'
], {
  detached: true,
  stdio: 'ignore'
});

metro.unref();

// Wait for Metro to start
console.log('Waiting for Metro to initialize...');
execSync('sleep 5');

// Step 2: Use curl to request the bundle
console.log('Requesting bundle from Metro...');
try {
  const bundleUrl = 'http://localhost:8081/index.bundle?platform=android&dev=false&minify=true';
  const outputPath = path.join(__dirname, 'android/app/src/main/assets/index.android.bundle');
  
  // Make sure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  
  // Download bundle
  execSync(`curl -o "${outputPath}" "${bundleUrl}"`, { stdio: 'inherit' });
  
  // Check bundle size
  const stats = fs.statSync(outputPath);
  const fileSizeInMB = stats.size / (1024 * 1024);
  
  console.log(`\nBundle created successfully!`);
  console.log(`Size: ${fileSizeInMB.toFixed(2)} MB`);
  
  if (fileSizeInMB < 0.5) {
    console.warn('Warning: Bundle seems too small. It might be incomplete.');
  }
  
} catch (error) {
  console.error('Failed to create bundle:', error.message);
} finally {
  // Kill Metro
  console.log('\nStopping Metro...');
  try {
    execSync('pkill -f "react-native start"', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors
  }
}

console.log('\nDone! You can now run: npx react-native run-android --mode release');