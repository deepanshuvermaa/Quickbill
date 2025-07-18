import { Platform } from 'react-native';
import { Bill } from '@/types';
import { bluetoothPrinter, ThermalPrinter } from './bluetooth-thermal-printer';

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
  
  return await bluetoothPrinter.isBluetoothEnabled();
};

export const requestBluetoothPermission = async (): Promise<boolean> => {
  return await bluetoothPrinter.requestPermissions();
};

// New overloaded function for direct scanning
export async function scanForPrinters(): Promise<PrinterDevice[]>;
export async function scanForPrinters(
  onDeviceFound: (device: PrinterDevice) => void,
  onError?: (error: Error) => void
): Promise<{ stop: () => void }>;

export async function scanForPrinters(
  onDeviceFound?: (device: PrinterDevice) => void,
  onError?: (error: Error) => void
): Promise<PrinterDevice[] | { stop: () => void }> {
  try {
    const printers = await bluetoothPrinter.scanForPrinters();
    
    // Convert to PrinterDevice format
    const devices: PrinterDevice[] = printers.map(printer => ({
      id: printer.id,
      name: printer.name,
      address: printer.address,
      paired: printer.bonded,
      connected: printer.connected,
      type: 'thermal' as const,
      paperWidth: '58mm' as const,
    }));
    
    if (onDeviceFound) {
      // Callback mode
      devices.forEach(device => onDeviceFound(device));
      return { stop: () => {} };
    } else {
      // Direct mode
      return devices;
    }
  } catch (error) {
    if (onError) {
      onError(error as Error);
    }
    if (onDeviceFound) {
      return { stop: () => {} };
    } else {
      return [];
    }
  }
};

export const connectToPrinter = async (deviceId: string): Promise<boolean> => {
  const printer: ThermalPrinter = {
    id: deviceId,
    name: '',
    address: deviceId,
    bonded: true,
    connected: false,
  };
  
  return await bluetoothPrinter.connectToPrinter(printer);
};

export const disconnectFromPrinter = async (): Promise<void> => {
  await bluetoothPrinter.disconnect();
};

export const testPrinterConnection = async (): Promise<boolean> => {
  try {
    // Just check if printer is connected without printing
    return bluetoothPrinter.isConnected();
  } catch (error) {
    return false;
  }
};

export const printBillToPrinter = async (
  bill: Bill,
  printer: PrinterDevice,
  settings?: any
): Promise<boolean> => {
  try {
    // First connect to the printer if not already connected
    if (!printer.connected) {
      const connected = await connectToPrinter(printer.address);
      if (!connected) {
        return false;
      }
    }
    
    // Print the bill
    await bluetoothPrinter.printBill(bill);
    return true;
  } catch (error) {
    console.error('Error printing bill:', error);
    return false;
  }
};

export const printBillWithPrimaryPrinter = async (
  bill: Bill,
  settings?: any
): Promise<{ success: boolean; message: string }> => {
  try {
    // Get primary printer from settings store
    const { useSettingsStore } = require('@/store/settingsStore');
    const primaryPrinter = useSettingsStore.getState().primaryPrinter;
    
    if (!primaryPrinter) {
      return {
        success: false,
        message: 'No primary printer configured'
      };
    }
    
    // Convert to PrinterDevice format
    const printerDevice: PrinterDevice = {
      id: primaryPrinter.address,
      name: primaryPrinter.name,
      address: primaryPrinter.address,
      paired: true,
      connected: false,
      type: 'thermal',
      paperWidth: '58mm'
    };
    
    // Try to print with the primary printer
    const success = await printBillToPrinter(bill, printerDevice, settings);
    
    if (success) {
      return {
        success: true,
        message: `Printed to ${primaryPrinter.name}`
      };
    } else {
      return {
        success: false,
        message: `Failed to print to ${primaryPrinter.name}`
      };
    }
  } catch (error) {
    console.error('Error printing with primary printer:', error);
    return {
      success: false,
      message: 'Failed to access primary printer'
    };
  }
};

export const isLocationEnabled = async (): Promise<boolean> => {
  // Location is required for Bluetooth scanning on Android
  // This is a simplified check - you might want to implement proper location checking
  return true;
};

// Add missing functions that the modal is trying to use
export const scanForAllBluetoothDevices = async (): Promise<PrinterDevice[]> => {
  try {
    // Use the same scan function but don't filter by printer type
    const devices = await bluetoothPrinter.scanForPrinters();
    
    return devices.map(device => ({
      id: device.id,
      name: device.name || 'Unknown Device',
      address: device.address,
      paired: device.bonded,
      connected: device.connected,
      type: 'thermal' as const,
      paperWidth: '58mm' as const,
    }));
  } catch (error) {
    console.error('Error scanning for all devices:', error);
    return [];
  }
};

export const pairWithDevice = async (device: PrinterDevice): Promise<boolean> => {
  try {
    // For now, we'll just try to connect which will trigger pairing if needed
    const printer: ThermalPrinter = {
      id: device.id,
      name: device.name,
      address: device.address,
      bonded: device.paired || false,
      connected: false,
    };
    
    const connected = await bluetoothPrinter.connectToPrinter(printer);
    if (connected) {
      // Disconnect after successful pairing
      await bluetoothPrinter.disconnect();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error pairing with device:', error);
    return false;
  }
};

export const printTextToPrinter = async (
  text: string,
  printer: PrinterDevice,
  settings?: any
): Promise<boolean> => {
  try {
    // First connect to the printer if not already connected
    if (!printer.connected) {
      const connected = await connectToPrinter(printer.address);
      if (!connected) {
        return false;
      }
    }
    
    // Print the text directly
    await bluetoothPrinter.printText(text);
    return true;
  } catch (error) {
    console.error('Error printing text:', error);
    return false;
  }
};