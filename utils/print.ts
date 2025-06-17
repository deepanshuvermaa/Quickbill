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
            
            <h3>BILL #${bill.id.substring(0, 8)}</h3>
            <p>Date: ${new Date(bill.createdAt).toLocaleDateString()}</p>
            <p>Time: ${new Date(bill.createdAt).toLocaleTimeString()}</p>
            
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
                <span style="width: 15%; text-align: right">₹${item.price.toFixed(2)}</span>
                <span style="width: 20%; text-align: right">₹${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            
            <div class="divider"></div>
            
            <div class="item-row">
              <span>Subtotal:</span>
              <span>₹${bill.subtotal.toFixed(2)}</span>
            </div>
            
            ${bill.discount > 0 ? `
              <div class="item-row">
                <span>Discount:</span>
                <span>-₹${bill.discount.toFixed(2)}</span>
              </div>
            ` : ''}
            
            ${bill.tax > 0 ? `
              <div class="item-row">
                <span>Tax:</span>
                <span>₹${bill.tax.toFixed(2)}</span>
              </div>
            ` : ''}
            
            <div class="divider"></div>
            
            <div class="item-row total-row">
              <span>TOTAL:</span>
              <span>₹${bill.total.toFixed(2)}</span>
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
  
  // Format date
  const date = new Date(bill.createdAt);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
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
  
  output += '\n';
  output += centerText('INVOICE', lineWidth) + '\n\n';
  
  // Date and invoice number
  output += `${dateStr} ${timeStr}`.padEnd(lineWidth / 2) + 
            `Invoice: ${bill.id.substring(0, 8)}`.padStart(lineWidth / 2) + '\n';
  
  output += divider + '\n';
  
  // Customer info
  output += `${bill.customerName}\n`;
  if (bill.customerPhone) {
    output += `Contact: ${bill.customerPhone}\n`;
  }
  
  output += divider + '\n';
  
  // Item header
  if (format === '2inch') {
    // For 2-inch receipt (32 chars)
    // Item    Qty  Price  Total
    // 12      4    7      9
    output += 'Item'.padEnd(12) + 'Qty'.padEnd(4) + 'Price'.padEnd(7) + 'Total'.padEnd(9) + '\n';
  } else {
    // For 3-inch receipt (48 chars)
    // Item              Qty   Price   Total
    // 20                5     10      13
    output += 'Item'.padEnd(20) + 'Qty'.padEnd(5) + 'Price'.padEnd(10) + 'Total'.padEnd(13) + '\n';
  }
  
  output += divider + '\n';
  
  // Items
  for (const item of bill.items) {
    if (format === '2inch') {
      const name = truncate(item.name, 11);
      const qty = item.quantity.toString();
      const price = `₹${item.price.toFixed(2)}`;
      const total = `₹${(item.price * item.quantity).toFixed(2)}`;
      
      output += name.padEnd(12) + 
                qty.padEnd(4) + 
                price.padEnd(7) + 
                total.padEnd(9) + '\n';
    } else {
      const name = truncate(item.name, 19);
      const qty = item.quantity.toString();
      const price = `₹${item.price.toFixed(2)}`;
      const total = `₹${(item.price * item.quantity).toFixed(2)}`;
      
      output += name.padEnd(20) + 
                qty.padEnd(5) + 
                price.padEnd(10) + 
                total.padEnd(13) + '\n';
    }
  }
  
  output += divider + '\n';
  
  // Totals
  if (format === '2inch') {
    output += 'Items: ' + bill.items.length + '\n\n';
    
    output += 'Sub Total'.padEnd(22) + `₹${bill.subtotal.toFixed(2)}`.padStart(10) + '\n';
    
    if (bill.discount > 0) {
      output += 'Discount'.padEnd(22) + `₹${bill.discount.toFixed(2)}`.padStart(10) + '\n';
    }
    
    if (bill.tax > 0) {
      output += 'Tax'.padEnd(22) + `₹${bill.tax.toFixed(2)}`.padStart(10) + '\n';
    }
    
    output += divider + '\n';
    
    output += 'Total'.padEnd(22) + `₹${bill.total.toFixed(2)}`.padStart(10) + '\n';
  } else {
    output += 'Items: ' + bill.items.length + '\n\n';
    
    output += 'Sub Total'.padEnd(38) + `₹${bill.subtotal.toFixed(2)}`.padStart(10) + '\n';
    
    if (bill.discount > 0) {
      output += 'Discount'.padEnd(38) + `₹${bill.discount.toFixed(2)}`.padStart(10) + '\n';
    }
    
    if (bill.tax > 0) {
      output += 'Tax'.padEnd(38) + `₹${bill.tax.toFixed(2)}`.padStart(10) + '\n';
    }
    
    output += divider + '\n';
    
    output += 'Total'.padEnd(38) + `₹${bill.total.toFixed(2)}`.padStart(10) + '\n';
  }
  
  output += divider + '\n';
  
  // Payment method
  output += centerText('Payment Mode', lineWidth) + '\n';
  
  // Format payment method (replace underscores with spaces and capitalize)
  const formattedPaymentMethod = bill.paymentMethod
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  output += centerText(`${formattedPaymentMethod}: ₹${bill.total.toFixed(2)}`, lineWidth) + '\n';
  
  output += divider + '\n';
  
  // Notes
  if (bill.notes) {
    output += `Notes: ${bill.notes}\n\n`;
  }
  
  // Footer
  output += centerText('Thank You', lineWidth) + '\n';
  
  return output;
};