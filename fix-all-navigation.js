const fs = require('fs');
const path = require('path');

// Fix navigation routes to match React Navigation pattern
const navigationFixes = {
  "navigate('/items')": "navigate('Items')",
  "navigate('/customers')": "navigate('Customers')",
  "navigate('/expenses')": "navigate('Expenses')",
  "navigate('/history')": "navigate('History')",
  "navigate('/billing')": "navigate('Billing')",
  "navigate('/items/add')": "navigate('AddItem')",
  "navigate('/quotations')": "navigate('Quotations')",
  "navigate('/credit-notes')": "navigate('CreditNotes')",
  "navigate('/reports')": "navigate('Reports')",
  "navigate('/staff')": "navigate('Staff')",
  "navigate('/printer-settings')": "navigate('PrinterSettings')",
  "navigate('/invoice-settings')": "navigate('InvoiceSettings')",
  "navigate('/subscription-plans')": "navigate('SubscriptionPlans')",
  // Dynamic routes
  "navigate(`/bills/${": "navigate('BillDetails', { id: ",
  "navigate(`/items/${": "navigate('ItemDetails', { id: ",
  "navigate(`/customers/${": "navigate('CustomerDetails', { id: ",
  "navigate(`/expenses/${": "navigate('ExpenseDetails', { id: ",
  "}`)": " })"
};

// Files to fix
const filesToFix = [
  'screens/HomeScreen.tsx',
  'screens/billing/BillingScreen.tsx',
  'screens/history/HistoryScreen.tsx',
  'screens/settings/SettingsScreen.tsx',
  'screens/items/ItemsScreen.tsx',
  'screens/customers/CustomersScreen.tsx',
  'screens/expenses/ExpensesScreen.tsx'
];

console.log('Fixing navigation in all screens...\n');

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply navigation fixes
    Object.entries(navigationFixes).forEach(([oldPattern, newPattern]) => {
      if (content.includes(oldPattern)) {
        content = content.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern);
        modified = true;
      }
    });
    
    // Fix useHamburgerMenu imports
    if (content.includes("import { useHamburgerMenu }")) {
      content = content.replace(/import { useHamburgerMenu }.*?;/g, "// Hamburger menu import removed");
      modified = true;
    }
    
    // Comment out useHamburgerMenu usage
    if (content.includes("useHamburgerMenu()")) {
      content = content.replace(/const { .*? } = useHamburgerMenu\(\);/g, "// Hamburger menu hook removed");
      modified = true;
    }
    
    // Remove Stack.Screen components
    if (content.includes("<Stack.Screen")) {
      content = content.replace(/<Stack\.Screen[\s\S]*?\/>/g, '');
      modified = true;
    }
    
    // Remove unused Menu import
    if (content.includes("Menu") && content.includes("lucide-react-native")) {
      content = content.replace(/,?\s*Menu(?=\s*[,}])/g, '');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed: ${file}`);
    } else {
      console.log(`- No changes needed: ${file}`);
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\nNavigation fixes complete!');