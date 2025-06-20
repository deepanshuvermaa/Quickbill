import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { Bill } from '@/types';

// Initialize BLE Manager
const bleManager = new BleManager();

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
  paired?: boolean;
  connected?: boolean;
  type?: 'thermal' | 'pos';
  paperWidth?: '58mm' | '80mm';
}

export const ensureBluetoothReady = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    console.log('Bluetooth not supported on web');
    return false;
  }

  try {
    // Check if Bluetooth is enabled
    const state = await bleManager.state();
    console.log('Bluetooth state:', state);
    
    if (state !== State.PoweredOn) {
      console.log('Bluetooth is not powered on');
      return false;
    }

    // Request permissions for Android
    if (Platform.OS === 'android') {
      const granted = await requestBluetoothPermissions();
      if (!granted) {
        console.log('Bluetooth permissions not granted');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking Bluetooth state:', error);
    return false;
  }
};

export const isBluetoothEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  
  try {
    const state = await bleManager.state();
    return state === State.PoweredOn;
  } catch (error) {
    console.error('Error checking Bluetooth state:', error);
    return false;
  }
};

export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  
  if (Platform.OS === 'android') {
    try {
      // Request location permission (required for BLE scanning)
      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs location permission to scan for Bluetooth devices.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (locationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission denied');
        return false;
      }

      // For Android 12+ (API level 31+), request additional permissions
      if (Platform.Version >= 31) {
        const bluetoothScanGranted = await PermissionsAndroid.request(
          'android.permission.BLUETOOTH_SCAN' as any,
          {
            title: 'Bluetooth Scan Permission',
            message: 'This app needs permission to scan for Bluetooth devices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const bluetoothConnectGranted = await PermissionsAndroid.request(
          'android.permission.BLUETOOTH_CONNECT' as any,
          {
            title: 'Bluetooth Connect Permission',
            message: 'This app needs permission to connect to Bluetooth devices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return (
          bluetoothScanGranted === PermissionsAndroid.RESULTS.GRANTED &&
          bluetoothConnectGranted === PermissionsAndroid.RESULTS.GRANTED
        );
      }

      return true;
    } catch (error) {
      console.error('Error requesting Bluetooth permissions:', error);
      return false;
    }
  }
  
  // iOS permissions are handled automatically
  return true;
};

// Helper function to convert BLE device to PrinterDevice
const convertBleDeviceToPrinter = (device: Device): PrinterDevice => {
  const name = device.name || device.localName || 'Unknown Device';
  
  // Determine if it's likely a printer based on name
  const isPrinter = /printer|pos|thermal|epson|star|zebra|citizen|bixolon/i.test(name);
  
  return {
    id: device.id,
    name: name,
    address: device.id, // BLE uses UUID instead of MAC address
    paired: false, // BLE doesn't have the concept of pairing like classic Bluetooth
    connected: false,
    type: isPrinter ? (name.toLowerCase().includes('thermal') ? 'thermal' : 'pos') : undefined,
    paperWidth: isPrinter ? '80mm' : undefined, // Default assumption
  };
};

export const scanForPrinters = async (): Promise<PrinterDevice[]> => {
  if (Platform.OS === 'web') {
    return [];
  }

  return new Promise((resolve, reject) => {
    const discoveredDevices = new Map<string, Device>();
    let scanTimeout: NodeJS.Timeout;
    let isResolved = false;

    const cleanup = () => {
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
      bleManager.stopDeviceScan();
    };

    // Start scanning
    console.log('Starting BLE scan for printers...');
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (isResolved) return;

      if (error) {
        console.error('BLE scan error:', error);
        cleanup();
        isResolved = true;
        reject(error);
        return;
      }

      if (device && device.name) {
        // Filter for devices that might be printers
        const name = device.name.toLowerCase();
        const isPrinterLike = 
          name.includes('printer') ||
          name.includes('pos') ||
          name.includes('thermal') ||
          name.includes('epson') ||
          name.includes('star') ||
          name.includes('zebra') ||
          name.includes('citizen') ||
          name.includes('bixolon');

        if (isPrinterLike) {
          console.log('Found potential printer:', device.name, device.id);
          discoveredDevices.set(device.id, device);
        }
      }
    });

    // Stop scanning after 10 seconds
    scanTimeout = setTimeout(() => {
      if (isResolved) return;
      
      console.log('Stopping BLE scan, found', discoveredDevices.size, 'potential printers');
      cleanup();
      
      const printers = Array.from(discoveredDevices.values()).map(convertBleDeviceToPrinter);
      isResolved = true;
      resolve(printers);
    }, 10000);
  });
};

export const scanForAllBluetoothDevices = async (): Promise<PrinterDevice[]> => {
  if (Platform.OS === 'web') {
    return [];
  }

  return new Promise((resolve, reject) => {
    const discoveredDevices = new Map<string, Device>();
    let scanTimeout: NodeJS.Timeout;
    let isResolved = false;

    const cleanup = () => {
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
      bleManager.stopDeviceScan();
    };

    // Start scanning for all BLE devices
    console.log('Starting BLE scan for all devices...');
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (isResolved) return;

      if (error) {
        console.error('BLE scan error:', error);
        cleanup();
        isResolved = true;
        reject(error);
        return;
      }

      if (device) {
        // Include all devices with names
        if (device.name || device.localName) {
          console.log('Found device:', device.name || device.localName, device.id);
          discoveredDevices.set(device.id, device);
        }
      }
    });

    // Stop scanning after 15 seconds (longer for all devices)
    scanTimeout = setTimeout(() => {
      if (isResolved) return;
      
      console.log('Stopping BLE scan, found', discoveredDevices.size, 'devices');
      cleanup();
      
      const devices = Array.from(discoveredDevices.values()).map(convertBleDeviceToPrinter);
      isResolved = true;
      resolve(devices);
    }, 15000);
  });
};

export const connectToPrinter = async (printer: PrinterDevice): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    console.log('Connecting to printer:', printer.name);
    
    // Connect to the BLE device
    const device = await bleManager.connectToDevice(printer.id);
    console.log('Connected to device:', device.name);
    
    // Discover services and characteristics
    await device.discoverAllServicesAndCharacteristics();
    console.log('Discovered services for device:', device.name);
    
    return true;
  } catch (error) {
    console.error('Error connecting to printer:', error);
    return false;
  }
};

export const disconnectFromPrinter = async (printer: PrinterDevice): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    console.log('Disconnecting from printer:', printer.name);
    await bleManager.cancelDeviceConnection(printer.id);
    console.log('Disconnected from device:', printer.name);
    return true;
  } catch (error) {
    console.error('Error disconnecting from printer:', error);
    return false;
  }
};

export const pairWithDevice = async (device: PrinterDevice): Promise<boolean> => {
  // BLE doesn't require traditional pairing like classic Bluetooth
  // Connection is the equivalent of pairing in BLE
  console.log('BLE pairing (connecting) with device:', device.name);
  return await connectToPrinter(device);
};

export const printBillToPrinter = async (bill: Bill, printer: PrinterDevice): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    console.log('Printing bill to printer:', printer.name);
    
    // This is a basic implementation - you'll need to customize based on your printer's protocol
    // Most thermal printers use ESC/POS commands
    
    // For now, just simulate printing
    console.log('Bill data:', {
      id: bill.id,
      customerName: bill.customerName,
      total: bill.total,
      items: bill.items.length
    });
    
    // TODO: Implement actual printing commands for your specific printer
    // This would involve sending ESC/POS commands to the printer's characteristic
    
    return true;
  } catch (error) {
    console.error('Error printing bill:', error);
    return false;
  }
};