import { Platform, Alert } from 'react-native';

// Simplified Bluetooth service for managed workflow
interface MockDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

class BluetoothService {
  private devices: Map<string, MockDevice>;

  constructor() {
    this.devices = new Map();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    return true;
  }

  async checkBluetoothState(): Promise<boolean> {
    return false;
  }

  async startDeviceScan(
    onDeviceFound: (device: MockDevice) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    Alert.alert(
      'Feature Coming Soon',
      'Bluetooth device scanning will be available in the next update. This requires a standalone app build.',
      [{ text: 'OK' }]
    );
    
    onError?.(new Error('Bluetooth scanning not available in this version'));
  }

  stopDeviceScan(): void {
    // No-op
  }

  async connectToDevice(deviceId: string): Promise<MockDevice> {
    throw new Error('Bluetooth connection not available in this version');
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    // No-op
  }

  destroy(): void {
    // No-op
  }
}

export default new BluetoothService();