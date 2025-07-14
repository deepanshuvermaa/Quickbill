#!/usr/bin/env python3
import subprocess
import time
import os
import signal

print("Starting bundle creation with timeout...")

# Start the bundle process
cmd = [
    'npx', 'react-native', 'bundle',
    '--platform', 'android',
    '--dev', 'false',
    '--entry-file', 'index.js',
    '--bundle-output', 'android/app/src/main/assets/index.android.bundle',
    '--assets-dest', 'android/app/src/main/res',
    '--max-workers', '1'
]

process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

# Wait for up to 30 seconds
try:
    stdout, stderr = process.communicate(timeout=30)
    print("Bundle process completed")
    if stdout:
        print(stdout.decode())
except subprocess.TimeoutExpired:
    print("Bundle process timed out after 30 seconds")
    process.kill()
    # Wait a bit for the process to die
    time.sleep(2)
    # Force kill if needed
    try:
        os.kill(process.pid, signal.SIGKILL)
    except:
        pass

# Check if bundle was created
bundle_path = 'android/app/src/main/assets/index.android.bundle'
if os.path.exists(bundle_path):
    size = os.path.getsize(bundle_path)
    print(f"✓ Bundle created: {size / 1024 / 1024:.2f} MB")
else:
    print("✗ Bundle not found")