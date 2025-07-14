
const { spawn } = require('child_process');
const bundleProcess = spawn('npx', [
  'react-native', 'bundle',
  '--platform', 'android',
  '--dev', 'false',
  '--entry-file', 'index.js',
  '--bundle-output', 'android/app/src/main/assets/index.android.bundle.tmp',
  '--assets-dest', 'android/app/src/main/res',
  '--max-workers', '1'
], {
  stdio: 'inherit',
  env: { ...process.env, WATCHMAN_CRAWL_FILE_LIMIT: '0' }
});

setTimeout(() => {
  console.log('\nTimeout reached, checking bundle...');
  bundleProcess.kill();
  
  const tmpBundle = 'android/app/src/main/assets/index.android.bundle.tmp';
  if (require('fs').existsSync(tmpBundle)) {
    const size = require('fs').statSync(tmpBundle).size;
    if (size > 100000) {
      require('fs').renameSync(tmpBundle, 'android/app/src/main/assets/index.android.bundle');
      console.log('Bundle created successfully!');
    }
  }
}, 20000);
