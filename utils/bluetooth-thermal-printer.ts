import { Platform, PermissionsAndroid } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { Bill } from '@/types';

// ESC/POS Commands
const Commands = {
  ESC: '\x1B',
  GS: '\x1D',
  INIT: '\x1B\x40',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_RIGHT: '\x1B\x61\x02',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  FONT_SIZE_NORMAL: '\x1D\x21\x00',
  FONT_SIZE_DOUBLE_HEIGHT: '\x1D\x21\x10',
  FONT_SIZE_DOUBLE_WIDTH: '\x1D\x21\x20',
  FONT_SIZE_DOUBLE: '\x1D\x21\x30',
  LINE_FEED: '\n',
  CUT_PAPER: '\x1D\x56\x00',
  PAPER_FULL_CUT: '\x1D\x56\x00',
  PAPER_PARTIAL_CUT: '\x1D\x56\x01',
};

export interface ThermalPrinter {
  id: string;
  name: string;
  address: string;
  bonded: boolean;
  connected: boolean;
}

export class BluetoothThermalPrinter {
  private currentDevice: BluetoothDevice | null = null;
  private isScanning: boolean = false;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      
      return Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }

  async isBluetoothEnabled(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.isBluetoothEnabled();
    } catch (error) {
      console.error('Bluetooth check error:', error);
      return false;
    }
  }

  async enableBluetooth(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.requestBluetoothEnabled();
    } catch (error) {
      console.error('Enable Bluetooth error:', error);
      return false;
    }
  }

  async scanForPrinters(): Promise<ThermalPrinter[]> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    const isEnabled = await this.isBluetoothEnabled();
    if (!isEnabled) {
      const enabled = await this.enableBluetooth();
      if (!enabled) {
        throw new Error('Bluetooth is not enabled');
      }
    }

    try {
      // First get bonded devices
      const paired = await RNBluetoothClassic.getBondedDevices();
      const printers: ThermalPrinter[] = paired.map(device => ({
        id: device.id,
        name: device.name || 'Unknown Printer',
        address: device.address,
        bonded: true,
        connected: false,
      }));

      // Check connected status for paired devices
      for (const printer of printers) {
        try {
          const device = await RNBluetoothClassic.getConnectedDevice(printer.address);
          if (device) {
            printer.connected = true;
          }
        } catch (e) {
          // Device not connected, ignore
        }
      }

      // Try to discover new devices only if not already scanning
      if (!this.isScanning) {
        this.isScanning = true;
        try {
          // Cancel any existing discovery first
          try {
            await RNBluetoothClassic.cancelDiscovery();
          } catch (e) {
            // Ignore if not discovering
          }
          
          const discovered = await RNBluetoothClassic.startDiscovery();
          discovered.forEach(device => {
            if (!printers.find(p => p.address === device.address)) {
              printers.push({
                id: device.id,
                name: device.name || 'Unknown Device',
                address: device.address,
                bonded: false,
                connected: false,
              });
            }
          });
        } finally {
          this.isScanning = false;
          // Stop discovery after scanning
          try {
            await RNBluetoothClassic.cancelDiscovery();
          } catch (e) {
            // Ignore
          }
        }
      }

      return printers;
    } catch (error) {
      console.error('Scan error:', error);
      throw error;
    }
  }

  async connectToPrinter(printer: ThermalPrinter): Promise<boolean> {
    try {
      // Disconnect from current device if any
      if (this.currentDevice) {
        await this.disconnect();
      }

      // Connect to new device
      const device = await RNBluetoothClassic.connectToDevice(printer.address);
      this.currentDevice = device;
      
      return device.isConnected();
    } catch (error) {
      console.error('Connect error:', error);
      throw new Error(`Failed to connect to ${printer.name}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.currentDevice) {
      try {
        await this.currentDevice.disconnect();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      this.currentDevice = null;
    }
  }

  isConnected(): boolean {
    return this.currentDevice !== null && this.currentDevice.isConnected !== undefined;
  }

  async write(data: string): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      await this.currentDevice.write(data);
    } catch (error) {
      console.error('Write error:', error);
      throw error;
    }
  }

  async printBill(bill: Bill): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      // Get settings from store
      const { useSettingsStore } = require('@/store/settingsStore');
      const { businessInfo, paperSize } = useSettingsStore.getState();
      
      // Use the generateBillText function with the paper size
      const { generateBillText } = require('./print');
      const billText = generateBillText(bill, paperSize || '2inch');
      
      // Print the formatted text
      await this.printText(billText);
      
      return;

    } catch (error) {
      console.error('Print error:', error);
      throw new Error('Failed to print bill');
    }
  }

  async testPrint(): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      await this.write(Commands.INIT);
      await this.write(Commands.ALIGN_CENTER);
      await this.write(Commands.FONT_SIZE_DOUBLE);
      await this.write('PRINTER TEST\n');
      await this.write(Commands.FONT_SIZE_NORMAL);
      await this.write('--------------------------------\n');
      await this.write('Test print successful\n');
      await this.write('--------------------------------\n');
      await this.write(`Date: ${new Date().toLocaleDateString()}\n`);
      await this.write(`Time: ${new Date().toLocaleTimeString()}\n`);
      await this.write('\n\n\n');
      await this.write(Commands.CUT_PAPER);
    } catch (error) {
      console.error('Test print error:', error);
      throw error;
    }
  }

  async printText(text: string): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      await this.write(Commands.INIT);
      await this.write(Commands.ALIGN_LEFT);
      await this.write(Commands.FONT_SIZE_NORMAL);
      await this.write(text);
      await this.write('\n\n\n\n');
      await this.write(Commands.CUT_PAPER);
    } catch (error) {
      console.error('Print text error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothThermalPrinter();