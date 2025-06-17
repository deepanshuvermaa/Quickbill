import { PaymentMethod } from '@/types';

// Generate a unique ID with a prefix
export const generateUniqueId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`;
};

// Format a payment method for display
export const formatPaymentMethod = (method: PaymentMethod): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'card':
      return 'Card';
    case 'upi':
      return 'UPI';
    case 'bank_transfer':
      return 'Bank Transfer';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
  }
};

// Format currency
export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  return `${currency}${amount.toFixed(2)}`;
};

// Format date
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format time
export const formatTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format date and time
export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return `${formatDate(d)} ${formatTime(d)}`;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Center align text for printing
export const centerText = (text: string, width: number): string => {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  return ' '.repeat(leftPad) + text;
};

// Right align text for printing
export const rightAlignText = (text: string, width: number): string => {
  const padding = Math.max(0, width - text.length);
  return ' '.repeat(padding) + text;
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length > 10) {
    return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10, -7)}-${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
  }
  
  // Return as is if we can't format it
  return phone;
};