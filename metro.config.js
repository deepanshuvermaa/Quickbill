// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for React Native 0.73+ compatibility
config.resolver = {
  ...config.resolver,
  // Add any problematic modules to be ignored
  blockList: [
    /navigation\/MainNavigator\.tsx/,
    /navigation\/RootNavigator\.tsx/,
    /navigation\/AuthNavigator\.tsx/
  ],
  // Ensure proper module resolution
  nodeModulesPaths: ['./node_modules'],
};

// Ensure proper asset handling
config.transformer = {
  ...config.transformer,
  // Ensure JS bundle is properly created
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Reset cache on every build in production
if (process.env.NODE_ENV === 'production') {
  config.resetCache = true;
}

// Always reset cache for release builds
config.resetCache = true;

module.exports = config;