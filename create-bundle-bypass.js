const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Create assets directory
const assetsDir = path.join(__dirname, 'android/app/src/main/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Starting Metro server...');

// Start Metro in a child process
const metro = spawn('npx', ['react-native', 'start', '--reset-cache'], {
  detached: true,
  stdio: 'ignore'
});

// Wait for Metro to start
console.log('Waiting for Metro to initialize...');
setTimeout(() => {
  console.log('Downloading bundle...');
  
  const file = fs.createWriteStream(path.join(assetsDir, 'index.android.bundle'));
  const request = http.get('http://localhost:8081/index.bundle?platform=android&dev=false&minify=true', (response) => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log('✓ Bundle created successfully!');
      console.log(`Bundle saved to: ${path.join(assetsDir, 'index.android.bundle')}`);
      
      // Kill Metro server
      try {
        process.kill(-metro.pid);
      } catch (e) {
        // Metro might have already crashed
      }
      
      process.exit(0);
    });
  }).on('error', (err) => {
    fs.unlink(path.join(assetsDir, 'index.android.bundle'), () => {});
    console.error('✗ Failed to download bundle:', err.message);
    process.exit(1);
  });
  
  // Timeout after 2 minutes
  request.setTimeout(120000, () => {
    request.destroy();
    console.error('✗ Bundle download timed out');
    process.exit(1);
  });
  
}, 35000); // Wait 35 seconds for Metro to start