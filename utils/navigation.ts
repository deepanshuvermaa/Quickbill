import { NavigationProp, useNavigation as useRNNavigation } from '@react-navigation/native';

// Define navigation types for type safety
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  BillDetails: { id: string };
  AddItem: undefined;
  ItemDetails: { id: string };
  Customers: undefined;
  AddCustomer: undefined;
  CustomerDetails: { id: string };
  EditCustomer: { id: string };
  Expenses: undefined;
  AddExpense: undefined;
  ExpenseDetails: { id: string };
  EditExpense: { id: string };
  Reports: undefined;
  SalesReport: undefined;
  InventoryReport: undefined;
  ExpensesReport: undefined;
  ProfitLossReport: undefined;
  PrinterSettings: undefined;
  InvoiceSettings: undefined;
  TaxSettings: undefined;
  SubscriptionPlans: undefined;
  Staff: undefined;
  AddStaff: undefined;
  Quotations: undefined;
  AddQuotation: undefined;
  QuotationDetails: { id: string };
  CreditNotes: undefined;
  AddCreditNote: undefined;
  CreditNoteDetails: { id: string };
};

// Custom hook to replace useRouter
export function useRouter() {
  const navigation = useRNNavigation<NavigationProp<RootStackParamList>>();
  
  return {
    push: (screen: keyof RootStackParamList, params?: any) => {
      navigation.navigate(screen as any, params);
    },
    back: () => navigation.goBack(),
    replace: (screen: keyof RootStackParamList, params?: any) => {
      navigation.reset({
        index: 0,
        routes: [{ name: screen as any, params }],
      });
    },
  };
}

// Helper to replace useLocalSearchParams
export function useLocalSearchParams<T extends Record<string, any>>(): T {
  const navigation = useRNNavigation();
  return (navigation.getState()?.routes[navigation.getState().index]?.params as T) || {} as T;
}

// Helper to replace useSegments
export function useSegments(): string[] {
  const navigation = useRNNavigation();
  const state = navigation.getState();
  
  if (!state) return [];
  
  // Get the current route name
  const currentRoute = state.routes[state.index];
  if (!currentRoute) return [];
  
  // Parse the route name to segments (e.g., "auth/login" -> ["auth", "login"])
  const routeName = currentRoute.name;
  if (routeName.includes('/')) {
    return routeName.split('/');
  }
  
  // Map common route names to segments
  if (routeName === 'Login' || routeName === 'Register') {
    return ['auth'];
  }
  
  if (routeName === 'Main' || routeName.includes('Tab')) {
    return ['(tabs)'];
  }
  
  return [routeName.toLowerCase()];
}

// Helper to replace usePathname
export function usePathname(): string {
  const navigation = useRNNavigation();
  const state = navigation.getState();
  
  if (!state) return '/';
  
  const currentRoute = state.routes[state.index];
  if (!currentRoute) return '/';
  
  // Map route names to pathnames
  const routeName = currentRoute.name;
  
  const pathMap: Record<string, string> = {
    'Main': '/',
    'Home': '/',
    'Billing': '/billing',
    'Items': '/items',
    'History': '/history',
    'Settings': '/settings',
    'Login': '/auth/login',
    'Register': '/auth/register',
    'Customers': '/customers',
    'Expenses': '/expenses',
    'Reports': '/reports',
    'Staff': '/staff',
    'Quotations': '/quotations',
    'CreditNotes': '/credit-notes',
  };
  
  return pathMap[routeName] || `/${routeName.toLowerCase()}`;
}