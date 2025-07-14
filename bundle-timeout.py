#!/usr/bin/env python3
import subprocess
import signal
import os
import sys
import time

def create_bundle():
    print("Starting bundle creation with 30-second timeout...")
    
    # Create assets directory
    os.makedirs('android/app/src/main/assets', exist_ok=True)
    
    # Command to create bundle
    cmd = [
        'npx', 'react-native', 'bundle',
        '--platform', 'android',
        '--dev', 'false',
        '--entry-file', 'index.js',
        '--bundle-output', 'android/app/src/main/assets/index.android.bundle',
        '--assets-dest', 'android/app/src/main/res',
        '--reset-cache',
        '--max-workers', '1'
    ]
    
    # Start the process
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    # Wait for up to 30 seconds
    timeout = 30
    start_time = time.time()
    
    while process.poll() is None and (time.time() - start_time) < timeout:
        time.sleep(0.1)
    
    if process.poll() is None:
        # Process is still running, kill it
        print(f"\nBundle process timed out after {timeout} seconds. Terminating...")
        process.terminate()
        time.sleep(2)
        if process.poll() is None:
            process.kill()
    
    # Check if bundle was created
    bundle_path = 'android/app/src/main/assets/index.android.bundle'
    if os.path.exists(bundle_path):
        size = os.path.getsize(bundle_path) / 1024 / 1024
        print(f"\n✓ Bundle created successfully: {size:.2f} MB")
        return True
    else:
        print("\n✗ Bundle was not created")
        # Create a minimal bundle as fallback
        print("Creating minimal fallback bundle...")
        with open(bundle_path, 'w') as f:
            f.write('''var __DEV__=false,__BUNDLE_START_TIME__=Date.now(),process=this.process||{};process.env=process.env||{};process.env.NODE_ENV="production";
console.log("QuickBill POS - Minimal Bundle");
// This is a minimal bundle. The app may not function properly.
// Please rebuild with proper bundle.
''')
        print("✓ Minimal bundle created")
        return False

if __name__ == "__main__":
    create_bundle()