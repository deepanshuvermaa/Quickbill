import { Platform, Alert, Share } from 'react-native';
import { Item } from '@/types';

// Generate CSV content from items
export const generateInventoryCSV = (items: Item[]): string => {
  const headers = ['ID', 'Name', 'Description', 'Category', 'Price', 'Stock', 'SKU', 'Unit'];
  
  let csvContent = headers.join(',') + '\n';
  
  items.forEach(item => {
    const row = [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`, // Escape quotes in names
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${item.category || ''}"`,
      item.price.toString(),
      (item.stock || 0).toString(),
      `"${item.sku || ''}"`,
      `"${item.unit || 'pcs'}"`
    ];
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
};

// Generate printable inventory report
export const generateInventoryReport = (items: Item[]): string => {
  const lineWidth = 32; // 32 chars for 58mm printer
  const divider = '='.repeat(lineWidth);
  
  let output = '';
  
  // Header
  output += 'INVENTORY REPORT\n\n';
  
  // Format date and time
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'numeric', 
    year: '2-digit' 
  });
  const timeStr = now.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  }).toUpperCase();
  
  output += `Generated: ${dateStr} ${timeStr}\n`;
  output += divider + '\n';
  
  // Summary
  const totalItems = items.length;
  const totalStock = items.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + (item.price * (item.stock || 0)), 0);
  const lowStockItems = items.filter(item => item.stock !== undefined && item.stock > 0 && item.stock < 10).length;
  const outOfStockItems = items.filter(item => !item.stock || item.stock === 0).length;
  
  output += 'SUMMARY:\n';
  output += `Items: ${totalItems} | Stock: ${totalStock} units\n`;
  output += `Value: Rs.${totalValue.toFixed(2)}\n`;
  output += `Low Stock: ${lowStockItems} | Out of Stock: ${outOfStockItems}\n`;
  output += divider + '\n';
  
  // Table header
  output += 'ITEM               PRICE    QTY   VALUE\n';
  output += '-'.repeat(lineWidth) + '\n';
  
  // Group items by category
  const categories = new Map<string, Item[]>();
  items.forEach(item => {
    const category = item.category || 'UNCATEGORIZED';
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(item);
  });
  
  let grandTotalQty = 0;
  let grandTotalValue = 0;
  
  // Items by category
  categories.forEach((categoryItems, categoryName) => {
    output += categoryName.toUpperCase() + '\n';
    
    let categoryQty = 0;
    let categoryValue = 0;
    
    // Sort items by name for consistency
    const sortedItems = [...categoryItems].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedItems.forEach(item => {
      const name = item.name.length > 18 ? item.name.substring(0, 15) + '...' : item.name;
      const price = item.price.toFixed(2).padStart(7);
      const qty = (item.stock || 0).toString().padStart(5);
      const value = ((item.stock || 0) * item.price).toFixed(0).padStart(7);
      
      output += `${name.padEnd(18)} ${price} ${qty} ${value}\n`;
      
      categoryQty += item.stock || 0;
      categoryValue += (item.stock || 0) * item.price;
    });
    
    // Category subtotal
    output += `                  Subtotal: ${categoryQty.toString().padStart(3)} ${categoryValue.toFixed(0).padStart(8)}\n`;
    
    grandTotalQty += categoryQty;
    grandTotalValue += categoryValue;
  });
  
  // Grand total
  output += divider + '\n';
  output += `TOTAL                      ${grandTotalQty.toString().padStart(3)} ${grandTotalValue.toFixed(0).padStart(8)}\n`;
  
  return output;
};

// Export inventory as CSV
export const exportInventoryCSV = async (items: Item[]): Promise<boolean> => {
  try {
    const csvContent = generateInventoryCSV(items);
    
    if (Platform.OS === 'web') {
      // For web, create downloadable file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
      
      return false;
    } else {
      // For mobile, use Share API
      const result = await Share.share({
        message: csvContent,
        title: 'Inventory Export CSV',
      });
      
      return result.action === Share.sharedAction;
    }
  } catch (error) {
    console.error('Error exporting inventory CSV:', error);
    return false;
  }
};

// Export inventory report
export const exportInventoryReport = async (items: Item[]): Promise<boolean> => {
  try {
    const reportContent = generateInventoryReport(items);
    
    if (Platform.OS === 'web') {
      // For web, open in new window for printing
      const htmlContent = generatePrintableHTMLReport(reportContent, 'Inventory Report');
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
        title: 'Inventory Report',
      });
      
      return result.action === Share.sharedAction;
    }
  } catch (error) {
    console.error('Error exporting inventory report:', error);
    return false;
  }
};

// Interface for import results
export interface ImportResult {
  success: boolean;
  itemsImported: number;
  errors: string[];
  duplicates: number;
  items: Item[];
}

// Generate sample CSV template
export const generateSampleCSV = (): string => {
  const headers = ['Name', 'Description', 'Category', 'Price', 'Stock', 'SKU', 'Unit'];
  const sampleData = [
    ['Sample Product 1', 'Description for product 1', 'Electronics', '99.99', '50', 'SKU001', 'pcs'],
    ['Sample Product 2', 'Description for product 2', 'Clothing', '29.99', '100', 'SKU002', 'pcs'],
    ['Sample Service', 'Service description', 'Services', '150.00', '0', 'SRV001', 'hrs']
  ];
  
  let csvContent = headers.join(',') + '\n';
  sampleData.forEach(row => {
    csvContent += row.map(field => `"${field}"`).join(',') + '\n';
  });
  
  return csvContent;
};

// Download sample CSV template
export const downloadSampleCSV = async (): Promise<boolean> => {
  try {
    const csvContent = generateSampleCSV();
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'inventory_import_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
    } else {
      const result = await Share.share({
        message: csvContent,
        title: 'Inventory Import Template',
      });
      return result.action === Share.sharedAction;
    }
    
    return false;
  } catch (error) {
    console.error('Error downloading sample CSV:', error);
    return false;
  }
};

// Parse CSV content with improved error handling
export const parseInventoryCSV = (csvContent: string, existingItems: Item[] = []): ImportResult => {
  const errors: string[] = [];
  const items: Item[] = [];
  let duplicates = 0;
  
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        itemsImported: 0,
        errors: ['Invalid CSV format: No data rows found'],
        duplicates: 0,
        items: []
      };
    }
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    // Create maps for quick duplicate checking
    const existingNames = new Set(existingItems.map(item => item.name.toLowerCase()));
    const existingSkus = new Set(existingItems.filter(item => item.sku).map(item => item.sku!.toLowerCase()));
    
    dataLines.forEach((line, index) => {
      try {
        // Enhanced CSV parsing to handle quoted fields with commas
        const values = parseCSVLine(line);
        
        if (values.length < 4) {
          errors.push(`Row ${index + 2}: Insufficient columns (need at least Name, Description, Category, Price)`);
          return;
        }
        
        const [name, description, category, priceStr, stockStr, sku, unit] = values;
        
        if (!name || !priceStr) {
          errors.push(`Row ${index + 2}: Missing required fields (name and price are required)`);
          return;
        }
        
        // Check for duplicates
        const nameLower = name.toLowerCase();
        const skuLower = sku ? sku.toLowerCase() : '';
        
        if (existingNames.has(nameLower)) {
          duplicates++;
          errors.push(`Row ${index + 2}: Item '${name}' already exists (duplicate name)`);
          return;
        }
        
        if (sku && skuLower && existingSkus.has(skuLower)) {
          duplicates++;
          errors.push(`Row ${index + 2}: SKU '${sku}' already exists (duplicate SKU)`);
          return;
        }
        
        const price = parseFloat(priceStr);
        const stock = stockStr ? parseInt(stockStr, 10) : 0;
        
        if (isNaN(price) || price < 0) {
          errors.push(`Row ${index + 2}: Invalid price value '${priceStr}' (must be a positive number)`);
          return;
        }
        
        if (stockStr && (isNaN(stock) || stock < 0)) {
          errors.push(`Row ${index + 2}: Invalid stock value '${stockStr}' (must be a non-negative number)`);
          return;
        }
        
        const item: Item = {
          id: `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          description: description ? description.trim() : '',
          category: category ? category.trim() : 'Uncategorized',
          price: price,
          stock: isNaN(stock) ? 0 : stock,
          sku: sku ? sku.trim() : '',
          unit: unit ? unit.trim() : 'pcs',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        items.push(item);
        
        // Add to duplicate checking sets for subsequent rows
        existingNames.add(nameLower);
        if (item.sku) {
          existingSkus.add(item.sku.toLowerCase());
        }
        
      } catch (error) {
        errors.push(`Row ${index + 2}: Error parsing row - ${error}`);
      }
    });
    
    return {
      success: items.length > 0,
      itemsImported: items.length,
      errors,
      duplicates,
      items
    };
    
  } catch (error) {
    return {
      success: false,
      itemsImported: 0,
      errors: [`Failed to parse CSV: ${error}`],
      duplicates: 0,
      items: []
    };
  }
};

// Enhanced CSV line parser to handle quoted fields properly
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
};

// Import functionality removed to fix build issues
// Will be implemented in a future update

// Generate HTML report for web printing
const generatePrintableHTMLReport = (reportContent: string, title: string): string => {
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
            max-width: 800px;
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
        <div class="report-content">${reportContent}</div>
        <button class="print-button" onclick="window.print()">Print Report</button>
      </body>
    </html>
  `;
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