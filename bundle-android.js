const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const Metro = require('metro');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'android/app/src/main/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Creating JavaScript bundle for Android...');

async function bundleAndroid() {
  try {
    const config = await Metro.loadConfig();
    
    await Metro.runBuild(config, {
      entry: 'index.js',
      out: 'android/app/src/main/assets/index.android.bundle',
      platform: 'android',
      dev: false,
      minify: true,
      sourceMap: false,
    });
    
    console.log('Bundle created successfully!');
  } catch (error) {
    console.error('Error creating bundle:', error);
    process.exit(1);
  }
}

bundleAndroid();