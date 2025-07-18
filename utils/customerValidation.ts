import { CustomerFormData } from '@/types/customer';

// Validation rules
const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian phone number format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface ValidationError {
  field: keyof CustomerFormData;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateCustomerForm = (data: CustomerFormData): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation (required)
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Customer name is required' });
  } else if (data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (data.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
  }

  // Phone validation (required)
  if (!data.phone || data.phone.trim().length === 0) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!PHONE_REGEX.test(data.phone.trim())) {
    errors.push({ field: 'phone', message: 'Please enter a valid 10-digit phone number' });
  }

  // Email validation (optional)
  if (data.email && data.email.trim().length > 0) {
    if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }
  }

  // GST validation (optional)
  if (data.gstNumber && data.gstNumber.trim().length > 0) {
    if (!GST_REGEX.test(data.gstNumber.trim())) {
      errors.push({ field: 'gstNumber', message: 'Please enter a valid GST number' });
    }
  }

  // Address validation (optional)
  if (data.address && data.address.trim().length > 500) {
    errors.push({ field: 'address', message: 'Address must be less than 500 characters' });
  }

  // Notes validation (optional)
  if (data.notes && data.notes.trim().length > 1000) {
    errors.push({ field: 'notes', message: 'Notes must be less than 1000 characters' });
  }

  // Tags validation (optional)
  if (data.tags && data.tags.length > 10) {
    errors.push({ field: 'tags', message: 'Maximum 10 tags allowed' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Format GST number for display
export const formatGSTNumber = (gst: string): string => {
  if (gst.length === 15) {
    return `${gst.slice(0, 2)} ${gst.slice(2, 7)} ${gst.slice(7, 11)} ${gst.slice(11)}`;
  }
  return gst;
};

// Validate single field
export const validateField = (
  field: keyof CustomerFormData,
  value: any
): string | null => {
  switch (field) {
    case 'name':
      if (!value || value.trim().length === 0) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (value.trim().length > 100) return 'Name must be less than 100 characters';
      break;
    
    case 'phone':
      if (!value || value.trim().length === 0) return 'Phone number is required';
      if (!PHONE_REGEX.test(value.trim())) return 'Invalid phone number';
      break;
    
    case 'email':
      if (value && value.trim().length > 0 && !EMAIL_REGEX.test(value.trim())) {
        return 'Invalid email address';
      }
      break;
    
    case 'gstNumber':
      if (value && value.trim().length > 0 && !GST_REGEX.test(value.trim())) {
        return 'Invalid GST number';
      }
      break;
    
    case 'address':
      if (value && value.trim().length > 500) {
        return 'Address must be less than 500 characters';
      }
      break;
    
    case 'notes':
      if (value && value.trim().length > 1000) {
        return 'Notes must be less than 1000 characters';
      }
      break;
  }
  
  return null;
};

// Quick validation for billing screen (minimal requirements)
export const validateQuickCustomer = (name: string, phone: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Customer name is required' });
  }

  if (!phone || phone.trim().length === 0) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!PHONE_REGEX.test(phone.trim())) {
    errors.push({ field: 'phone', message: 'Invalid phone number' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Clean form data before saving
export const cleanCustomerData = (data: CustomerFormData): CustomerFormData => {
  return {
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email?.trim() || undefined,
    address: data.address?.trim() || undefined,
    gstNumber: data.gstNumber?.trim().toUpperCase() || undefined,
    notes: data.notes?.trim() || undefined,
    tags: data.tags?.map(tag => tag.trim()).filter(tag => tag.length > 0) || undefined
  };
};