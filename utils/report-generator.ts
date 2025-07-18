import { Platform, Share, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Bill } from '@/types';

// Helper to format time with basic ASCII characters only
const formatTimeSimple = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes}${ampm}`;
};

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
export const generateBillWiseReport = (bills: Bill[], format: '2inch' | '3inch' = '2inch'): string => {
  const lineWidth = format === '2inch' ? 32 : 48; // Different widths for different paper sizes
  const divider = '='.repeat(lineWidth);
  const subDivider = '-'.repeat(lineWidth);
  
  let output = '';
  
  // Header - no left margin
  output += divider + '\n';
  output += centerText('BILL-WISE SALES REPORT', lineWidth) + '\n';
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' });
  const time = formatTimeSimple(new Date());
  output += centerText(`${date} ${time}`, lineWidth) + '\n';
  output += divider + '\n\n';
  
  // Summary
  const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);
  output += `Total Bills: ${bills.length}\n`;
  output += `Total Sales: Rs. ${totalSales.toFixed(2)}\n`;
  output += `Average Bill: Rs. ${bills.length > 0 ? (totalSales / bills.length).toFixed(2) : '0.00'}\n\n`;
  
  // Payment method summary
  const paymentSummary = bills.reduce((acc, bill) => {
    const method = bill.paymentMethod.replace('_', ' ').charAt(0).toUpperCase() + bill.paymentMethod.replace('_', ' ').slice(1);
    acc[method] = (acc[method] || 0) + bill.total;
    return acc;
  }, {} as Record<string, number>);
  
  output += 'SALES BY PAYMENT METHOD:\n';
  Object.entries(paymentSummary).forEach(([method, total]) => {
    const percentage = ((total / totalSales) * 100).toFixed(1);
    output += `${method}: Rs. ${total.toFixed(2)} (${percentage}%)\n`;
  });
  output += '\n' + divider + '\n';
  
  // Bill details header
  if (format === '2inch') {
    // 32 char width
    output += 'BILLNO   DATE    CUST      AMT\n';
  } else {
    // 48 char width - more space for details
    output += 'BILL NO      DATE       CUSTOMER           AMOUNT\n';
  }
  output += subDivider + '\n';
  
  // Sort bills by date (newest first)
  const sortedBills = [...bills].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Bill details
  sortedBills.forEach((bill) => {
    if (format === '2inch') {
      // 32 char format
      const billNo = (bill.invoiceNumber || bill.billNumber || bill.id.substring(0, 7)).substring(0, 7).padEnd(9);
      const date = new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }).padEnd(7);
      const customer = truncate(bill.customerName || 'Walk-in', 8).padEnd(9);
      const amount = bill.total.toFixed(0).padStart(4);
      
      output += billNo + date + customer + amount + '\n';
    } else {
      // 48 char format - more details
      const billNo = (bill.invoiceNumber || bill.billNumber || bill.id.substring(0, 10)).padEnd(13);
      const date = new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }).padEnd(11);
      const customer = truncate(bill.customerName || 'Walk-in', 16).padEnd(17);
      const amount = bill.total.toFixed(2).padStart(7);
      
      output += billNo + date + customer + amount + '\n';
    }
  });
  
  // Total line
  output += subDivider + '\n';
  if (format === '2inch') {
    output += ''.padEnd(7) + 'TOTAL:' + totalSales.toFixed(0).padStart(9) + '\n';
  } else {
    output += ''.padEnd(24) + 'TOTAL:' + totalSales.toFixed(2).padStart(16) + '\n';
  }
  output += divider + '\n';
  output += centerText('END OF REPORT', lineWidth) + '\n';
  
  return output;
};

// Generate Item-wise Report
export const generateItemWiseReport = (bills: Bill[], format: '2inch' | '3inch' = '2inch'): string => {
  const lineWidth = format === '2inch' ? 32 : 48; // Different widths for different paper sizes
  const divider = '='.repeat(lineWidth);
  const subDivider = '-'.repeat(lineWidth);
  
  let output = '';
  
  // Header - no left margin
  output += divider + '\n';
  output += centerText('ITEM-WISE SALES REPORT', lineWidth) + '\n';
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = formatTimeSimple(new Date());
  output += centerText(`${date} ${time}`, lineWidth) + '\n';
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
  itemMap.forEach((item) => {
    item.averagePrice = item.totalRevenue / item.quantitySold;
  });
  
  const itemsArray = Array.from(itemMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  // Summary
  const totalItems = itemsArray.reduce((sum, item) => sum + item.quantitySold, 0);
  const totalRevenue = itemsArray.reduce((sum, item) => sum + item.totalRevenue, 0);
  
  output += `Total Items Sold: ${totalItems}\n`;
  output += `Total Revenue: Rs. ${totalRevenue.toFixed(2)}\n`;
  output += `Unique Products: ${itemsArray.length}\n\n`;
  output += divider + '\n';
  
  // Item details header
  if (format === '2inch') {
    // 32 char width
    output += 'ITEM NAME       QTY    REVENUE\n';
  } else {
    // 48 char width - more space
    output += 'ITEM NAME                   QTY      REVENUE\n';
  }
  output += subDivider + '\n';
  
  // Item details
  itemsArray.forEach((item) => {
    if (format === '2inch') {
      // 32 char format
      const name = truncate(item.itemName, 14).padEnd(16);
      const qty = item.quantitySold.toString().padStart(4);
      const revenue = item.totalRevenue.toFixed(0).padStart(9);
      
      output += name + qty + revenue + '\n';
    } else {
      // 48 char format - more details
      const name = truncate(item.itemName, 26).padEnd(28);
      const qty = item.quantitySold.toString().padStart(7);
      const revenue = item.totalRevenue.toFixed(2).padStart(13);
      
      output += name + qty + revenue + '\n';
    }
  });
  
  output += '\n' + divider + '\n';
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
      
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.focus(), 100);
      
      return true;
    } else {
      // For mobile, try to use Print first, then fall back to Share
      try {
        // Generate HTML for printing
        const htmlContent = generatePrintableHTMLReport(reportContent, title);
        
        // Print to PDF
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        
        // Check if sharing is available
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: title,
          });
          return true;
        } else {
          // Fall back to text sharing
          const result = await Share.share({
            message: reportContent,
            title: title,
          });
          return result.action === Share.sharedAction;
        }
      } catch (printError) {
        console.log('Print failed, falling back to text share:', printError);
        // Fall back to text sharing
        const result = await Share.share({
          message: reportContent,
          title: title,
        });
        return result.action === Share.sharedAction;
      }
    }
  } catch (error) {
    console.error('Error sharing report:', error);
    Alert.alert(
      "Export Error",
      "Failed to export report. Please try again."
    );
    return false;
  }
};

// Utility functions
const centerText = (text: string, width: number): string => {
  const cleanText = text.replace(/\u202F/g, ''); // Remove non-breaking space
  const padding = Math.max(0, width - cleanText.length);
  const leftPad = Math.floor(padding / 2);
  return ' '.repeat(leftPad) + cleanText;
};

const truncate = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Export functions for bill-wise and item-wise reports
export const exportBillWiseReport = async (bills: Bill[], period: string, format: '2inch' | '3inch' = '2inch'): Promise<boolean> => {
  const reportContent = generateBillWiseReport(bills, format);
  const title = `Bill-wise Sales Report - ${period}`;
  return await shareReport(reportContent, title);
};

export const exportItemWiseReport = async (bills: Bill[], period: string, format: '2inch' | '3inch' = '2inch'): Promise<boolean> => {
  const reportContent = generateItemWiseReport(bills, format);
  const title = `Item-wise Sales Report - ${period}`;
  return await shareReport(reportContent, title);
};

// Generate Profit & Loss Report
export const generateProfitLossReport = (
  totalSales: number,
  totalExpenses: number,
  bills: Bill[],
  expenses: any[],
  period: string,
  format: '2inch' | '3inch' = '2inch'
): string => {
  const lineWidth = format === '2inch' ? 32 : 48; // Different widths for different paper sizes
  const divider = '='.repeat(lineWidth);
  const subDivider = '-'.repeat(lineWidth);
  
  let output = '';
  
  // Header - no left margin
  output += divider + '\n';
  output += centerText('PROFIT & LOSS REPORT', lineWidth) + '\n';
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = formatTimeSimple(new Date());
  output += centerText(`${date} ${time}`, lineWidth) + '\n';
  output += centerText(`Period: ${period}`, lineWidth) + '\n';
  output += divider + '\n\n';
  
  // Summary
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
  
  output += 'SUMMARY:\n';
  output += `Total Revenue: Rs. ${totalSales.toFixed(2)}\n`;
  output += `Total Expenses: Rs. ${totalExpenses.toFixed(2)}\n`;
  output += subDivider + '\n';
  output += `Net Profit: Rs. ${netProfit.toFixed(2)}\n`;
  output += `Profit Margin: ${profitMargin.toFixed(2)}%\n\n`;
  output += divider + '\n\n';
  
  // Revenue breakdown
  output += centerText('REVENUE BREAKDOWN', lineWidth) + '\n';
  output += subDivider + '\n';
  output += `Total Bills: ${bills.length}\n`;
  output += `Average Bill Value: Rs. ${bills.length > 0 ? (totalSales / bills.length).toFixed(2) : '0.00'}\n\n`;
  
  // Payment method breakdown for revenue
  const paymentSummary = bills.reduce((acc, bill) => {
    const method = bill.paymentMethod.replace('_', ' ').charAt(0).toUpperCase() + bill.paymentMethod.replace('_', ' ').slice(1);
    acc[method] = (acc[method] || 0) + bill.total;
    return acc;
  }, {} as Record<string, number>);
  
  output += 'Revenue by Payment Method:\n';
  Object.entries(paymentSummary).forEach(([method, total]) => {
    const percentage = ((total / totalSales) * 100).toFixed(1);
    output += `  ${method}: Rs. ${total.toFixed(2)} (${percentage}%)\n`;
  });
  
  output += '\n' + divider + '\n\n';
  
  // Expense breakdown
  output += centerText('EXPENSE BREAKDOWN', lineWidth) + '\n';
  output += subDivider + '\n';
  output += `Total Expenses: ${expenses.length}\n`;
  output += `Average Expense: Rs. ${expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}\n\n`;
  
  // Category-wise expenses
  const categoryExpenses = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  output += 'Expenses by Category:\n';
  Object.entries(categoryExpenses).forEach(([category, total]) => {
    const percentage = ((total / totalExpenses) * 100).toFixed(1);
    output += `  ${category}: Rs. ${total.toFixed(2)} (${percentage}%)\n`;
  });
  
  output += '\n' + divider + '\n';
  output += centerText('END OF REPORT', lineWidth) + '\n';
  
  return output;
};

// Export Profit & Loss Report
export const exportProfitLossReport = async (
  totalSales: number,
  totalExpenses: number,
  bills: Bill[],
  expenses: any[],
  period: string,
  format: '2inch' | '3inch' = '2inch'
): Promise<boolean> => {
  try {
    const reportContent = generateProfitLossReport(totalSales, totalExpenses, bills, expenses, period, format);
    const title = `Profit & Loss Report - ${period}`;
    
    // For mobile thermal printer, try direct print first
    if (Platform.OS !== 'web') {
      try {
        // Try to print directly for thermal printer
        await Print.printAsync({
          html: `<pre style="font-family: monospace; font-size: 12px; margin: 0; padding: 0;">${reportContent}</pre>`,
        });
        return true;
      } catch (printError) {
        console.log('Direct print failed, trying share:', printError);
      }
    }
    
    // Fall back to share functionality
    return await shareReport(reportContent, title);
  } catch (error) {
    console.error('Error in exportProfitLossReport:', error);
    Alert.alert(
      "Export Error",
      "Failed to export Profit & Loss report. Please try again."
    );
    return false;
  }
};