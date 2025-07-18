import { Alert, Platform } from 'react-native';
import { 
  ensureBluetoothReady, 
  PrinterDevice, 
  printTextToPrinter,
  testPrinterConnection 
} from './bluetooth-print';
import { formatCurrency } from './helpers';

// Helper to format time with basic ASCII characters only
const formatTimeSimple = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes}${ampm}`;
};

export interface ReportPrintOptions {
  title: string;
  subtitle?: string;
  dateRange?: { start: Date; end: Date };
  sections: ReportSection[];
  footer?: string;
}

export interface ReportSection {
  title?: string;
  type: 'table' | 'summary' | 'text';
  data: any;
}

export const formatReportForPrinting = (options: ReportPrintOptions, format: '2inch' | '3inch' = '2inch'): string => {
  const lines: string[] = [];
  const width = format === '2inch' ? 32 : 48; // Different widths for different paper sizes
  
  // Helper to center text
  const centerText = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };
  
  // Helper to create a line
  const line = (char: string = '-') => char.repeat(width);
  
  // Header
  lines.push(centerText(options.title));
  if (options.subtitle) {
    lines.push(centerText(options.subtitle));
  }
  if (options.dateRange) {
    const dateStr = `${options.dateRange.start.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${options.dateRange.end.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    lines.push(centerText(dateStr));
  }
  lines.push(line());
  lines.push('');
  
  // Process sections
  options.sections.forEach((section, index) => {
    if (section.title) {
      lines.push(section.title);
      lines.push(line('-'));
    }
    
    switch (section.type) {
      case 'table':
        // Format table data
        if (Array.isArray(section.data) && section.data.length > 0) {
          // Assume first item has the structure
          const columns = Object.keys(section.data[0]);
          
          section.data.forEach((row: any) => {
            if (columns.length === 2) {
              // Two column layout
              const col1 = String(row[columns[0]] || '');
              const col2 = String(row[columns[1]] || '');
              const spacing = width - col1.length - col2.length;
              lines.push(col1 + ' '.repeat(Math.max(1, spacing)) + col2);
            } else {
              // Multi-column - stack vertically
              columns.forEach(col => {
                if (row[col] !== undefined && row[col] !== null) {
                  lines.push(`${col}: ${row[col]}`);
                }
              });
              lines.push('');
            }
          });
        }
        break;
        
      case 'summary':
        // Format summary data (key-value pairs)
        if (typeof section.data === 'object') {
          Object.entries(section.data).forEach(([key, value]) => {
            const formattedValue = typeof value === 'number' && key.toLowerCase().includes('amount') 
              ? formatCurrency(value) 
              : String(value);
            const spacing = width - key.length - formattedValue.length;
            lines.push(key + ' '.repeat(Math.max(1, spacing)) + formattedValue);
          });
        }
        break;
        
      case 'text':
        // Simple text
        lines.push(String(section.data));
        break;
    }
    
    if (index < options.sections.length - 1) {
      lines.push('');
    }
  });
  
  // Footer
  if (options.footer) {
    lines.push('');
    lines.push(line());
    lines.push(centerText(options.footer));
  }
  
  // Print timestamp
  lines.push('');
  lines.push(line());
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = formatTimeSimple(now);
  lines.push(centerText(`${dateStr} ${timeStr}`));
  
  return lines.join('\n');
};

export const printReportToBluetooth = async (
  report: ReportPrintOptions,
  primaryPrinter?: { id: string; name: string; address: string },
  onSelectPrinter?: () => void,
  format: '2inch' | '3inch' = '2inch'
) => {
  try {
    const bluetoothReady = await ensureBluetoothReady();
    if (!bluetoothReady) {
      Alert.alert('Bluetooth Required', 'Please enable Bluetooth to print reports.');
      return false;
    }
    
    const reportText = formatReportForPrinting(report, format);
    
    // Check if there's a primary printer set
    if (primaryPrinter) {
      const connectionWorking = await testPrinterConnection();
      
      if (connectionWorking) {
        try {
          await printTextToPrinter(reportText, {
            id: primaryPrinter.address,
            name: primaryPrinter.name,
            address: primaryPrinter.address,
            paired: true,
            connected: true,
            type: 'thermal',
            paperWidth: '58mm'
          });
          Alert.alert('Success', `Report sent to ${primaryPrinter.name} successfully`);
          return true;
        } catch (error) {
          // Connection failed, show printer selection
          if (onSelectPrinter) {
            onSelectPrinter();
          }
          return false;
        }
      } else {
        // Connection test failed, show printer selection
        if (onSelectPrinter) {
          onSelectPrinter();
        }
        return false;
      }
    } else {
      // No primary printer, show selection
      if (onSelectPrinter) {
        onSelectPrinter();
      }
      return false;
    }
  } catch (error) {
    console.error('Print error:', error);
    Alert.alert('Error', 'Failed to print report');
    return false;
  }
};

// Specific report formatters
export const formatSalesReport = (data: any, format: '2inch' | '3inch' = '2inch'): ReportPrintOptions => {
  return {
    title: 'SALES REPORT',
    subtitle: data.businessName || 'QuickBill',
    dateRange: data.dateRange,
    sections: [
      {
        title: 'Sales Summary',
        type: 'summary',
        data: {
          'Total Sales': data.totalSales || 0,
          'Total Orders': data.totalOrders || 0,
          'Avg Order Value': data.avgOrderValue || 0,
          'Total Tax': data.totalTax || 0,
          'Total Discount': data.totalDiscount || 0,
        }
      },
      data.topProducts && {
        title: 'Top Products',
        type: 'table',
        data: data.topProducts.slice(0, 5).map((p: any) => ({
          Product: p.name,
          Qty: `${p.quantity} @ ${formatCurrency(p.revenue)}`
        }))
      },
      data.paymentBreakdown && {
        title: 'Payment Methods',
        type: 'summary',
        data: data.paymentBreakdown
      }
    ].filter(Boolean),
    footer: 'QuickBill POS'
  };
};

export const formatInventoryReport = (data: any, format: '2inch' | '3inch' = '2inch'): ReportPrintOptions => {
  const lineWidth = format === '2inch' ? 32 : 48;
  const divider = '='.repeat(lineWidth);
  const subDivider = '-'.repeat(lineWidth);
  
  let reportText = '';
  
  // Header - matching bill-wise format
  reportText += divider + '\n';
  reportText += centerText('INVENTORY REPORT', lineWidth) + '\n';
  const now = new Date();
  const date = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = formatTimeSimple(now);
  reportText += centerText(`${date} ${time}`, lineWidth) + '\n';
  reportText += divider + '\n\n';
  
  // Summary section
  reportText += `Total Items: ${data.totalItems || 0}\n`;
  reportText += `Total Stock: ${data.totalStock || 0} units\n`;
  reportText += `Total Value: Rs. ${(data.totalValue || 0).toFixed(2)}\n`;
  reportText += `Low Stock Items: ${data.lowStockCount || 0}\n`;
  reportText += `Out of Stock: ${data.outOfStockCount || 0}\n\n`;
  
  // Category breakdown if available
  if (data.items && data.items.length > 0) {
    const categories = new Map<string, { items: number; stock: number; value: number }>();
    data.items.forEach((item: any) => {
      const category = item.category || 'Uncategorized';
      if (!categories.has(category)) {
        categories.set(category, { items: 0, stock: 0, value: 0 });
      }
      const cat = categories.get(category)!;
      cat.items += 1;
      cat.stock += item.stock || 0;
      cat.value += (item.stock || 0) * item.price;
    });
    
    reportText += 'STOCK BY CATEGORY:\n';
    categories.forEach((stats, category) => {
      const percentage = ((stats.value / (data.totalValue || 1)) * 100).toFixed(1);
      reportText += `${category}: ${stats.items} items, ${stats.stock} units (${percentage}%)\n`;
    });
    reportText += '\n' + divider + '\n';
    
    // Item details header
    if (format === '2inch') {
      // exactly 32 chars
      reportText += 'ITEM         PRICE QTY    VALUE\n';
    } else {
      // 48 chars - more space
      reportText += 'ITEM NAME                PRICE   QTY      VALUE\n';
    }
    reportText += subDivider + '\n';
    
    // Sort items by value (highest first)
    const sortedItems = [...data.items].sort((a, b) => {
      const valueA = (a.stock || 0) * a.price;
      const valueB = (b.stock || 0) * b.price;
      return valueB - valueA;
    });
    
    // Item details
    sortedItems.forEach((item: any) => {
      if (format === '2inch') {
        // exactly 32 chars per line
        const name = item.name.length > 13 ? item.name.substring(0, 12) + '.' : item.name;
        const price = item.price.toFixed(0);
        const qty = (item.stock || 0).toString();
        const value = ((item.stock || 0) * item.price).toFixed(0);
        
        // Build line ensuring exactly 32 chars
        let line = name.padEnd(13);          // 13 chars for name
        line += price.padStart(6);            // 6 chars for price  
        line += ' ';                          // 1 space
        line += qty.padStart(3);              // 3 chars for qty
        line += ' ';                          // 1 space
        line += value.padStart(8);            // 8 chars for value
        // Total: 13 + 6 + 1 + 3 + 1 + 8 = 32 chars exactly
        
        reportText += line + '\n';
      } else {
        // 48 chars - more details
        const name = item.name.length > 24 ? item.name.substring(0, 23) + '.' : item.name;
        const price = item.price.toFixed(2);
        const qty = (item.stock || 0).toString();
        const value = ((item.stock || 0) * item.price).toFixed(2);
        
        let line = name.padEnd(25);          // 25 chars for name
        line += price.padStart(7);           // 7 chars for price
        line += ' ';                         // 1 space
        line += qty.padStart(5);             // 5 chars for qty
        line += ' ';                         // 1 space
        line += value.padStart(9);           // 9 chars for value
        // Total: 25 + 7 + 1 + 5 + 1 + 9 = 48 chars exactly
        
        reportText += line + '\n';
      }
    });
    
    // Total line
    reportText += subDivider + '\n';
    const totalQty = data.totalStock || 0;
    const totalValue = (data.totalValue || 0).toFixed(format === '2inch' ? 0 : 2);
    
    if (format === '2inch') {
      // Build total line - exactly 32 chars
      let totalLine = 'TOTAL:'.padEnd(19);  // 19 chars (13 + 6 for item/price columns)
      totalLine += ' ';                      // 1 space
      totalLine += totalQty.toString().padStart(3);  // 3 chars for qty
      totalLine += ' ';                      // 1 space  
      totalLine += totalValue.padStart(8);   // 8 chars for value
      // Total: 19 + 1 + 3 + 1 + 8 = 32 chars exactly
      
      reportText += totalLine + '\n';
    } else {
      // Build total line - exactly 48 chars
      let totalLine = 'TOTAL:'.padEnd(32);  // 32 chars (25 + 7 for item/price columns)
      totalLine += ' ';                      // 1 space
      totalLine += totalQty.toString().padStart(5);  // 5 chars for qty
      totalLine += ' ';                      // 1 space  
      totalLine += totalValue.padStart(9);   // 9 chars for value
      // Total: 32 + 1 + 5 + 1 + 9 = 48 chars exactly
      
      reportText += totalLine + '\n';
    }
  }
  
  reportText += divider + '\n';
  reportText += centerText('END OF REPORT', lineWidth) + '\n';
  
  // Helper to center text
  function centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }
  
  return {
    title: '',
    sections: [{
      type: 'text',
      data: reportText
    }],
    footer: ''
  };
};

export const formatExpenseReport = (data: any, format: '2inch' | '3inch' = '2inch'): ReportPrintOptions => {
  return {
    title: 'EXPENSE REPORT',
    subtitle: data.businessName || 'QuickBill',
    dateRange: data.dateRange,
    sections: [
      {
        title: 'Expense Summary',
        type: 'summary',
        data: {
          'Total Expenses': data.totalExpenses || 0,
          'Total Entries': data.totalEntries || 0,
          'Avg Expense': data.avgExpense || 0,
        }
      },
      data.categoryBreakdown && {
        title: 'By Category',
        type: 'table',
        data: Object.entries(data.categoryBreakdown).map(([cat, amount]: any) => ({
          Category: cat,
          Amount: formatCurrency(amount)
        }))
      },
      data.topExpenses && {
        title: 'Top Expenses',
        type: 'table',
        data: data.topExpenses.slice(0, 5).map((exp: any) => ({
          Description: exp.description.substring(0, 20),
          Amount: formatCurrency(exp.amount)
        }))
      }
    ].filter(Boolean),
    footer: 'QuickBill POS'
  };
};

export const formatProfitLossReport = (data: any, format: '2inch' | '3inch' = '2inch'): ReportPrintOptions => {
  const netProfit = (data.totalRevenue || 0) - (data.totalExpenses || 0);
  const profitMargin = data.totalRevenue > 0 ? (netProfit / data.totalRevenue * 100).toFixed(1) : '0';
  
  return {
    title: 'PROFIT & LOSS',
    subtitle: data.businessName || 'QuickBill',
    dateRange: data.dateRange,
    sections: [
      {
        type: 'summary',
        data: {
          'Total Revenue': data.totalRevenue || 0,
          'Total Expenses': data.totalExpenses || 0,
          [netProfit >= 0 ? 'Net Profit' : 'Net Loss']: Math.abs(netProfit),
          'Profit Margin': `${profitMargin}%`
        }
      },
      data.revenueBreakdown && {
        title: 'Revenue Breakdown',
        type: 'summary',
        data: data.revenueBreakdown
      },
      data.expenseBreakdown && {
        title: 'Expense Breakdown',
        type: 'summary',
        data: data.expenseBreakdown
      }
    ].filter(Boolean),
    footer: 'QuickBill POS'
  };
};