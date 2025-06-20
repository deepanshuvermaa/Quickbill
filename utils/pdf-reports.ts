import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Bill } from '@/types';

export interface SalesReportData {
  period: string;
  totalSales: number;
  averageSale: number;
  transactionCount: number;
  bills: Bill[];
  topSellingItems: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    total: number;
  }>;
}

export const generateSalesReportHTML = (data: SalesReportData): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Sales Report - ${data.period}</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 5px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 14px;
        }
        .report-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 20px 0 10px 0;
        }
        .report-period {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .report-date {
          font-size: 14px;
          color: #9ca3af;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .summary-card {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
        }
        .section {
          margin: 30px 0;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 15px;
          border-left: 4px solid #3b82f6;
          padding-left: 15px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .table th {
          background-color: #f3f4f6;
          color: #374151;
          font-weight: 600;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #e5e7eb;
        }
        .table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .table tr:hover {
          background-color: #f9fafb;
        }
        .amount {
          font-weight: 600;
          color: #059669;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .no-data {
          text-align: center;
          color: #9ca3af;
          font-style: italic;
          padding: 20px;
        }
        @media print {
          body { background-color: white; }
          .container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">QuickBill POS</div>
          <div class="subtitle">Point of Sale System</div>
          <div class="report-title">Sales Report</div>
          <div class="report-period">${data.period}</div>
          <div class="report-date">Generated on ${currentDate}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Sales</div>
            <div class="summary-value">₹${data.totalSales.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Average Sale</div>
            <div class="summary-value">₹${data.averageSale.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Transactions</div>
            <div class="summary-value">${data.transactionCount}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Top Selling Items</div>
          ${data.topSellingItems.length === 0 ? 
            '<div class="no-data">No sales data available</div>' :
            `<table class="table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity Sold</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.topSellingItems.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td class="amount">₹${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
          }
        </div>

        <div class="section">
          <div class="section-title">Sales by Payment Method</div>
          ${data.salesByPaymentMethod.length === 0 ?
            '<div class="no-data">No payment data available</div>' :
            `<table class="table">
              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>Total Amount</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${data.salesByPaymentMethod.map(payment => `
                  <tr>
                    <td>${payment.method}</td>
                    <td class="amount">₹${payment.total.toFixed(2)}</td>
                    <td>${((payment.total / data.totalSales) * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
          }
        </div>

        <div class="section">
          <div class="section-title">Recent Transactions</div>
          ${data.bills.length === 0 ?
            '<div class="no-data">No transactions available</div>' :
            `<table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment Method</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.bills
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map(bill => `
                    <tr>
                      <td>${new Date(bill.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</td>
                      <td>${bill.customerName}</td>
                      <td>${bill.items.length} items</td>
                      <td>${bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1).replace('_', ' ')}</td>
                      <td class="amount">₹${bill.total.toFixed(2)}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>`
          }
        </div>

        <div class="footer">
          <p>This report was generated automatically by QuickBill POS</p>
          <p>For support, contact your system administrator</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const exportSalesReportToPDF = async (data: SalesReportData): Promise<boolean> => {
  try {
    const html = generateSalesReportHTML(data);
    
    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `Sales_Report_${data.period.replace(' ', '_')}_${timestamp}.pdf`;
    
    if (Platform.OS === 'web') {
      // For web, trigger download
      const link = document.createElement('a');
      link.href = uri;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For mobile, save to downloads and share
      const documentsDir = FileSystem.documentDirectory;
      const fileUri = `${documentsDir}${filename}`;
      
      // Copy the file to documents directory
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        console.log('Sharing not available');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return false;
  }
};

export const shareSalesReport = async (data: SalesReportData): Promise<boolean> => {
  try {
    const html = generateSalesReportHTML(data);
    
    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Sales Report - ${data.period}`,
      });
      return true;
    } else {
      console.log('Sharing not available');
      return false;
    }
  } catch (error) {
    console.error('Error sharing PDF report:', error);
    return false;
  }
};