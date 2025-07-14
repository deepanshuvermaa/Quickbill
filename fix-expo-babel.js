const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Fixing Expo Babel configuration...\n');

// Step 1: Update babel.config.js to use metro preset temporarily
const babelConfig = `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      'expo-router/babel',
      'react-native-reanimated/plugin',
    ],
  };
};`;

fs.writeFileSync(path.join(__dirname, 'babel.config.js'), babelConfig);
console.log('✓ Updated babel.config.js');

// Step 2: Install missing dependencies
console.log('\nInstalling missing dependencies...');
try {
  execSync('npm install metro-react-native-babel-preset babel-preset-expo --save-dev', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✓ Dependencies installed');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
}

// Step 3: Clear Metro cache
console.log('\nClearing Metro cache...');
try {
  execSync('npx react-native start --reset-cache &', { stdio: 'ignore' });
  console.log('✓ Metro restarted with cache cleared');
} catch (error) {
  console.error('Failed to restart Metro:', error.message);
}

console.log('\nFix complete! Try reloading the app on your device.');
console.log('Press "r" in the Metro terminal to reload the app.');