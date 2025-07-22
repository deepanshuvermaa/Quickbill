import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { apiCall, authenticatedApiCall, API_ENDPOINTS } from '@/utils/api';
import { subscriptionManager } from '@/utils/subscription-manager';
import QRCode from 'react-native-qrcode-svg';

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

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  plan: Plan | null;
  onPaymentComplete: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ visible, onClose, plan, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'qr' | 'verify'>('select');
  const [paymentIds, setPaymentIds] = useState<any>(null);
  const { token } = useAuthStore();

  const paymentMethods = [
    { id: 'razorpay', name: 'Card/UPI/NetBanking', icon: '💳' },
    { id: 'upi_qr', name: 'UPI QR Code', icon: '📱' },
    { id: 'paytm', name: 'Paytm', icon: '🔵' },
    { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
    { id: 'googlepay', name: 'Google Pay', icon: '🌈' },
  ];

  const handlePaymentMethodSelect = async (method: string) => {
    if (!plan || !token) return;
    
    setPaymentMethod(method);
    setIsLoading(true);

    try {
      const response = await authenticatedApiCall(
        API_ENDPOINTS.SUBSCRIPTIONS.CREATE_ORDER,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            planId: plan.id,
            paymentMethod: method,
          }),
        }
      );

      if (method === 'razorpay') {
        // TODO: Integrate Razorpay SDK
        Alert.alert('Razorpay Integration', 'Razorpay payment will be integrated soon.');
        setIsLoading(false);
      } else {
        // QR Code payment
        setQrCodeData(response.data.qrCode);
        setPaymentIds({
          transactionId: response.data.transactionId,
          manualPaymentId: response.data.manualPaymentId,
        });
        setPaymentStep('qr');
        setIsLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create payment order');
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!transactionRef || !paymentIds || !token) {
      Alert.alert('Error', 'Please enter transaction reference number');
      return;
    }

    setIsLoading(true);
    try {
      await authenticatedApiCall(
        API_ENDPOINTS.SUBSCRIPTIONS.SUBMIT_REFERENCE,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            manualPaymentId: paymentIds.manualPaymentId,
            transactionReference: transactionRef,
          }),
        }
      );

      Alert.alert(
        'Payment Submitted',
        'Your payment has been submitted for verification. You will be notified once it is approved.',
        [{ text: 'OK', onPress: onPaymentComplete }]
      );
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit payment');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setPaymentMethod('');
    setQrCodeData('');
    setTransactionRef('');
    setPaymentStep('select');
    setPaymentIds(null);
  };

  useEffect(() => {
    if (!visible) {
      resetModal();
    }
  }, [visible]);

  if (!plan) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold">Complete Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {paymentStep === 'select' && (
            <>
              <View className="bg-gray-50 p-4 rounded-lg mb-6">
                <Text className="text-lg font-semibold">{plan.displayName}</Text>
                <Text className="text-2xl font-bold text-primary mt-1">₹{plan.price}</Text>
                <Text className="text-gray-600">for {plan.duration} days</Text>
              </View>

              <Text className="text-lg font-semibold mb-4">Select Payment Method</Text>
              
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => handlePaymentMethodSelect(method.id)}
                  className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-3"
                  disabled={isLoading}
                >
                  <Text className="text-2xl mr-4">{method.icon}</Text>
                  <Text className="text-base flex-1">{method.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </>
          )}

          {paymentStep === 'qr' && qrCodeData && (
            <>
              <Text className="text-lg font-semibold mb-4">Scan QR Code to Pay</Text>
              
              <View className="items-center mb-6">
                <View className="bg-white p-4 rounded-lg shadow-lg">
                  <QRCode value={qrCodeData} size={200} />
                </View>
                <Text className="text-gray-600 mt-4 text-center">
                  Scan with any UPI app to pay ₹{plan.price}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setPaymentStep('verify')}
                className="bg-primary p-4 rounded-lg mb-3"
              >
                <Text className="text-white text-center font-semibold">
                  I have completed the payment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentStep('select')}
                className="p-4"
              >
                <Text className="text-gray-600 text-center">
                  Choose different payment method
                </Text>
              </TouchableOpacity>
            </>
          )}

          {paymentStep === 'verify' && (
            <>
              <Text className="text-lg font-semibold mb-4">Enter Transaction Details</Text>
              
              <Text className="text-gray-600 mb-4">
                Please enter the transaction reference number from your payment app
              </Text>

              <TextInput
                value={transactionRef}
                onChangeText={setTransactionRef}
                placeholder="Transaction Reference Number"
                className="border border-gray-300 rounded-lg p-4 mb-6"
                autoCapitalize="characters"
              />

              <TouchableOpacity
                onPress={handleVerifyPayment}
                disabled={isLoading || !transactionRef}
                className={`p-4 rounded-lg ${
                  isLoading || !transactionRef ? 'bg-gray-300' : 'bg-primary'
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold">
                    Submit for Verification
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentStep('qr')}
                className="p-4 mt-2"
              >
                <Text className="text-gray-600 text-center">Back to QR Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function SubscriptionScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { subscription, checkSubscriptionStatus } = useAuthStore();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.SUBSCRIPTIONS.PLANS);
      setPlans(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async () => {
    setShowPaymentModal(false);
    await checkSubscriptionStatus();
    router.back();
  };

  const getPlanIcon = (tierLevel: string) => {
    switch (tierLevel) {
      case 'silver':
        return '🥈';
      case 'gold':
        return '🥇';
      case 'platinum':
        return '💎';
      default:
        return '📦';
    }
  };

  const getPlanColor = (tierLevel: string) => {
    switch (tierLevel) {
      case 'silver':
        return 'border-gray-400 bg-gray-50';
      case 'gold':
        return 'border-yellow-500 bg-yellow-50';
      case 'platinum':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-2">Choose Your Plan</Text>
        <Text className="text-gray-600 mb-6">
          Select the perfect plan for your business needs
        </Text>

        {subscription?.isTrial && subscription?.trialDaysRemaining && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <Text className="text-blue-800 font-semibold">
              Free Trial: {subscription.trialDaysRemaining} days remaining
            </Text>
            <Text className="text-blue-600 text-sm mt-1">
              You have full access to all Platinum features during your trial
            </Text>
          </View>
        )}

        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            onPress={() => handleSelectPlan(plan)}
            className={`border-2 rounded-lg p-6 mb-4 ${getPlanColor(plan.tierLevel)}`}
          >
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-3xl mr-2">{getPlanIcon(plan.tierLevel)}</Text>
                  <Text className="text-xl font-bold">{plan.displayName}</Text>
                </View>
                {plan.highlight && (
                  <Text className="text-sm text-gray-600 mt-1">{plan.highlight}</Text>
                )}
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold">₹{plan.price}</Text>
                <Text className="text-sm text-gray-600">per month</Text>
              </View>
            </View>

            <View className="space-y-2">
              {plan.features
                .filter((f) => f.enabled)
                .map((feature, index) => (
                  <View key={index} className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text className="ml-2 text-gray-700">{feature.name}</Text>
                  </View>
                ))}
              
              {plan.maxUsers > 1 && (
                <View className="flex-row items-center">
                  <Ionicons name="people" size={20} color="#10b981" />
                  <Text className="ml-2 text-gray-700">Up to {plan.maxUsers} users</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => handleSelectPlan(plan)}
              className="bg-primary mt-4 py-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                Choose {plan.displayName}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View className="mt-6 p-4 bg-gray-100 rounded-lg">
          <Text className="text-sm text-gray-600 text-center">
            All plans include unlimited bills, items, and customers.
            {'\n'}
            Cancel anytime. No hidden fees.
          </Text>
        </View>
      </View>

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
        onPaymentComplete={handlePaymentComplete}
      />
    </ScrollView>
  );
}