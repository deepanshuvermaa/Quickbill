// Mock Bluetooth implementation for when BLE is not available
import { Bill } from '@/types';

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
  console.log('Bluetooth not available in this environment');
  return false;
};

export const requestBluetoothPermission = async (): Promise<boolean> => {
  return false;
};

export const isLocationEnabled = async (): Promise<boolean> => {
  return false;
};

export const scanForPrinters = async (
  onDeviceFound: (device: PrinterDevice) => void,
  onError?: (error: Error) => void
): Promise<{ stop: () => void }> => {
  if (onError) {
    onError(new Error('Bluetooth not available'));
  }
  return { stop: () => {} };
};

export const connectToPrinter = async (deviceId: string): Promise<boolean> => {
  return false;
};

export const disconnectFromPrinter = async (deviceId: string): Promise<void> => {
  // No-op
};

export const testPrinterConnection = async (deviceId: string): Promise<boolean> => {
  return false;
};

export const printBillToPrinter = async (
  deviceId: string,
  bill: Bill,
  settings?: any
): Promise<void> => {
  console.log('Printing not available in this environment');
  throw new Error('Bluetooth printing not available');
};