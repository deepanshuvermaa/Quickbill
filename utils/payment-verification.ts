import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';

export interface PaymentVerification {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  planId: number;
  planName: string;
  planAmount: number;
  transactionRef: string;
  paymentProofUri?: string;
  paymentProofBase64?: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
  remarks?: string;
}

const PAYMENT_VERIFICATIONS_KEY = 'payment_verifications';
const PAYMENT_IMAGES_DIR = `${FileSystem.documentDirectory}payment-proofs/`;

// Ensure directory exists
export const ensurePaymentProofDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(PAYMENT_IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PAYMENT_IMAGES_DIR, { intermediates: true });
  }
};

// Save payment verification
export const savePaymentVerification = async (
  verification: Omit<PaymentVerification, 'id' | 'submittedAt' | 'status'>
): Promise<PaymentVerification> => {
  try {
    await ensurePaymentProofDir();
    
    const newVerification: PaymentVerification = {
      ...verification,
      id: `PV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save image if provided
    if (verification.paymentProofUri) {
      const imageFileName = `${newVerification.id}.jpg`;
      const imagePath = PAYMENT_IMAGES_DIR + imageFileName;
      
      // Copy image to app's document directory
      await FileSystem.copyAsync({
        from: verification.paymentProofUri,
        to: imagePath
      });
      
      newVerification.paymentProofUri = imagePath;
    }
    
    // Get existing verifications
    const existingData = await AsyncStorage.getItem(PAYMENT_VERIFICATIONS_KEY);
    const verifications = existingData ? JSON.parse(existingData) : [];
    
    // Add new verification
    verifications.unshift(newVerification); // Add to beginning
    
    // Keep only last 1000 records
    if (verifications.length > 1000) {
      verifications.length = 1000;
    }
    
    // Save back
    await AsyncStorage.setItem(PAYMENT_VERIFICATIONS_KEY, JSON.stringify(verifications));
    
    return newVerification;
  } catch (error) {
    console.error('Error saving payment verification:', error);
    throw error;
  }
};

// Get all payment verifications
export const getAllPaymentVerifications = async (): Promise<PaymentVerification[]> => {
  try {
    const data = await AsyncStorage.getItem(PAYMENT_VERIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading payment verifications:', error);
    return [];
  }
};

// Get pending verifications
export const getPendingVerifications = async (): Promise<PaymentVerification[]> => {
  const all = await getAllPaymentVerifications();
  return all.filter(v => v.status === 'pending');
};

// Update verification status
export const updateVerificationStatus = async (
  id: string,
  status: 'verified' | 'rejected',
  verifiedBy: string,
  remarks?: string
): Promise<void> => {
  try {
    const verifications = await getAllPaymentVerifications();
    const index = verifications.findIndex(v => v.id === id);
    
    if (index !== -1) {
      verifications[index] = {
        ...verifications[index],
        status,
        verifiedAt: new Date().toISOString(),
        verifiedBy,
        remarks
      };
      
      await AsyncStorage.setItem(PAYMENT_VERIFICATIONS_KEY, JSON.stringify(verifications));
    }
  } catch (error) {
    console.error('Error updating verification status:', error);
    throw error;
  }
};

// Export verifications as CSV
export const exportVerificationsAsCSV = async (): Promise<string> => {
  const verifications = await getAllPaymentVerifications();
  
  const headers = [
    'ID',
    'Date',
    'User Email',
    'User Name',
    'Phone',
    'Plan',
    'Amount',
    'Reference',
    'Status',
    'Verified By',
    'Verified Date',
    'Remarks'
  ].join(',');
  
  const rows = verifications.map(v => [
    v.id,
    v.submittedAt,
    v.userEmail,
    v.userName,
    v.userPhone,
    v.planName,
    v.planAmount,
    v.transactionRef,
    v.status,
    v.verifiedBy || '',
    v.verifiedAt || '',
    v.remarks || ''
  ].map(val => `"${val}"`).join(','));
  
  return [headers, ...rows].join('\n');
};

// Share verification data
export const shareVerificationData = async (verification: PaymentVerification) => {
  const message = `
QuickBill Payment Verification
ID: ${verification.id}
User: ${verification.userName} (${verification.userEmail})
Phone: ${verification.userPhone}
Plan: ${verification.planName}
Amount: ₹${verification.planAmount}
Reference: ${verification.transactionRef}
Date: ${new Date(verification.submittedAt).toLocaleString()}
Status: ${verification.status}
  `.trim();
  
  try {
    if (verification.paymentProofUri) {
      await Share.share({
        message: message,
        url: verification.paymentProofUri,
        title: 'Payment Verification'
      });
    } else {
      await Share.share({
        message: message,
        title: 'Payment Verification'
      });
    }
  } catch (error) {
    console.error('Error sharing verification:', error);
  }
};

// Delete old verifications (older than 90 days)
export const cleanupOldVerifications = async () => {
  try {
    const verifications = await getAllPaymentVerifications();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const filtered = verifications.filter(v => {
      const submittedDate = new Date(v.submittedAt);
      return submittedDate > ninetyDaysAgo;
    });
    
    // Delete associated images for removed verifications
    const removedVerifications = verifications.filter(v => !filtered.includes(v));
    for (const verification of removedVerifications) {
      if (verification.paymentProofUri) {
        try {
          await FileSystem.deleteAsync(verification.paymentProofUri, { idempotent: true });
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
    }
    
    await AsyncStorage.setItem(PAYMENT_VERIFICATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error cleaning up verifications:', error);
  }
};