import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Bill } from '@/types';

// ESC/POS Commands
const ESC_POS = {
  ESC: '\x1B',
  GS: '\x1D',
  INIT: '\x1B\x40',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_RIGHT: '\x1B\x61\x02',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  FONT_SIZE_NORMAL: '\x1D\x21\x00',
  FONT_SIZE_LARGE: '\x1D\x21\x11',
  FONT_SIZE_XLARGE: '\x1D\x21\x22',
  LINE_FEED: '\x0A',
  CUT_PAPER: '\x1D\x56\x00',
  BARCODE: '\x1D\x6B\x02',
};

export interface ThermalPrinter {
  id: string;
  name: string;
  address: string;
  type: 'classic' | 'ble';
  connected: boolean;
}

export class ThermalPrinterService {
  private currentPrinter: ThermalPrinter | null = null;
  private bluetoothManager: any = null;
  private escposPrinter: any = null;

  constructor() {
    this.initializeBluetooth();
  }

  private async initializeBluetooth() {
    try {
      // Try to load Bluetooth Classic
      const BluetoothManager = require('react-native-bluetooth-escpos-printer').BluetoothManager;
      const BluetoothEscposPrinter = require('react-native-bluetooth-escpos-printer').BluetoothEscposPrinter;
      
      this.bluetoothManager = BluetoothManager;
      this.escposPrinter = BluetoothEscposPrinter;
    } catch (error) {
      console.warn('Bluetooth printer libraries not available:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      if (Platform.Version >= 31) {
        // Android 12+
        const bluetoothScan = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
        const bluetoothConnect = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        
        return bluetoothScan === 'granted' && bluetoothConnect === 'granted';
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }

  async enableBluetooth(): Promise<boolean> {
    if (!this.bluetoothManager) {
      throw new Error('Bluetooth not available');
    }

    try {
      const enabled = await this.bluetoothManager.isBluetoothEnabled();
      if (!enabled) {
        await this.bluetoothManager.enableBluetooth();
      }
      return true;
    } catch (error) {
      console.error('Enable Bluetooth error:', error);
      return false;
    }
  }

  async scanForPrinters(): Promise<ThermalPrinter[]> {
    if (!this.bluetoothManager) {
      throw new Error('Bluetooth not available');
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    const printers: ThermalPrinter[] = [];
    
    try {
      // Get paired devices
      const pairedDevices = await this.bluetoothManager.scanDevices();
      const devices = JSON.parse(pairedDevices);
      
      devices.paired?.forEach((device: any) => {
        printers.push({
          id: device.address,
          name: device.name || 'Unknown Printer',
          address: device.address,
          type: 'classic',
          connected: false
        });
      });

      devices.found?.forEach((device: any) => {
        printers.push({
          id: device.address,
          name: device.name || 'Unknown Printer',
          address: device.address,
          type: 'classic',
          connected: false
        });
      });
    } catch (error) {
      console.error('Scan error:', error);
    }

    return printers;
  }

  async connectToPrinter(printer: ThermalPrinter): Promise<boolean> {
    if (!this.bluetoothManager) {
      throw new Error('Bluetooth not available');
    }

    try {
      await this.bluetoothManager.connect(printer.address);
      this.currentPrinter = { ...printer, connected: true };
      return true;
    } catch (error) {
      console.error('Connect error:', error);
      throw new Error(`Failed to connect to ${printer.name}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.currentPrinter) {
      this.currentPrinter = null;
    }
  }

  async printBill(bill: Bill, settings?: any): Promise<void> {
    if (!this.escposPrinter) {
      throw new Error('Printer not available');
    }

    if (!this.currentPrinter) {
      throw new Error('No printer connected');
    }

    try {
      // Initialize printer
      await this.escposPrinter.printerInit();

      // Print header
      await this.escposPrinter.printerAlign(1); // Center
      await this.escposPrinter.setFontSize(2); // Large
      await this.escposPrinter.printText(`${bill.businessName || 'QuickBill POS'}\n`, {});
      
      // Business details
      await this.escposPrinter.setFontSize(0); // Normal
      if (bill.businessAddress) {
        await this.escposPrinter.printText(`${bill.businessAddress}\n`, {});
      }
      if (bill.businessPhone) {
        await this.escposPrinter.printText(`Tel: ${bill.businessPhone}\n`, {});
      }
      if (bill.taxNumber) {
        await this.escposPrinter.printText(`Tax ID: ${bill.taxNumber}\n`, {});
      }

      // Separator
      await this.escposPrinter.printText('--------------------------------\n', {});
      
      // Bill info
      await this.escposPrinter.printerAlign(0); // Left
      await this.escposPrinter.printText(`Bill No: ${bill.billNumber}\n`, {});
      await this.escposPrinter.printText(`Date: ${new Date(bill.createdAt).toLocaleString()}\n`, {});
      
      if (bill.customerName) {
        await this.escposPrinter.printText(`Customer: ${bill.customerName}\n`, {});
      }
      if (bill.customerPhone) {
        await this.escposPrinter.printText(`Phone: ${bill.customerPhone}\n`, {});
      }

      // Items header
      await this.escposPrinter.printText('--------------------------------\n', {});
      await this.escposPrinter.printText('Item            Qty   Price  Amt\n', {});
      await this.escposPrinter.printText('--------------------------------\n', {});

      // Print items
      for (const item of bill.items) {
        const itemName = item.name.substring(0, 15).padEnd(15);
        const qty = item.quantity.toString().padStart(3);
        const price = item.price.toFixed(0).padStart(6);
        const amount = (item.quantity * item.price).toFixed(0).padStart(5);
        
        await this.escposPrinter.printText(`${itemName} ${qty} ${price} ${amount}\n`, {});
      }

      // Totals
      await this.escposPrinter.printText('--------------------------------\n', {});
      
      // Subtotal
      await this.escposPrinter.printText(`Subtotal:`.padEnd(26) + `${bill.subtotal.toFixed(2).padStart(6)}\n`, {});
      
      // Tax
      if (bill.tax > 0) {
        await this.escposPrinter.printText(`Tax (${bill.taxRate}%):`.padEnd(26) + `${bill.tax.toFixed(2).padStart(6)}\n`, {});
      }
      
      // Discount
      if (bill.discount > 0) {
        await this.escposPrinter.printText(`Discount:`.padEnd(26) + `-${bill.discount.toFixed(2).padStart(6)}\n`, {});
      }

      await this.escposPrinter.printText('--------------------------------\n', {});
      
      // Total
      await this.escposPrinter.setFontSize(1); // Large
      await this.escposPrinter.printText(`TOTAL:`.padEnd(20) + `₹${bill.total.toFixed(2).padStart(10)}\n`, {});
      await this.escposPrinter.setFontSize(0); // Normal

      // Payment method
      await this.escposPrinter.printText(`Payment: ${bill.paymentMethod || 'Cash'}\n`, {});
      
      // Footer
      await this.escposPrinter.printText('--------------------------------\n', {});
      await this.escposPrinter.printerAlign(1); // Center
      await this.escposPrinter.printText('Thank you for your business!\n', {});
      await this.escposPrinter.printText('Powered by QuickBill POS\n', {});

      // Feed and cut
      await this.escposPrinter.printText('\n\n\n', {});
      await this.escposPrinter.cutPaper();

    } catch (error) {
      console.error('Print error:', error);
      throw new Error('Failed to print bill');
    }
  }

  async testPrint(): Promise<void> {
    if (!this.escposPrinter) {
      throw new Error('Printer not available');
    }

    if (!this.currentPrinter) {
      throw new Error('No printer connected');
    }

    try {
      await this.escposPrinter.printerInit();
      await this.escposPrinter.printerAlign(1);
      await this.escposPrinter.setFontSize(1);
      await this.escposPrinter.printText('QuickBill POS\n', {});
      await this.escposPrinter.setFontSize(0);
      await this.escposPrinter.printText('Printer Test Successful\n', {});
      await this.escposPrinter.printText(`Connected to: ${this.currentPrinter.name}\n`, {});
      await this.escposPrinter.printText(`Address: ${this.currentPrinter.address}\n`, {});
      await this.escposPrinter.printText('--------------------------------\n', {});
      await this.escposPrinter.printText(`Date: ${new Date().toLocaleString()}\n`, {});
      await this.escposPrinter.printText('\n\n\n', {});
      await this.escposPrinter.cutPaper();
    } catch (error) {
      console.error('Test print error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const thermalPrinterService = new ThermalPrinterService();