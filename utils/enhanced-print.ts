import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { Bill } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { printBillToPrinter } from './bluetooth-print';

export interface PrinterInfo {
  id: string;
  name: string;
  type: 'bluetooth' | 'wifi' | 'usb' | 'system';
  status: 'available' | 'connected' | 'offline';
  capabilities?: string[];
}

export interface PrintOptions {
  printerType?: 'bluetooth' | 'wifi' | 'system' | 'share';
  paperWidth?: '2inch' | '3inch';
  copies?: number;
  printer?: PrinterInfo;
}

// Enhanced print manager with multiple printer support
export class PrintManager {
  private static instance: PrintManager;
  private availablePrinters: PrinterInfo[] = [];

  static getInstance(): PrintManager {
    if (!PrintManager.instance) {
      PrintManager.instance = new PrintManager();
    }
    return PrintManager.instance;
  }

  // Discover all available printers
  async discoverPrinters(): Promise<PrinterInfo[]> {
    const printers: PrinterInfo[] = [];

    try {
      // 1. Check for system printers (web/desktop)
      if (Platform.OS === 'web') {
        printers.push({
          id: 'system_default',
          name: 'Default System Printer',
          type: 'system',
          status: 'available',
          capabilities: ['receipt', 'a4', 'color']
        });
      }

      // 2. Check for Bluetooth printers (existing functionality)
      try {
        const { scanForPrinters } = await import('./bluetooth-print');
        const bluetoothPrinters = await scanForPrinters();
        
        bluetoothPrinters.forEach(printer => {
          printers.push({
            id: printer.id,
            name: printer.name,
            type: 'bluetooth',
            status: 'available',
            capabilities: ['thermal', 'receipt']
          });
        });
      } catch (error) {
        console.log('Bluetooth printers not available:', error);
      }

      // 3. Check for WiFi/Network printers (placeholder for future implementation)
      // This would require additional network discovery libraries
      // printers.push(...await this.discoverNetworkPrinters());

      // 4. Always available - Share option
      printers.push({
        id: 'share_option',
        name: 'Share Receipt',
        type: 'system',
        status: 'available',
        capabilities: ['text', 'pdf']
      });

      this.availablePrinters = printers;
      return printers;
    } catch (error) {
      console.error('Error discovering printers:', error);
      return [];
    }
  }

  // Enhanced print function with multiple options
  async printBill(bill: Bill, options: PrintOptions = {}): Promise<boolean> {
    try {
      const {
        printerType = 'auto',
        paperWidth = '3inch',
        copies = 1,
        printer
      } = options;

      // Auto-detect best printing method if not specified
      if (printerType === 'auto') {
        return await this.autoPrint(bill, options);
      }

      // Print based on specified type
      switch (printerType) {
        case 'bluetooth':
          if (printer) {
            return await this.printBluetooth(bill, printer, options);
          }
          throw new Error('Bluetooth printer not specified');

        case 'system':
          return await this.printSystem(bill, options);

        case 'wifi':
          if (printer) {
            return await this.printWiFi(bill, printer, options);
          }
          throw new Error('WiFi printer not specified');

        case 'share':
          return await this.shareBill(bill, options);

        default:
          throw new Error(`Unsupported printer type: ${printerType}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Print Error', `Failed to print: ${error.message}`);
      return false;
    }
  }

  // Auto-detect and use best available printing method
  private async autoPrint(bill: Bill, options: PrintOptions): Promise<boolean> {
    // 1. Try primary printer from settings
    const settings = useSettingsStore.getState();
    if (settings.primaryPrinter) {
      try {
        return await this.printBluetooth(bill, settings.primaryPrinter as PrinterInfo, options);
      } catch (error) {
        console.log('Primary printer failed, trying alternatives');
      }
    }

    // 2. Try system printer if available
    if (Platform.OS === 'web') {
      try {
        return await this.printSystem(bill, options);
      } catch (error) {
        console.log('System printer failed');
      }
    }

    // 3. Fall back to share
    return await this.shareBill(bill, options);
  }

  // Bluetooth printing (enhanced existing functionality)
  private async printBluetooth(bill: Bill, printer: PrinterInfo, options: PrintOptions): Promise<boolean> {
    try {
      // Use existing bluetooth print functionality
      const result = await printBillToPrinter(bill, printer);
      return result;
    } catch (error) {
      console.error('Bluetooth print failed:', error);
      return false;
    }
  }

  // System/Web printing with proper formatting
  private async printSystem(bill: Bill, options: PrintOptions): Promise<boolean> {
    try {
      const html = this.generatePrintableHTML(bill, options.paperWidth);
      
      if (Platform.OS === 'web') {
        // Web platform - use window.print()
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
          return true;
        }
        return false;
      } else {
        // Mobile platform - use expo-print
        const { uri } = await Print.printAsync({
          html,
          width: options.paperWidth === '2inch' ? 384 : 576, // pixels for 2" or 3"
          height: 800,
        });
        return true;
      }
    } catch (error) {
      console.error('System print failed:', error);
      return false;
    }
  }

  // WiFi/Network printing (placeholder for future implementation)
  private async printWiFi(bill: Bill, printer: PrinterInfo, options: PrintOptions): Promise<boolean> {
    // This would require implementing network printer protocols
    // Such as IPP (Internet Printing Protocol) or raw socket printing
    console.log('WiFi printing not yet implemented');
    Alert.alert('Coming Soon', 'WiFi printing will be available in a future update');
    return false;
  }

  // Enhanced share functionality
  private async shareBill(bill: Bill, options: PrintOptions): Promise<boolean> {
    try {
      const { generateBillText } = await import('./print');
      const receiptText = generateBillText(bill, options.paperWidth || '3inch');
      
      // Create a more formatted version for sharing
      const shareContent = `📄 ${bill.customer?.name || 'Customer'} Receipt\n\n${receiptText}\n\n💼 Shared from QuickBill POS`;
      
      await shareAsync(shareContent, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Receipt',
      });
      
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }

  // Generate HTML for web/system printing
  private generatePrintableHTML(bill: Bill, paperWidth: '2inch' | '3inch' = '3inch'): string {
    const { generateBillText } = require('./print');
    const receiptText = generateBillText(bill, paperWidth);
    const settings = useSettingsStore.getState();
    
    const maxWidth = paperWidth === '2inch' ? '58mm' : '80mm';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${bill.id.substring(0, 8)}</title>
          <style>
            @page {
              size: ${maxWidth} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 5mm;
              width: ${maxWidth};
              background: white;
            }
            .receipt {
              white-space: pre-line;
              word-wrap: break-word;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">${receiptText.replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `;
  }

  // Show printer selection dialog
  async showPrinterSelection(bill: Bill): Promise<void> {
    const printers = await this.discoverPrinters();
    
    if (printers.length === 0) {
      Alert.alert('No Printers', 'No printers found. Receipt will be shared instead.');
      await this.shareBill(bill, {});
      return;
    }

    // This would typically show a modal/picker
    // For now, use the first available printer
    const printer = printers[0];
    await this.printBill(bill, { printer, printerType: printer.type as any });
  }

  // Get available printers
  getAvailablePrinters(): PrinterInfo[] {
    return this.availablePrinters;
  }
}

// Export singleton instance
export const printManager = PrintManager.getInstance();

// Convenience functions
export const printBillEnhanced = async (bill: Bill, options?: PrintOptions) => {
  return await printManager.printBill(bill, options);
};

export const discoverAllPrinters = async () => {
  return await printManager.discoverPrinters();
};

export const showPrinterSelection = async (bill: Bill) => {
  return await printManager.showPrinterSelection(bill);
};