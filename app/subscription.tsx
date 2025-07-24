import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/constants/colors';
import { API_ENDPOINTS } from '@/utils/api';

interface Plan {
  id: number;
  name: string;
  displayName: string;
  tierLevel: string;
  price: number;
  duration: number;
  features: Array<{
    key: string;
    name: string;
    enabled: boolean;
    limit?: number;
  }>;
  maxUsers: number;
  highlight: string;
}

// Hardcoded plans to avoid API issues
const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 1,
    name: 'silver',
    displayName: 'Silver',
    tierLevel: 'silver',
    price: 1999,
    duration: 30,
    features: [
      { key: 'unlimited_bills', name: 'Unlimited Bills', enabled: true },
      { key: 'unlimited_items', name: 'Unlimited Items', enabled: true },
      { key: 'unlimited_customers', name: 'Unlimited Customers', enabled: true },
      { key: 'basic_reports', name: 'Basic Reports', enabled: true },
      { key: 'data_export', name: 'Export to Excel/PDF', enabled: true },
    ],
    maxUsers: 1,
    highlight: 'Perfect for small businesses'
  },
  {
    id: 2,
    name: 'gold',
    displayName: 'Gold',
    tierLevel: 'gold',
    price: 3999,
    duration: 30,
    features: [
      { key: 'unlimited_bills', name: 'Unlimited Bills', enabled: true },
      { key: 'unlimited_items', name: 'Unlimited Items', enabled: true },
      { key: 'unlimited_customers', name: 'Unlimited Customers', enabled: true },
      { key: 'advanced_reports', name: 'Advanced Reports & Analytics', enabled: true },
      { key: 'data_export', name: 'Export to Excel/PDF', enabled: true },
      { key: 'multi_user', name: 'Up to 3 Users', enabled: true },
      { key: 'inventory_alerts', name: 'Low Stock Alerts', enabled: true },
    ],
    maxUsers: 3,
    highlight: 'Best value for growing businesses'
  },
  {
    id: 3,
    name: 'platinum',
    displayName: 'Platinum',
    tierLevel: 'platinum',
    price: 9999,
    duration: 30,
    features: [
      { key: 'unlimited_bills', name: 'Unlimited Bills', enabled: true },
      { key: 'unlimited_items', name: 'Unlimited Items', enabled: true },
      { key: 'unlimited_customers', name: 'Unlimited Customers', enabled: true },
      { key: 'advanced_reports', name: 'Advanced Reports & Analytics', enabled: true },
      { key: 'data_export', name: 'Export to Excel/PDF', enabled: true },
      { key: 'multi_user', name: 'Up to 10 Users', enabled: true },
      { key: 'inventory_alerts', name: 'Low Stock Alerts', enabled: true },
      { key: 'priority_support', name: 'Priority Support', enabled: true },
      { key: 'custom_invoice', name: 'Custom Invoice Templates', enabled: true },
    ],
    maxUsers: 10,
    highlight: 'Enterprise features for large businesses'
  }
];

// UPI details for payment
const UPI_ID = 'deepanshuverma966@okicici';
const MERCHANT_NAME = 'Peripheral services';

export default function SubscriptionScreen() {
  const [plans] = useState<Plan[]>(SUBSCRIPTION_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { subscription, checkSubscriptionStatus, isAuthenticated, isGuestMode, token, user } = useAuthStore();

  useEffect(() => {
    console.log('[SubscriptionWorking] Component mounted', {
      isAuthenticated,
      isGuestMode,
      subscription: subscription?.status
    });
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to purchase a subscription plan',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const generateUPIString = (plan: Plan) => {
    // Generate UPI payment string
    return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent(`QuickBill ${plan.displayName} Plan`)}`;
  };

  const handlePayment = async () => {
    if (!transactionRef.trim()) {
      Alert.alert('Error', 'Please enter transaction reference number');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Submit to backend using simple endpoint
      const response = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.SUBMIT_PAYMENT_SIMPLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.displayName,
          amount: selectedPlan.price,
          transactionReference: transactionRef,
          paymentMethod: 'upi_manual',
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
          userPhone: user?.phone || ''
        })
      });

      if (response.ok) {
        Alert.alert(
          'Payment Submitted',
          'Your payment has been submitted for verification. You will be notified once it is approved.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowPayment(false);
                setSelectedPlan(null);
                setTransactionRef('');
                setIsProcessing(false);
                router.back();
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to submit payment');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      Alert.alert('Error', 'Failed to submit payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanIcon = (tierLevel: string) => {
    switch (tierLevel) {
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '📦';
    }
  };

  const getPlanStyles = (tierLevel: string) => {
    switch (tierLevel) {
      case 'silver': return styles.silverPlan;
      case 'gold': return styles.goldPlan;
      case 'platinum': return styles.platinumPlan;
      default: return styles.defaultPlan;
    }
  };

  if (showPayment && selectedPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.paymentHeader}>
              <Text style={styles.title}>Complete Payment</Text>
              <TouchableOpacity onPress={() => {
                setShowPayment(false);
                setSelectedPlan(null);
                setTransactionRef('');
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.planSummary}>
              <Text style={styles.planName}>{selectedPlan.displayName} Plan</Text>
              <Text style={styles.planPrice}>₹{selectedPlan.price}</Text>
              <Text style={styles.planDuration}>Valid for {selectedPlan.duration} days</Text>
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Instructions</Text>
              
              <View style={styles.upiDetails}>
                <Text style={styles.upiLabel}>Pay using any UPI app:</Text>
                <View style={styles.upiBox}>
                  <Text style={styles.upiId}>{UPI_ID}</Text>
                  <TouchableOpacity 
                    onPress={() => Alert.alert('UPI ID', UPI_ID)}
                    style={styles.copyButton}
                  >
                    <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.merchantName}>Merchant: {MERCHANT_NAME}</Text>
                <Text style={styles.amountText}>Amount: ₹{selectedPlan.price}</Text>
              </View>

              <View style={styles.stepsContainer}>
                <Text style={styles.stepText}>1. Open any UPI app (GPay, PhonePe, Paytm, etc.)</Text>
                <Text style={styles.stepText}>2. Send ₹{selectedPlan.price} to the above UPI ID</Text>
                <Text style={styles.stepText}>3. Enter the transaction reference number below</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Transaction Reference Number</Text>
                <TextInput
                  value={transactionRef}
                  onChangeText={setTransactionRef}
                  placeholder="Enter 12-digit UTR/Reference number"
                  style={styles.input}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                onPress={handlePayment}
                disabled={isProcessing || !transactionRef.trim()}
                style={[
                  styles.primaryButton,
                  (isProcessing || !transactionRef.trim()) && styles.disabledButton
                ]}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Select the perfect plan for your business needs
          </Text>

          {subscription?.isTrial && subscription?.trialDaysRemaining && (
            <View style={styles.trialBanner}>
              <Text style={styles.trialTitle}>
                Free Trial: {subscription.trialDaysRemaining} days remaining
              </Text>
              <Text style={styles.trialSubtitle}>
                You have full access to all Platinum features during your trial
              </Text>
            </View>
          )}

          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => handleSelectPlan(plan)}
              style={[styles.planCard, getPlanStyles(plan.tierLevel)]}
            >
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <View style={styles.planTitleRow}>
                    <Text style={styles.planIcon}>{getPlanIcon(plan.tierLevel)}</Text>
                    <Text style={styles.planDisplayName}>{plan.displayName}</Text>
                  </View>
                  {plan.highlight && (
                    <Text style={styles.planHighlight}>{plan.highlight}</Text>
                  )}
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>₹{plan.price}</Text>
                  <Text style={styles.pricePeriod}>per month</Text>
                </View>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features
                  .filter((f) => f.enabled)
                  .map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.featureText}>{feature.name}</Text>
                    </View>
                  ))}
                
                {plan.maxUsers > 1 && (
                  <View style={styles.featureRow}>
                    <Ionicons name="people" size={20} color="#10b981" />
                    <Text style={styles.featureText}>Up to {plan.maxUsers} users</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleSelectPlan(plan)}
                style={styles.selectButton}
              >
                <Text style={styles.selectButtonText}>
                  Choose {plan.displayName}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              All plans include unlimited bills, items, and customers.
              {'\n'}
              Cancel anytime. No hidden fees.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
  },
  trialBanner: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#60a5fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  trialSubtitle: {
    fontSize: 14,
    color: '#2563eb',
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
  },
  defaultPlan: {
    borderColor: colors.border,
  },
  silverPlan: {
    borderColor: '#9ca3af',
    backgroundColor: '#f9fafb',
  },
  goldPlan: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  platinumPlan: {
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIcon: {
    fontSize: 32,
    marginRight: 8,
  },
  planDisplayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  planHighlight: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  pricePeriod: {
    fontSize: 14,
    color: colors.textLight,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Payment styles
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  planSummary: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  planDuration: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  paymentSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  upiDetails: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  upiLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  upiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  upiId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  copyButton: {
    padding: 4,
  },
  merchantName: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    paddingLeft: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
});