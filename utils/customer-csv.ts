import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Customer } from '@/store/customersStore';
import { Platform } from 'react-native';

// CSV Headers for export/import
const CSV_HEADERS = [
  'Name',
  'Email',
  'Phone',
  'Address',
  'GST Number',
  'Customer Type',
  'Credit Limit',
  'Outstanding Balance',
  'Tags',
  'Notes',
  'Total Purchases',
  'Total Transactions',
  'Last Purchase Date',
  'Active',
  'Created Date'
];

// Helper function to escape CSV values
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // If the value contains comma, quotes, or newlines, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

// Convert customer object to CSV row
const customerToCSVRow = (customer: Customer): string => {
  const values = [
    customer.name,
    customer.email || '',
    customer.phone || '',
    customer.address || '',
    customer.gstNumber || '',
    customer.customerType || 'regular',
    customer.creditLimit || '',
    customer.outstandingBalance || '',
    customer.tags?.join(';') || '',
    customer.notes || '',
    customer.totalPurchases || 0,
    customer.totalTransactions || 0,
    customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toISOString() : '',
    customer.isActive ? 'Yes' : 'No',
    new Date(customer.createdAt).toISOString()
  ];
  
  return values.map(escapeCSVValue).join(',');
};

// Parse CSV row to customer object
const parseCSVRow = (row: string[], headers: string[]): Partial<Customer> => {
  const customerData: any = {};
  
  headers.forEach((header, index) => {
    const value = row[index]?.trim() || '';
    
    switch (header.toLowerCase()) {
      case 'name':
        customerData.name = value;
        break;
      case 'email':
        customerData.email = value || undefined;
        break;
      case 'phone':
        customerData.phone = value || undefined;
        break;
      case 'address':
        customerData.address = value || undefined;
        break;
      case 'gst number':
        customerData.gstNumber = value || undefined;
        break;
      case 'customer type':
        if (['regular', 'wholesale', 'vip'].includes(value.toLowerCase())) {
          customerData.customerType = value.toLowerCase();
        }
        break;
      case 'credit limit':
        if (value && !isNaN(Number(value))) {
          customerData.creditLimit = Number(value);
        }
        break;
      case 'outstanding balance':
        if (value && !isNaN(Number(value))) {
          customerData.outstandingBalance = Number(value);
        }
        break;
      case 'tags':
        if (value) {
          customerData.tags = value.split(';').map(tag => tag.trim()).filter(Boolean);
        }
        break;
      case 'notes':
        customerData.notes = value || undefined;
        break;
      case 'total purchases':
        if (value && !isNaN(Number(value))) {
          customerData.totalPurchases = Number(value);
        }
        break;
      case 'total transactions':
        if (value && !isNaN(Number(value))) {
          customerData.totalTransactions = Number(value);
        }
        break;
      case 'last purchase date':
        if (value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            customerData.lastPurchaseDate = date.getTime();
          }
        }
        break;
      case 'active':
        customerData.isActive = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
        break;
    }
  });
  
  return customerData;
};

// Parse CSV content
const parseCSV = (content: string): { headers: string[]; rows: string[][] } => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: string[][] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        if (insideQuotes && lines[i][j + 1] === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    row.push(currentValue.trim()); // Add last value
    rows.push(row);
  }
  
  return { headers, rows };
};

// Export customers to CSV
export const exportCustomersToCSV = async (customers: Customer[]): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    // Create CSV content
    const csvContent = [
      CSV_HEADERS.join(','),
      ...customers.map(customerToCSVRow)
    ].join('\n');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `customers_export_${timestamp}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Customers',
        UTI: 'public.comma-separated-values-text'
      });
      
      // Clean up file after sharing
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (error) {
          console.log('Error cleaning up CSV file:', error);
        }
      }, 5000);
      
      return { success: true, filePath: fileUri };
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }
  } catch (error) {
    console.error('Error exporting customers:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Export failed' };
  }
};

// Import customers from CSV
export const importCustomersFromCSV = async (): Promise<{ 
  success: boolean; 
  customers?: Partial<Customer>[]; 
  error?: string 
}> => {
  try {
    // Pick CSV file
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
      copyToCacheDirectory: true
    });
    
    if (result.type === 'cancel') {
      return { success: false, error: 'Import cancelled' };
    }
    
    // Read file content
    const fileContent = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Parse CSV
    const { headers, rows } = parseCSV(fileContent);
    
    if (headers.length === 0) {
      return { success: false, error: 'Invalid CSV file: No headers found' };
    }
    
    // Convert rows to customer objects
    const customers: Partial<Customer>[] = [];
    const errors: string[] = [];
    
    rows.forEach((row, index) => {
      try {
        const customerData = parseCSVRow(row, headers);
        
        // Validate required fields
        if (!customerData.name || customerData.name.trim() === '') {
          errors.push(`Row ${index + 2}: Name is required`);
          return;
        }
        
        customers.push(customerData);
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    });
    
    // Clean up temp file
    try {
      await FileSystem.deleteAsync(result.uri, { idempotent: true });
    } catch (error) {
      console.log('Error cleaning up temp file:', error);
    }
    
    if (errors.length > 0) {
      console.warn('Import warnings:', errors);
    }
    
    return { 
      success: true, 
      customers,
      error: errors.length > 0 ? `Imported with ${errors.length} warnings` : undefined
    };
  } catch (error) {
    console.error('Error importing customers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Import failed' 
    };
  }
};

// Generate sample CSV template
export const generateCSVTemplate = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const sampleData = [
      CSV_HEADERS.join(','),
      'John Doe,john@example.com,9876543210,"123 Main St, City",27ABCDE1234F1Z5,regular,50000,0,Premium;Frequent,Preferred payment: UPI,150000,25,2024-01-15T10:30:00Z,Yes,2023-01-01T00:00:00Z',
      'ABC Corporation,contact@abc.com,9123456789,"Business Park, Metro City",29XYZAB5678C2D3,wholesale,200000,25000,Corporate;Bulk,Net 30 payment terms,500000,50,2024-02-20T14:45:00Z,Yes,2022-06-15T00:00:00Z'
    ].join('\n');
    
    const fileName = 'customers_template.csv';
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, sampleData, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Customer Import Template',
        UTI: 'public.comma-separated-values-text'
      });
      
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (error) {
          console.log('Error cleaning up template file:', error);
        }
      }, 5000);
      
      return { success: true };
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }
  } catch (error) {
    console.error('Error generating template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate template' };
  }
};