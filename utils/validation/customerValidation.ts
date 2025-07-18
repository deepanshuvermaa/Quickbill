import * as yup from 'yup';

const phoneRegex = /^[0-9]{10,13}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const customerSchema = yup.object().shape({
  name: yup
    .string()
    .required('Customer name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  
  email: yup
    .string()
    .optional()
    .nullable()
    .test('email', 'Invalid email format', (value) => {
      if (!value || value.trim() === '') return true;
      return emailRegex.test(value);
    }),
  
  phone: yup
    .string()
    .optional()
    .nullable()
    .test('phone', 'Phone number must be 10-13 digits', (value) => {
      if (!value || value.trim() === '') return true;
      return phoneRegex.test(value.replace(/[^0-9]/g, ''));
    }),
  
  address: yup
    .string()
    .optional()
    .nullable()
    .max(500, 'Address must be less than 500 characters'),
  
  gstNumber: yup
    .string()
    .optional()
    .nullable()
    .test('gst', 'Invalid GST number format', (value) => {
      if (!value || value.trim() === '') return true;
      return gstRegex.test(value.toUpperCase());
    }),
  
  customerType: yup
    .string()
    .optional()
    .oneOf(['regular', 'wholesale', 'vip'], 'Invalid customer type'),
  
  creditLimit: yup
    .number()
    .optional()
    .min(0, 'Credit limit cannot be negative')
    .max(10000000, 'Credit limit too high'),
  
  notes: yup
    .string()
    .optional()
    .nullable()
    .max(1000, 'Notes must be less than 1000 characters'),
  
  tags: yup
    .array()
    .of(yup.string())
    .optional()
    .max(10, 'Maximum 10 tags allowed'),
  
  isActive: yup
    .boolean()
    .optional()
    .default(true),
});

export const bulkImportSchema = yup.array().of(
  yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().optional(),
    phone: yup.string().optional(),
    address: yup.string().optional(),
    gstNumber: yup.string().optional(),
    customerType: yup.string().optional(),
    creditLimit: yup.number().optional(),
    notes: yup.string().optional(),
    tags: yup.array().of(yup.string()).optional(),
  })
);

export const validateCustomer = async (customer: any) => {
  try {
    await customerSchema.validate(customer, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
};

export const formatGSTNumber = (gst: string): string => {
  return gst.toUpperCase();
};