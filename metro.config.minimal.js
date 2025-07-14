const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  watchFolders: [],
  server: {
    enhanceMiddleware: (middleware) => middleware,
  },
  resolver: {
    assetExts: ['db', 'mp3', 'ttf', 'obj', 'png', 'jpg', 'jpeg', 'svg'],
  },
  watcher: {
    watchman: false,
  },
  maxWorkers: 1,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);