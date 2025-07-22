import { Platform, Alert, Share } from 'react-native';
import { Bill } from '@/types';

// Helper function to format time without locale issues
const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const printOrShareBill = async (bill: Bill) => {
  try {
    // On web, we would normally use window.print()
    if (Platform.OS === 'web') {
      // Create a printable version of the bill
      const billText = generateBillText(bill);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        Alert.alert(
          "Print Error",
          "Unable to open print window. Please check your browser settings and try again."
        );
        return;
      }
      
      // Add content to the print window
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill #${bill.id.substring(0, 8)}</title>
            <style>
              body {
                font-family: monospace;
                padding: 20px;
                max-width: 400px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 10px 0;
              }
              .item-row {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
              }
              .total-row {
                font-weight: bold;
                margin-top: 10px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 14px;
              }
              @media print {
                body {
                  width: 100%;
                  max-width: 100%;
                }
                button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${bill.businessName || 'Your Business Name'}</h2>
              <p>${bill.businessAddress || 'Your Business Address'}</p>
              ${bill.businessPhone ? `<p>Phone: ${bill.businessPhone}</p>` : ''}
              ${bill.businessEmail ? `<p>Email: ${bill.businessEmail}</p>` : ''}
              ${bill.businessTaxId ? `<p>Tax ID: ${bill.businessTaxId}</p>` : ''}
            </div>
            
            <h3>${bill.invoiceNumber ? `INVOICE #${bill.invoiceNumber}` : `BILL #${bill.id.substring(0, 8)}`}</h3>
            <p>Date: ${new Date(bill.createdAt).toLocaleDateString()}</p>
            <p>Time: ${formatTime(new Date(bill.createdAt))}</p>
            
            <p>Customer: ${bill.customerName}</p>
            ${bill.customerPhone ? `<p>Phone: ${bill.customerPhone}</p>` : ''}
            
            <div class="divider"></div>
            
            <div class="item-row">
              <span style="width: 50%"><strong>Item</strong></span>
              <span style="width: 15%; text-align: center"><strong>Qty</strong></span>
              <span style="width: 15%; text-align: right"><strong>Price</strong></span>
              <span style="width: 20%; text-align: right"><strong>Total</strong></span>
            </div>
            
            <div class="divider"></div>
            
            ${bill.items.map(item => `
              <div class="item-row">
                <span style="width: 50%">${item.name}</span>
                <span style="width: 15%; text-align: center">${item.quantity}</span>
                <span style="width: 15%; text-align: right">Rs.${item.price.toFixed(2)}</span>
                <span style="width: 20%; text-align: right">Rs.${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            
            <div class="divider"></div>
            
            <div class="item-row">
              <span>Subtotal:</span>
              <span>Rs.${bill.subtotal.toFixed(2)}</span>
            </div>
            
            ${bill.discount > 0 ? `
              <div class="item-row">
                <span>Discount:</span>
                <span>-Rs.${bill.discount.toFixed(2)}</span>
              </div>
            ` : ''}
            
            ${bill.tax > 0 ? `
              <div class="item-row">
                <span>Tax:</span>
                <span>Rs.${bill.tax.toFixed(2)}</span>
              </div>
            ` : ''}
            
            <div class="divider"></div>
            
            <div class="item-row total-row">
              <span>TOTAL:</span>
              <span>Rs.${bill.total.toFixed(2)}</span>
            </div>
            
            <div class="divider"></div>
            
            <p>Payment Method: ${bill.paymentMethod.toUpperCase()}</p>
            
            ${bill.notes ? `<p>Notes: ${bill.notes}</p>` : ''}
            
            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <button onclick="window.print();" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                Print Bill
              </button>
            </div>
          </body>
        </html>
      `);
      
      // Focus the window
      printWindow.focus();
      
      return;
    }

    // For mobile, we'll use Share API as a fallback
    const message = generateBillText(bill);
    await Share.share({
      message,
      title: `Bill #${bill.id}`,
    });
  } catch (error) {
    console.error('Error sharing bill:', error);
    Alert.alert('Error', 'Failed to share bill. Please try again.');
  }
};

export const generateBillText = (bill: Bill, format: '2inch' | '3inch' = '2inch'): string => {
  // Format-specific settings
  const lineWidth = format === '2inch' ? 32 : 48;
  const doubleLine = '='.repeat(lineWidth);
  const singleLine = '-'.repeat(lineWidth);
  const divider = '-'.repeat(lineWidth);
  
  // Business header
  const businessName = bill.businessName || 'Your Business Name';
  const businessAddress = bill.businessAddress || 'Your Business Address';
  
  // Center align text
  const centerText = (text: string, width: number): string => {
    const padding = Math.max(0, width - text.length);
    const leftPad = Math.floor(padding / 2);
    return ' '.repeat(leftPad) + text;
  };
  
  // Right align text
  const rightAlign = (text: string, width: number): string => {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  };
  
  // Truncate text with ellipsis if too long
  const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };
  
  // Format date and time properly
  const date = new Date(bill.createdAt);
  const dateStr = date.toLocaleDateString('en-IN');
  
  // Format time manually to avoid locale issues with AM/PM
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeStr = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  
  // Build header with improved formatting
  let output = '';
  output += doubleLine + '\n';
  output += centerText(businessName.toUpperCase(), lineWidth) + '\n';
  output += centerText(businessAddress, lineWidth) + '\n';
  
  if (bill.businessPhone) {
    output += centerText(`Tel: ${bill.businessPhone}`, lineWidth) + '\n';
  }
  
  // Add GST/Tax ID if available
  if (bill.businessTaxId) {
    output += centerText(`GST: ${bill.businessTaxId}`, lineWidth) + '\n';
  }
  
  output += doubleLine + '\n\n';
  
  // Bill info and customer details in better format
  const billNo = bill.invoiceNumber || bill.id.substring(0, 8);
  if (format === '2inch') {
    output += `Bill: ${billNo}`.padEnd(17) + `Date: ${dateStr}\n`;
    output += ''.padEnd(17) + `Time: ${timeStr}\n`;
  } else {
    // 3-inch format - better spacing
    output += `Bill No: ${billNo}`.padEnd(30) + `Date: ${dateStr}\n`;
    output += ''.padEnd(30) + `Time: ${timeStr}\n`;
  }
  output += '\n';
  
  // Customer info abbreviated
  output += `Cust: ${bill.customerName}\n`;
  if (bill.customerPhone) {
    output += `Ph: ${bill.customerPhone}\n`;
  }
  
  output += '\n' + singleLine + '\n';
  
  // Item header with better formatting
  if (format === '2inch') {
    // For 2-inch receipt (32 chars)
    output += 'ITEM'.padEnd(14) + 'QTY'.padEnd(5) + 'RATE'.padEnd(7) + 'AMT'.padEnd(9) + '\n';
  } else {
    // For 3-inch receipt (48 chars)
    output += 'ITEM DESCRIPTION'.padEnd(24) + 'QTY'.padEnd(8) + 'RATE'.padEnd(8) + 'AMOUNT'.padEnd(8) + '\n';
  }
  
  output += singleLine + '\n';
  
  // Items without rupee symbol
  for (const item of bill.items) {
    // Simplify item name - remove units/brackets
    let itemName = item.name;
    itemName = itemName.replace(/\s*\([^)]*\)\s*/g, ''); // Remove content in brackets
    
    if (format === '2inch') {
      const name = truncate(itemName, 13).padEnd(12);
      const qty = item.quantity.toString().padStart(2);
      const price = item.price.toFixed(2).padStart(5);
      const total = (item.price * item.quantity).toFixed(2).padStart(6);
      
      output += name + qty + price + total + '\n';
    } else {
      // 3-inch format - more space for item names
      const name = truncate(itemName, 23).padEnd(24);
      const qty = item.quantity.toString().padStart(8);
      const price = item.price.toFixed(2).padStart(8);
      const total = (item.price * item.quantity).toFixed(2).padStart(8);
      
      output += name + qty + price + total + '\n';
    }
  }
  
  output += singleLine + '\n';
  
  // Calculate tax components if GST is configured
  const taxRate = bill.taxRate || 0;
  const cgstRate = taxRate / 2;
  const sgstRate = taxRate / 2;
  const cgstAmount = (bill.subtotal * cgstRate / 100);
  const sgstAmount = (bill.subtotal * sgstRate / 100);
  
  // Totals section without rupee symbol
  if (format === '2inch') {
    output += 'Subtotal:'.padEnd(25) + bill.subtotal.toFixed(2).padStart(7) + '\n';
    
    if (taxRate > 0) {
      output += `CGST(${cgstRate}%):`.padEnd(25) + cgstAmount.toFixed(2).padStart(7) + '\n';
      output += `SGST(${sgstRate}%):`.padEnd(25) + sgstAmount.toFixed(2).padStart(7) + '\n';
    }
    
    if (bill.discount > 0) {
      output += 'Discount:'.padEnd(25) + bill.discount.toFixed(2).padStart(7) + '\n';
    }
    
    output += ''.padEnd(24) + '--------\n';
    output += 'TOTAL:'.padEnd(25) + bill.total.toFixed(2).padStart(7) + '\n';
  } else {
    // 3-inch format - more spacing
    output += '\n';
    output += 'Subtotal:'.padEnd(40) + bill.subtotal.toFixed(2).padStart(8) + '\n';
    
    if (taxRate > 0) {
      output += `CGST (${cgstRate}%):`.padEnd(40) + cgstAmount.toFixed(2).padStart(8) + '\n';
      output += `SGST (${sgstRate}%):`.padEnd(40) + sgstAmount.toFixed(2).padStart(8) + '\n';
    }
    
    if (bill.discount > 0) {
      output += 'Discount:'.padEnd(40) + bill.discount.toFixed(2).padStart(8) + '\n';
    }
    
    output += ''.padEnd(39) + '---------\n';
    output += 'TOTAL:'.padEnd(40) + bill.total.toFixed(2).padStart(8) + '\n';
  }
  
  output += '\n';
  
  // Payment method
  const formattedPaymentMethod = bill.paymentMethod
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  output += `Payment: ${formattedPaymentMethod.toUpperCase()}\n`;
  
  // Notes
  if (bill.notes) {
    output += '\n' + singleLine + '\n';
    output += centerText('Notes', lineWidth) + '\n';
    output += bill.notes + '\n';
  }
  
  output += '\n' + doubleLine + '\n';
  
  // Footer
  output += centerText('Thank you for shopping!', lineWidth) + '\n';
  output += centerText('Powered by QuickBill', lineWidth) + '\n';
  output += doubleLine + '\n';
  
  return output;
};