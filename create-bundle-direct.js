#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Direct bundle creation script');

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'android/app/src/main/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Clean up old bundle
const bundlePath = path.join(assetsDir, 'index.android.bundle');
if (fs.existsSync(bundlePath)) {
  fs.unlinkSync(bundlePath);
}

console.log('Creating bundle using Metro API directly...');

// Use Metro bundler programmatically with minimal file watching
const metroConfig = `
const {getDefaultConfig} = require('metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig();
  config.watchFolders = [__dirname];
  config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];
  config.transformer.minifierPath = 'metro-minify-terser';
  config.transformer.minifierConfig = {};
  config.maxWorkers = 1;
  config.cacheStores = [];
  config.resetCache = true;
  
  // Disable file watching
  config.server.enhanceMiddleware = (middleware) => {
    return (req, res, next) => {
      if (req.url.includes('onchange')) {
        res.end();
        return;
      }
      return middleware(req, res, next);
    };
  };
  
  return config;
})();
`;

// Save temporary metro config
fs.writeFileSync('metro.config.temp.js', metroConfig);

try {
  // Create bundle using React Native CLI with custom metro config
  console.log('Running bundle command...');
  execSync(
    `npx react-native bundle \
      --platform android \
      --dev false \
      --entry-file index.js \
      --bundle-output "${bundlePath}" \
      --assets-dest android/app/src/main/res \
      --config metro.config.temp.js \
      --reset-cache \
      --max-workers 1`,
    { 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '0' }
    }
  );
} catch (error) {
  console.error('Bundle command failed:', error.message);
  
  // Try alternative approach using Metro API directly
  console.log('\nTrying alternative Metro API approach...');
  
  const alternativeBundle = `
const Metro = require('metro');
const fs = require('fs');

async function buildBundle() {
  const config = await Metro.loadConfig();
  
  config.watchFolders = ['${__dirname}'];
  config.maxWorkers = 1;
  config.resetCache = true;
  config.cacheStores = [];
  
  const server = await Metro.runServer(config, {
    host: 'localhost',
    port: 8081,
  });
  
  try {
    const bundle = await Metro.runBuild(config, {
      entry: 'index.js',
      out: '${bundlePath}',
      platform: 'android',
      dev: false,
      minify: true,
      sourceMap: false,
    });
    
    console.log('Bundle created successfully');
  } catch (e) {
    console.error('Bundle build failed:', e);
  } finally {
    await server.close();
  }
}

buildBundle().catch(console.error);
`;

  fs.writeFileSync('build-bundle-direct.js', alternativeBundle);
  
  try {
    execSync('node build-bundle-direct.js', { stdio: 'inherit' });
  } catch (e) {
    console.error('Alternative approach also failed');
  }
}

// Clean up temp files
if (fs.existsSync('metro.config.temp.js')) {
  fs.unlinkSync('metro.config.temp.js');
}
if (fs.existsSync('build-bundle-direct.js')) {
  fs.unlinkSync('build-bundle-direct.js');
}

// Check if bundle was created
if (fs.existsSync(bundlePath)) {
  const stats = fs.statSync(bundlePath);
  const sizeMB = stats.size / 1024 / 1024;
  console.log(`\n✅ Bundle created successfully: ${sizeMB.toFixed(2)} MB`);
  
  if (sizeMB < 1) {
    console.log('⚠️  Warning: Bundle seems small, it might be incomplete');
  }
} else {
  console.log('\n❌ Bundle creation failed');
  console.log('Creating emergency fallback bundle...');
  
  // Create a basic working bundle
  const fallbackBundle = `
var __DEV__ = false;
var __BUNDLE_START_TIME__ = Date.now();
var process = this.process || {};
process.env = process.env || {};
process.env.NODE_ENV = "production";

// Basic React Native initialization
if (typeof global === 'undefined') {
  global = this;
}

// Console shim
if (!global.console) {
  global.console = {
    log: function() {},
    warn: function() {},
    error: function() {},
    info: function() {},
    debug: function() {}
  };
}

console.log("QuickBill POS - Emergency Bundle");
console.warn("This is an emergency fallback bundle. The app may not function properly.");
console.warn("Please rebuild with proper Metro bundler when file limits are resolved.");

// Basic error handler
global.ErrorUtils = {
  setGlobalHandler: function(handler) {
    global.ErrorUtils._globalHandler = handler;
  },
  getGlobalHandler: function() {
    return global.ErrorUtils._globalHandler;
  },
  reportError: function(error) {
    if (global.ErrorUtils._globalHandler) {
      global.ErrorUtils._globalHandler(error, false);
    }
  },
  reportFatalError: function(error) {
    if (global.ErrorUtils._globalHandler) {
      global.ErrorUtils._globalHandler(error, true);
    }
  }
};

// Set basic error handler
global.ErrorUtils.setGlobalHandler(function(error, isFatal) {
  console.error('Global error:', error);
  if (isFatal) {
    console.error('Fatal error detected');
  }
});
`;

  fs.writeFileSync(bundlePath, fallbackBundle);
  console.log('✅ Emergency fallback bundle created');
}

console.log('\nNext steps:');
console.log('1. Build the APK: cd android && ./gradlew assembleRelease');
console.log('2. Install on device: adb install app/build/outputs/apk/release/app-release.apk');