import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

class BluetoothService {
  private manager: BleManager | null = null;
  private devices: Map<string, Device>;
  private isSupported: boolean = false;

  constructor() {
    this.devices = new Map();
    this.initializeBluetooth();
  }

  private initializeBluetooth() {
    try {
      if (Platform.OS === 'web') {
        console.log('Bluetooth not supported on web');
        return;
      }
      
      this.manager = new BleManager();
      this.isSupported = true;
      console.log('Bluetooth manager initialized successfully');
    } catch (error) {
      console.log('Bluetooth not available in this environment:', error);
      this.isSupported = false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    if (Platform.OS === 'ios') {
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const apiLevel = parseInt(Platform.Version.toString(), 10);

        if (apiLevel < 31) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'Bluetooth Low Energy requires Location',
              buttonNeutral: 'Ask Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          return (
            result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
          );
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }

    return false;
  }

  async checkBluetoothState(): Promise<boolean> {
    if (!this.manager) {
      return false;
    }
    try {
      const state = await this.manager.state();
      console.log('Bluetooth state:', state);
      return state === State.PoweredOn;
    } catch (error) {
      console.error('Error checking Bluetooth state:', error);
      return false;
    }
  }

  async startDeviceScan(
    onDeviceFound: (device: Device) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!this.isSupported || !this.manager) {
      onError?.(new Error('Bluetooth is not supported in this environment.'));
      return;
    }

    console.log('Starting Bluetooth scan...');
    
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      onError?.(new Error('Bluetooth permissions not granted'));
      return;
    }

    const isBluetoothOn = await this.checkBluetoothState();
    if (!isBluetoothOn) {
      onError?.(new Error('Bluetooth is not enabled. Please turn on Bluetooth and try again.'));
      return;
    }

    this.devices.clear();

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        onError?.(error);
        return;
      }

      if (device && device.id && !this.devices.has(device.id)) {
        console.log('Found device:', device.name || 'Unknown Device', device.id);
        this.devices.set(device.id, device);
        onDeviceFound(device);
      }
    });
  }

  stopDeviceScan(): void {
    if (this.manager) {
      console.log('Stopping Bluetooth scan');
      this.manager.stopDeviceScan();
    }
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    if (!this.manager) {
      throw new Error('Bluetooth is not supported in this environment');
    }
    try {
      console.log('Connecting to device:', deviceId);
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      console.log('Successfully connected to device:', device.name);
      return device;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      throw new Error(`Failed to connect to device: ${error}`);
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    if (!this.manager) {
      return;
    }
    try {
      console.log('Disconnecting from device:', deviceId);
      const device = this.devices.get(deviceId);
      if (device) {
        await device.cancelConnection();
        console.log('Successfully disconnected from device');
      }
    } catch (error) {
      console.error('Error disconnecting from device:', error);
    }
  }

  destroy(): void {
    if (this.manager) {
      console.log('Destroying Bluetooth manager');
      this.manager.destroy();
    }
  }
}

export default new BluetoothService();