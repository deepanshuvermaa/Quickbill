const Metro = require('metro');
const fs = require('fs');
const path = require('path');

async function createBundle() {
  console.log('Creating bundle with Metro...');
  
  const config = await Metro.loadConfig();
  
  // Disable file watching
  config.server = {
    ...config.server,
    enableVisualizer: false,
    enhanceMiddleware: (middleware) => middleware,
  };
  
  config.watchFolders = [];
  config.resolver = {
    ...config.resolver,
    platforms: ['android'],
  };
  
  try {
    // Build the bundle
    await Metro.runBuild(config, {
      entry: 'index.js',
      out: 'android/app/src/main/assets/index.android.bundle',
      platform: 'android',
      dev: false,
      minify: true,
      sourceMap: false,
    });
    
    console.log('Bundle created successfully!');
    
    // Check file size
    const stats = fs.statSync('android/app/src/main/assets/index.android.bundle');
    console.log(`Bundle size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('Error creating bundle:', error.message);
    process.exit(1);
  }
}

createBundle();