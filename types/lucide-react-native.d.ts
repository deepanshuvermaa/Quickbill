declare module 'lucide-react-native' {
  import { ComponentType } from 'react';
  import { SvgProps } from 'react-native-svg';
  
  export interface IconProps extends SvgProps {
    size?: number;
    color?: string;
    strokeWidth?: number;
  }
  
  export type Icon = ComponentType<IconProps>;
  
  // Export all icons as Icon type
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const AlertCircle: Icon;
  export const Bluetooth: Icon;
  export const Building2: Icon;
  export const Calendar: Icon;
  export const Camera: Icon;
  export const Check: Icon;
  export const ChevronDown: Icon;
  export const ChevronRight: Icon;
  export const Clock: Icon;
  export const CreditCard: Icon;
  export const DollarSign: Icon;
  export const Download: Icon;
  export const Edit: Icon;
  export const Eye: Icon;
  export const FileText: Icon;
  export const Filter: Icon;
  export const History: Icon;
  export const Home: Icon;
  export const Info: Icon;
  export const Mail: Icon;
  export const Menu: Icon;
  export const Package: Icon;
  export const Phone: Icon;
  export const Plus: Icon;
  export const PlusCircle: Icon;
  export const Printer: Icon;
  export const RefreshCw: Icon;
  export const Search: Icon;
  export const Settings: Icon;
  export const Share2: Icon;
  export const ShoppingCart: Icon;
  export const Smartphone: Icon;
  export const Trash2: Icon;
  export const TrendingDown: Icon;
  export const TrendingUp: Icon;
  export const User: Icon;
  export const Users: Icon;
  export const X: Icon;
  export const Zap: Icon;
  export const Receipt: Icon;
  export const ReceiptText: Icon;
  export const Package2: Icon;
  export const Banknote: Icon;
  export const ClipboardList: Icon;
  export const UserPlus: Icon;
  export const BarChart3: Icon;
  export const PieChart: Icon;
  export const FileBarChart: Icon;
  export const Wallet: Icon;
  export const Hash: Icon;
  export const Shield: Icon;
}