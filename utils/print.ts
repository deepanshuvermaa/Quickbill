import { Platform, Alert, Share } from 'react-native';
import { Bill } from '@/types';

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
            <p>Time: ${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
            
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
    return text.substring(0, maxLength - 3) + '...';
  };
  
  // Format date and time properly
  const date = new Date(bill.createdAt);
  const dateStr = date.toLocaleDateString('en-IN');
  const timeStr = date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
  
  // Build header
  let output = '';
  output += centerText(businessName, lineWidth) + '\n';
  output += centerText(businessAddress, lineWidth) + '\n';
  
  if (bill.businessPhone) {
    output += centerText(`Phone: ${bill.businessPhone}`, lineWidth) + '\n';
  }
  
  if (bill.businessEmail) {
    output += centerText(bill.businessEmail, lineWidth) + '\n';
  }
  
  // Add GST/Tax ID if available
  if (bill.businessTaxId) {
    output += centerText(`GST: ${bill.businessTaxId}`, lineWidth) + '\n';
  }
  
  output += '\n';
  output += centerText('TAX INVOICE', lineWidth) + '\n';
  output += divider + '\n';
  
  // Date, time and invoice number on separate lines for clarity
  output += 'Date: ' + dateStr + '\n';
  output += 'Time: ' + timeStr + '\n';
  output += 'Invoice: ' + (bill.invoiceNumber ? bill.invoiceNumber.toUpperCase() : bill.id.substring(0, 8).toUpperCase()) + '\n';
  
  output += divider + '\n';
  
  // Customer info - centered
  output += centerText('Customer Details', lineWidth) + '\n';
  output += centerText(bill.customerName, lineWidth) + '\n';
  if (bill.customerPhone) {
    output += centerText(bill.customerPhone, lineWidth) + '\n';
  }
  
  output += divider + '\n';
  
  // Item header - simplified for better alignment
  if (format === '2inch') {
    // For 2-inch receipt (32 chars)
    output += 'Item'.padEnd(16) + 'Qty'.padEnd(4) + 'Price'.padEnd(6) + 'Total'.padEnd(6) + '\n';
  } else {
    // For 3-inch receipt (48 chars)
    output += 'Item'.padEnd(26) + 'Qty'.padEnd(6) + 'Price'.padEnd(8) + 'Total'.padEnd(8) + '\n';
  }
  
  output += divider + '\n';
  
  // Items - without Rs. prefix for cleaner look
  for (const item of bill.items) {
    if (format === '2inch') {
      const name = truncate(item.name, 15);
      const qty = item.quantity.toString();
      const price = item.price.toFixed(0);
      const total = (item.price * item.quantity).toFixed(0);
      
      output += name.padEnd(16) + 
                qty.padEnd(4) + 
                price.padEnd(6) + 
                total.padEnd(6) + '\n';
    } else {
      const name = truncate(item.name, 25);
      const qty = item.quantity.toString();
      const price = item.price.toFixed(0);
      const total = (item.price * item.quantity).toFixed(0);
      
      output += name.padEnd(26) + 
                qty.padEnd(6) + 
                price.padEnd(8) + 
                total.padEnd(8) + '\n';
    }
  }
  
  output += divider + '\n';
  
  // Totals section - cleaner formatting
  if (format === '2inch') {
    output += 'Sub Total:'.padEnd(20) + bill.subtotal.toFixed(2).padStart(12) + '\n';
    
    if (bill.discount > 0) {
      output += 'Discount:'.padEnd(20) + bill.discount.toFixed(2).padStart(12) + '\n';
    }
    
    if (bill.tax > 0) {
      const taxPercent = ((bill.tax / bill.subtotal) * 100).toFixed(0);
      output += `GST (${taxPercent}%):`.padEnd(20) + bill.tax.toFixed(2).padStart(12) + '\n';
    }
    
    output += divider + '\n';
    output += 'TOTAL:'.padEnd(20) + bill.total.toFixed(2).padStart(12) + '\n';
  } else {
    output += 'Sub Total:'.padEnd(32) + bill.subtotal.toFixed(2).padStart(16) + '\n';
    
    if (bill.discount > 0) {
      output += 'Discount:'.padEnd(32) + bill.discount.toFixed(2).padStart(16) + '\n';
    }
    
    if (bill.tax > 0) {
      const taxPercent = ((bill.tax / bill.subtotal) * 100).toFixed(0);
      output += `GST (${taxPercent}%):`.padEnd(32) + bill.tax.toFixed(2).padStart(16) + '\n';
    }
    
    output += divider + '\n';
    output += 'TOTAL:'.padEnd(32) + bill.total.toFixed(2).padStart(16) + '\n';
  }
  
  output += divider + '\n';
  
  // Payment method
  const formattedPaymentMethod = bill.paymentMethod
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  output += 'Payment: ' + formattedPaymentMethod + '\n';
  
  // Notes
  if (bill.notes) {
    output += divider + '\n';
    output += centerText('Notes', lineWidth) + '\n';
    output += bill.notes + '\n';
  }
  
  output += divider + '\n';
  
  // Footer
  output += centerText('Thank You!', lineWidth) + '\n';
  output += centerText('Visit Again', lineWidth) + '\n';
  
  return output;
};