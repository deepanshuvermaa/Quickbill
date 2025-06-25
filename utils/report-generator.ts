import { Platform, Share, Alert } from 'react-native';
import { Bill } from '@/types';

export interface ReportData {
  period: string;
  totalSales: number;
  transactionCount: number;
  bills: Bill[];
}

export interface BillWiseReportItem {
  billId: string;
  customerName: string;
  date: string;
  time: string;
  itemCount: number;
  total: number;
  paymentMethod: string;
}

export interface ItemWiseReportItem {
  itemName: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  category?: string;
}

// Generate Bill-wise Report
export const generateBillWiseReport = (bills: Bill[]): string => {
  const lineWidth = 58; // For standard receipt paper
  const divider = '-'.repeat(lineWidth);
  
  let output = '';
  
  // Header
  output += centerText('BILL-WISE SALES REPORT', lineWidth) + '\n';
  output += centerText(`Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`, lineWidth) + '\n';
  output += divider + '\n\n';
  
  // Summary
  const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);
  output += `Total Bills: ${bills.length}\n`;
  output += `Total Sales: Rs.${totalSales.toFixed(2)}\n`;
  output += `Average Bill: Rs.${bills.length > 0 ? (totalSales / bills.length).toFixed(2) : '0.00'}\n\n`;
  output += divider + '\n';
  
  // Bill details header
  output += 'BILL NO.'.padEnd(12) + 'CUSTOMER'.padEnd(18) + 'DATE'.padEnd(12) + 'AMOUNT'.padEnd(16) + '\n';
  output += divider + '\n';
  
  // Sort bills by date (newest first)
  const sortedBills = [...bills].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Bill details
  sortedBills.forEach((bill) => {
    const billNo = bill.id.substring(0, 8);
    const customer = truncate(bill.customerName, 17);
    const date = new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' });
    const amount = `Rs.${bill.total.toFixed(2)}`;
    
    output += billNo.padEnd(12) + customer.padEnd(18) + date.padEnd(12) + amount.padEnd(16) + '\n';
    
    // Show time and payment method on next line
    const time = new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const payment = bill.paymentMethod.replace('_', ' ').toUpperCase();
    output += ''.padEnd(12) + `${time} | ${payment}`.padEnd(30) + `${bill.items.length} items\n`;
    output += '\n';
  });
  
  output += divider + '\n';
  output += centerText('END OF REPORT', lineWidth) + '\n';
  
  return output;
};

// Generate Item-wise Report
export const generateItemWiseReport = (bills: Bill[]): string => {
  const lineWidth = 58;
  const divider = '-'.repeat(lineWidth);
  
  let output = '';
  
  // Header
  output += centerText('ITEM-WISE SALES REPORT', lineWidth) + '\n';
  output += centerText(`Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`, lineWidth) + '\n';
  output += divider + '\n\n';
  
  // Calculate item statistics
  const itemMap = new Map<string, ItemWiseReportItem>();
  
  bills.forEach(bill => {
    bill.items.forEach(item => {
      const existing = itemMap.get(item.id);
      if (existing) {
        itemMap.set(item.id, {
          itemName: item.name,
          quantitySold: existing.quantitySold + item.quantity,
          totalRevenue: existing.totalRevenue + (item.price * item.quantity),
          averagePrice: existing.averagePrice, // Will recalculate below
          category: item.category
        });
      } else {
        itemMap.set(item.id, {
          itemName: item.name,
          quantitySold: item.quantity,
          totalRevenue: item.price * item.quantity,
          averagePrice: item.price,
          category: item.category
        });
      }
    });
  });
  
  // Recalculate average prices
  itemMap.forEach((item, key) => {
    item.averagePrice = item.totalRevenue / item.quantitySold;
  });
  
  const itemsArray = Array.from(itemMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  // Summary
  const totalItems = itemsArray.reduce((sum, item) => sum + item.quantitySold, 0);
  const totalRevenue = itemsArray.reduce((sum, item) => sum + item.totalRevenue, 0);
  
  output += `Total Items Sold: ${totalItems}\n`;
  output += `Total Revenue: Rs.${totalRevenue.toFixed(2)}\n`;
  output += `Unique Products: ${itemsArray.length}\n\n`;
  output += divider + '\n';
  
  // Item details header - only item, qty, and revenue
  output += 'ITEM NAME'.padEnd(28) + 'QTY'.padEnd(10) + 'REVENUE'.padEnd(20) + '\n';
  output += divider + '\n';
  
  // Item details - ensure single line content
  itemsArray.forEach((item) => {
    const name = truncate(item.itemName, 27);
    const qty = item.quantitySold.toString();
    const revenue = `Rs.${item.totalRevenue.toFixed(2)}`;
    
    output += name.padEnd(28) + qty.padEnd(10) + revenue.padEnd(20) + '\n';
  });
  
  output += divider + '\n';
  output += centerText('END OF REPORT', lineWidth) + '\n';
  
  return output;
};

// Generate printable HTML report for web
export const generatePrintableHTMLReport = (reportData: string, title: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            margin: 0;
            font-size: 12px;
            line-height: 1.4;
            max-width: 600px;
            margin: 0 auto;
          }
          
          .report-content {
            white-space: pre-wrap;
            background: white;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          
          .print-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px 0;
            font-size: 14px;
          }
          
          .print-button:hover {
            background: #0056b3;
          }
          
          @media print {
            body {
              padding: 0;
              max-width: 100%;
            }
            
            .print-button {
              display: none;
            }
            
            .report-content {
              border: none;
              padding: 0;
              box-shadow: none;
            }
          }
          
          @page {
            size: A4;
            margin: 1cm;
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print Report</button>
        <div class="report-content">${reportData}</div>
        <button class="print-button" onclick="window.print()">Print Report</button>
      </body>
    </html>
  `;
};

// Share report function
export const shareReport = async (reportContent: string, title: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // For web, open in new window for printing
      const htmlContent = generatePrintableHTMLReport(reportContent, title);
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        Alert.alert(
          "Print Error",
          "Unable to open print window. Please check your browser settings and try again."
        );
        return false;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      return true;
    } else {
      // For mobile, use Share API
      const result = await Share.share({
        message: reportContent,
        title: title,
      });
      
      return result.action === Share.sharedAction;
    }
  } catch (error) {
    console.error('Error sharing report:', error);
    return false;
  }
};

// Utility functions
const centerText = (text: string, width: number): string => {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  return ' '.repeat(leftPad) + text;
};

const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Export functions for bill-wise and item-wise reports
export const exportBillWiseReport = async (bills: Bill[], period: string): Promise<boolean> => {
  const reportContent = generateBillWiseReport(bills);
  const title = `Bill-wise Sales Report - ${period}`;
  return await shareReport(reportContent, title);
};

export const exportItemWiseReport = async (bills: Bill[], period: string): Promise<boolean> => {
  const reportContent = generateItemWiseReport(bills);
  const title = `Item-wise Sales Report - ${period}`;
  return await shareReport(reportContent, title);
};