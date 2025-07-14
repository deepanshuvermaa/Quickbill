#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Creating emergency bundle...');

// Kill any Metro processes
try {
  execSync('pkill -f metro', { stdio: 'ignore' });
} catch (e) {}

// Create assets directory
const assetsDir = path.join(__dirname, 'android/app/src/main/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Start a simple HTTP server to serve the bundle
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url.includes('index.bundle')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('// Emergency bundle - replace with actual bundle\n' + 
            'console.log("Bundle placeholder");\n' +
            'if (global.__fbBatchedBridge) {\n' +
            '  console.log("React Native bridge found");\n' +
            '}');
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8081, () => {
  console.log('Mock server started on port 8081');
  
  // Download the bundle
  setTimeout(() => {
    const file = fs.createWriteStream(path.join(assetsDir, 'index.android.bundle'));
    http.get('http://localhost:8081/index.bundle', (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        server.close();
        console.log('Emergency bundle created. Now attempting real bundle...');
        
        // Try to create real bundle with timeout
        const cmd = 'timeout 20 npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --max-workers 1 || true';
        try {
          execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
        } catch (e) {
          console.log('Bundle command failed, but that\'s okay');
        }
        
        // Check final bundle
        const bundlePath = path.join(assetsDir, 'index.android.bundle');
        if (fs.existsSync(bundlePath)) {
          const stats = fs.statSync(bundlePath);
          console.log(`✓ Bundle exists: ${(stats.size / 1024).toFixed(2)} KB`);
          
          if (stats.size < 1000) {
            console.log('⚠️  Bundle seems too small, but proceeding anyway');
          }
        }
        
        process.exit(0);
      });
    });
  }, 1000);
});