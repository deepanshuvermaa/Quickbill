import { Customer } from '@/store/customersStore';
import { generateUniqueId } from '@/utils/helpers';

const firstNames = [
  'Rajesh', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Suresh', 'Kavita',
  'Arjun', 'Deepa', 'Ravi', 'Pooja', 'Arun', 'Sanjana', 'Karthik', 'Divya',
  'Manish', 'Sneha', 'Rohit', 'Anita', 'Vijay', 'Meera', 'Prakash', 'Nisha'
];

const lastNames = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Joshi', 'Mehta',
  'Agarwal', 'Reddy', 'Rao', 'Kapoor', 'Malhotra', 'Chopra', 'Bhatia', 'Sinha',
  'Desai', 'Shah', 'Jain', 'Pandey', 'Mishra', 'Khanna', 'Arora', 'Pillai'
];

const companyNames = [
  'Tech Solutions', 'Global Traders', 'Digital Services', 'Smart Innovations',
  'Future Enterprises', 'Creative Studios', 'Business Hub', 'Professional Services',
  'Market Leaders', 'Industry Experts', 'Quality Products', 'Service Masters'
];

const areas = [
  'Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'HSR Layout',
  'Malleswaram', 'Basavanagudi', 'RT Nagar', 'Electronic City', 'Marathahalli',
  'Bandra', 'Andheri', 'Juhu', 'Powai', 'Dadar', 'Connaught Place', 'Karol Bagh',
  'Saket', 'Greater Kailash', 'Vasant Kunj'
];

const cities = [
  'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata',
  'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore'
];

const tags = [
  'Regular', 'Premium', 'Frequent Buyer', 'New Customer', 'Seasonal',
  'Corporate', 'Referral', 'Online', 'Walk-in', 'Discount Seeker'
];

const generatePhoneNumber = (): string => {
  const prefix = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '71', '70'][Math.floor(Math.random() * 29)];
  const remaining = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + remaining;
};

const generateGSTNumber = (): string => {
  const stateCode = Math.floor(Math.random() * 35 + 1).toString().padStart(2, '0');
  const pan = generateRandomString(5, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const entityNumber = Math.floor(Math.random() * 9000 + 1000).toString();
  const entityCode = generateRandomString(1, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const zCode = 'Z';
  const checksum = generateRandomString(1, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
  
  return `${stateCode}${pan}${entityNumber}${entityCode}${entityCode}${zCode}${checksum}`;
};

const generateRandomString = (length: number, chars: string): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateEmail = (name: string, company?: string): string => {
  const domain = company 
    ? company.toLowerCase().replace(/[^a-z]/g, '') + '.com'
    : ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'][Math.floor(Math.random() * 4)];
  
  const username = name.toLowerCase().replace(/[^a-z]/g, '') + Math.floor(Math.random() * 100);
  return `${username}@${domain}`;
};

const generateAddress = (): string => {
  const houseNo = Math.floor(Math.random() * 999) + 1;
  const area = areas[Math.floor(Math.random() * areas.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const pincode = Math.floor(Math.random() * 400000) + 100000;
  
  return `${houseNo}, ${area}, ${city} - ${pincode}`;
};

const generateCustomerType = (): 'regular' | 'wholesale' | 'vip' => {
  const rand = Math.random();
  if (rand < 0.7) return 'regular';
  if (rand < 0.9) return 'wholesale';
  return 'vip';
};

const generateCreditLimit = (type: string): number => {
  switch (type) {
    case 'vip':
      return Math.floor(Math.random() * 400000) + 100000; // 100k - 500k
    case 'wholesale':
      return Math.floor(Math.random() * 90000) + 10000; // 10k - 100k
    default:
      return Math.random() < 0.3 ? Math.floor(Math.random() * 9000) + 1000 : 0; // 0 or 1k - 10k
  }
};

const generatePurchaseHistory = (customerType: string, createdAt: number) => {
  const now = Date.now();
  const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  
  let transactionCount = 0;
  let totalAmount = 0;
  
  switch (customerType) {
    case 'vip':
      transactionCount = Math.floor(Math.random() * 50) + 20;
      totalAmount = Math.floor(Math.random() * 900000) + 100000; // 100k - 1M
      break;
    case 'wholesale':
      transactionCount = Math.floor(Math.random() * 30) + 10;
      totalAmount = Math.floor(Math.random() * 400000) + 50000; // 50k - 450k
      break;
    default:
      transactionCount = Math.floor(Math.random() * 15) + 1;
      totalAmount = Math.floor(Math.random() * 90000) + 1000; // 1k - 91k
      break;
  }
  
  const lastPurchaseDate = daysSinceCreation > 0 
    ? createdAt + Math.floor(Math.random() * daysSinceCreation * 24 * 60 * 60 * 1000)
    : undefined;
  
  return {
    totalTransactions: transactionCount,
    totalPurchases: totalAmount,
    lastPurchaseDate
  };
};

export const generateMockCustomers = (count: number = 20): Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const customers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    
    const isCompany = Math.random() < 0.3;
    const companyName = isCompany ? companyNames[Math.floor(Math.random() * companyNames.length)] : undefined;
    
    const customerType = generateCustomerType();
    const hasGST = isCompany || customerType !== 'regular' || Math.random() < 0.2;
    const hasEmail = Math.random() < 0.8;
    const hasPhone = Math.random() < 0.95;
    const hasAddress = Math.random() < 0.7;
    const hasCreditLimit = customerType !== 'regular' || Math.random() < 0.3;
    const hasTags = Math.random() < 0.6;
    const hasNotes = Math.random() < 0.4;
    
    const createdDaysAgo = Math.floor(Math.random() * 365); // Up to 1 year ago
    const createdAt = Date.now() - (createdDaysAgo * 24 * 60 * 60 * 1000);
    const purchaseHistory = generatePurchaseHistory(customerType, createdAt);
    
    const customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
      name: companyName || name,
      email: hasEmail ? generateEmail(firstName, companyName) : undefined,
      phone: hasPhone ? generatePhoneNumber() : undefined,
      address: hasAddress ? generateAddress() : undefined,
      gstNumber: hasGST ? generateGSTNumber() : undefined,
      customerType,
      creditLimit: hasCreditLimit ? generateCreditLimit(customerType) : undefined,
      outstandingBalance: hasCreditLimit ? Math.floor(Math.random() * (generateCreditLimit(customerType) * 0.5)) : undefined,
      tags: hasTags ? Array.from(
        new Set(
          Array(Math.floor(Math.random() * 3) + 1)
            .fill(0)
            .map(() => tags[Math.floor(Math.random() * tags.length)])
        )
      ) : undefined,
      notes: hasNotes ? `${customerType === 'vip' ? 'VIP customer. ' : ''}${
        isCompany ? 'Corporate account. ' : ''
      }Preferred payment: ${
        ['Cash', 'Card', 'UPI', 'Bank Transfer'][Math.floor(Math.random() * 4)]
      }` : undefined,
      isActive: Math.random() > 0.1, // 90% active
      ...purchaseHistory
    };
    
    customers.push(customer);
  }
  
  return customers;
};

export const initializeWithMockCustomers = async (store: any) => {
  const mockCustomers = generateMockCustomers(20);
  
  let successCount = 0;
  let failedCount = 0;
  
  mockCustomers.forEach((customer) => {
    try {
      store.addCustomer(customer);
      successCount++;
    } catch (error) {
      failedCount++;
      console.error('Failed to add mock customer:', error);
    }
  });
  
  return {
    success: successCount,
    failed: failedCount,
    message: `Added ${successCount} mock customers${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
  };
};