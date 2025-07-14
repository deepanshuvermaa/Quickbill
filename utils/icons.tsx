// Platform-specific icon exports
import { Platform } from 'react-native';

// For React Native (mobile)
let Icons: any = {};

if (Platform.OS !== 'web') {
  Icons = require('lucide-react-native');
} else {
  // For web, we'll create wrapper components that use SVG
  // This is a simplified version - in production you might want to use lucide-react
  const createIcon = (name: string) => {
    return ({ size = 24, color = '#000', ...props }: any) => null;
  };

  // Create mock icons for web
  const iconNames = [
    'Menu', 'X', 'ChevronLeft', 'ChevronRight', 'ChevronDown', 'ChevronUp',
    'Search', 'Plus', 'Minus', 'Edit', 'Edit2', 'Trash', 'Trash2',
    'Save', 'Download', 'Upload', 'Share', 'Share2', 'Print', 'Printer',
    'Calendar', 'Clock', 'User', 'Users', 'Phone', 'Mail', 'MapPin',
    'Home', 'ShoppingCart', 'Package', 'Box', 'Archive', 'FileText',
    'File', 'Folder', 'Copy', 'Clipboard', 'Check', 'X as XIcon',
    'AlertCircle', 'Info', 'HelpCircle', 'Settings', 'Filter',
    'BarChart', 'TrendingUp', 'TrendingDown', 'DollarSign', 'Percent',
    'Receipt', 'CreditCard', 'Wallet', 'Building', 'Store', 'Tag',
    'Tags', 'Hash', 'Link', 'ExternalLink', 'Eye', 'EyeOff',
    'Lock', 'Unlock', 'Key', 'Shield', 'Bell', 'BellOff',
    'Heart', 'Star', 'Flag', 'Bookmark', 'Award', 'Gift',
    'Camera', 'Image', 'Film', 'Music', 'Mic', 'Volume',
    'Wifi', 'WifiOff', 'Bluetooth', 'Battery', 'Power', 'Zap',
    'Sun', 'Moon', 'Cloud', 'CloudRain', 'Wind', 'Droplet',
    'Globe', 'Map', 'Navigation', 'Compass', 'Watch', 'Smartphone',
    'Monitor', 'Laptop', 'Tablet', 'Tv', 'Radio', 'Speaker',
    'Cpu', 'HardDrive', 'Server', 'Database', 'Code', 'Terminal',
    'Command', 'GitBranch', 'Github', 'Gitlab', 'Chrome', 'Facebook',
    'Twitter', 'Linkedin', 'Instagram', 'Youtube', 'Slack', 'Trello',
    'RefreshCw', 'RotateCw', 'Loader', 'LogOut', 'LogIn', 'UserPlus',
    'UserMinus', 'UserCheck', 'UserX', 'Crown', 'Type'
  ];

  iconNames.forEach(name => {
    const iconName = name.includes(' as ') ? name.split(' as ')[1] : name;
    Icons[iconName] = createIcon(iconName);
  });
}

// Export all icons
export const {
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Search, Plus, Minus, Edit, Edit2, Trash, Trash2,
  Save, Download, Upload, Share, Share2, Print, Printer,
  Calendar, Clock, User, Users, Phone, Mail, MapPin,
  Home, ShoppingCart, Package, Box, Archive, FileText,
  File, Folder, Copy, Clipboard, Check, XIcon,
  AlertCircle, Info, HelpCircle, Settings, Filter,
  BarChart, TrendingUp, TrendingDown, DollarSign, Percent,
  Receipt, CreditCard, Wallet, Building, Store, Tag,
  Tags, Hash, Link, ExternalLink, Eye, EyeOff,
  Lock, Unlock, Key, Shield, Bell, BellOff,
  Heart, Star, Flag, Bookmark, Award, Gift,
  Camera, Image, Film, Music, Mic, Volume,
  Wifi, WifiOff, Bluetooth, Battery, Power, Zap,
  Sun, Moon, Cloud, CloudRain, Wind, Droplet,
  Globe, Map, Navigation, Compass, Watch, Smartphone,
  Monitor, Laptop, Tablet, Tv, Radio, Speaker,
  Cpu, HardDrive, Server, Database, Code, Terminal,
  Command, GitBranch, Github, Gitlab, Chrome, Facebook,
  Twitter, Linkedin, Instagram, Youtube, Slack, Trello,
  RefreshCw, RotateCw, Loader, LogOut, LogIn, UserPlus,
  UserMinus, UserCheck, UserX, Crown, Type
} = Icons;