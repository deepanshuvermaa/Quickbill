const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    assetExts: ['db', 'mp3', 'ttf', 'obj', 'png', 'jpg', 'jpeg', 'svg'],
  },
  watchFolders: [],
  cacheStores: [],
  server: {
    enableVisualizer: false,
  },
  watcher: {
    watchman: {
      defer: true,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);