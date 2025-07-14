import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from '@/utils/navigation';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionManager } from '@/utils/subscription-manager';
import { apiCall, authenticatedApiCall, API_ENDPOINTS } from '@/utils/api';
import {
  ChevronLeft,
  Crown,
  Check,
  Zap,
  Clock,
  Users,
  FileText,
  Printer,
  Download,
  Cloud,
  Headphones,
  Star
} from 'lucide-react-native';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_quarterly: number;
  price_yearly: number;
  duration_days: number;
  features: {
    maxBills: number;
    maxItems: number;
    reports: boolean;
    support: string;
    bluetooth?: boolean;
    discount?: string;
  };
  is_active: boolean;
}

export default function SubscriptionPlansScreen() {
  const navigation = useNavigation();
  const { subscription, token, isAuthenticated } = useAuthStore();
  const subscriptionManager = useSubscriptionManager();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall(API_ENDPOINTS.SUBSCRIPTIONS.PLANS);
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (planName: string) => {
    if (planName === 'trial') return; // Can't manually select trial
    setSelectedPlan(planName);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !token) {
      Alert.alert('Error', 'Please select a plan and ensure you are logged in');
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Create payment order
      const response = await authenticatedApiCall(
        API_ENDPOINTS.SUBSCRIPTIONS.CREATE_ORDER,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            plan: selectedPlan,
            paymentMethod: 'razorpay'
          })
        }
      );

      if (response.success) {
        // TODO: Integrate with Razorpay SDK
        // For now, show mock payment success
        Alert.alert(
          'Payment Integration',
          'Payment gateway integration will be completed in the next update. For now, your subscription has been activated for testing.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Mock successful payment verification
                mockPaymentSuccess(response.data.transactionId);
              }
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create payment order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const mockPaymentSuccess = async (transactionId: number) => {
    try {
      const mockPaymentData = {
        transactionId,
        paymentId: `pay_mock_${Date.now()}`,
        orderId: `order_mock_${Date.now()}`,
        signature: `signature_mock_${Date.now()}`
      };

      const response = await authenticatedApiCall(
        API_ENDPOINTS.SUBSCRIPTIONS.VERIFY_PAYMENT,
        token!,
        {
          method: 'POST',
          body: JSON.stringify(mockPaymentData)
        }
      );

      if (response.success) {
        Alert.alert(
          'Success!',
          'Your subscription has been activated successfully!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Refresh subscription status
                useAuthStore.getState().checkSubscriptionStatus();
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      Alert.alert('Error', 'Payment verification failed');
    }
  };

  const renderPlanFeatures = (plan: Plan) => {
    const features = [
      {
        icon: <FileText size={16} color={colors.success} />,
        text: plan.features.maxBills === -1 ? 'Unlimited Bills' : `${plan.features.maxBills} Bills`,
        included: true
      },
      {
        icon: <Users size={16} color={colors.success} />,
        text: plan.features.maxItems === -1 ? 'Unlimited Items' : `${plan.features.maxItems} Items`,
        included: true
      },
      {
        icon: <FileText size={16} color={colors.success} />,
        text: 'Reports & Analytics',
        included: plan.features.reports
      },
      {
        icon: <Printer size={16} color={colors.success} />,
        text: 'Bluetooth Printing',
        included: plan.features.bluetooth || false
      },
      {
        icon: <Download size={16} color={colors.success} />,
        text: 'Export Data',
        included: plan.name !== 'trial'
      },
      {
        icon: <Cloud size={16} color={colors.success} />,
        text: 'Cloud Sync',
        included: plan.name !== 'trial'
      },
      {
        icon: <Headphones size={16} color={colors.success} />,
        text: plan.features.support === 'priority' ? 'Priority Support' : 'Email Support',
        included: true
      }
    ];

    return (
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            {feature.included ? (
              <Check size={16} color={colors.success} />
            ) : (
              <View style={styles.featureDisabled}>
                <Text style={styles.featureDisabledText}>×</Text>
              </View>
            )}
            <Text style={[
              styles.featureText,
              !feature.included && styles.featureTextDisabled
            ]}>
              {feature.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPlanCard = (plan: Plan) => {
    const isCurrentPlan = subscription?.plan === plan.name;
    const isSelected = selectedPlan === plan.name;
    const isTrial = plan.name === 'trial';
    const isPopular = plan.name === 'quarterly';

    let price = 0;
    let priceLabel = '';
    let originalPrice = 0;

    switch (plan.name) {
      case 'monthly':
        price = plan.price_monthly;
        priceLabel = '/month';
        break;
      case 'quarterly':
        price = plan.price_quarterly;
        priceLabel = '/quarter';
        originalPrice = plan.price_monthly * 3;
        break;
      case 'yearly':
        price = plan.price_yearly;
        priceLabel = '/year';
        originalPrice = plan.price_monthly * 12;
        break;
    }

    return (
      <TouchableOpacity
        key={plan.name}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          isCurrentPlan && styles.currentPlanCard,
          isPopular && styles.popularPlanCard
        ]}
        onPress={() => !isTrial && handleSelectPlan(plan.name)}
        disabled={isTrial || isCurrentPlan}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Star size={12} color={colors.white} />
            <Text style={styles.popularBadgeText}>POPULAR</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={styles.planTitleContainer}>
            <Crown size={24} color={isTrial ? colors.gray : colors.primary} />
            <Text style={styles.planTitle}>{plan.display_name}</Text>
          </View>

          {!isTrial && (
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.price}>{price}</Text>
              <Text style={styles.priceLabel}>{priceLabel}</Text>
            </View>
          )}

          {originalPrice > price && price > 0 && (
            <View style={styles.discountContainer}>
              <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              <Text style={styles.discountText}>
                Save ₹{originalPrice - price}
              </Text>
            </View>
          )}
        </View>

        {renderPlanFeatures(plan)}

        <View style={styles.planFooter}>
          {isTrial ? (
            <View style={styles.trialInfo}>
              <Clock size={16} color={colors.warning} />
              <Text style={styles.trialText}>7 Days Free</Text>
            </View>
          ) : isCurrentPlan ? (
            <View style={styles.currentPlanBadge}>
              <Check size={16} color={colors.success} />
              <Text style={styles.currentPlanText}>Current Plan</Text>
            </View>
          ) : (
            <View style={styles.selectButton}>
              <Text style={styles.selectButtonText}>
                {isSelected ? 'Selected' : 'Select Plan'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </View>
    );
  }

  const currentLimits = subscriptionManager.getCurrentLimits();
  const daysRemaining = subscriptionManager.getDaysRemaining();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Subscription Plans',
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {subscription && (
          <Card style={styles.currentStatusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Current Status</Text>
              <View style={[
                styles.statusBadge,
                subscription.status === 'active' ? styles.activeBadge : styles.expiredBadge
              ]}>
                <Text style={styles.statusBadgeText}>
                  {subscription.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.statusDetails}>
              <Text style={styles.statusPlan}>
                {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
              </Text>
              <Text style={styles.statusDays}>
                {daysRemaining} days remaining
              </Text>
              
              {subscription.plan === 'trial' && (
                <View style={styles.trialLimits}>
                  <Text style={styles.limitsTitle}>Current Usage Limits:</Text>
                  <Text style={styles.limitsText}>
                    • {currentLimits.maxBills} bills maximum
                  </Text>
                  <Text style={styles.limitsText}>
                    • {currentLimits.maxItems} items maximum
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <Text style={styles.sectionSubtitle}>
            Upgrade to unlock unlimited features and priority support
          </Text>

          <View style={styles.plansGrid}>
            {plans.map(renderPlanCard)}
          </View>
        </View>

        {selectedPlan && (
          <Card style={styles.actionCard}>
            <Button
              title={isCreatingOrder ? "Processing..." : "Subscribe Now"}
              onPress={handleSubscribe}
              disabled={isCreatingOrder || !isAuthenticated}
              icon={isCreatingOrder ? null : <Zap size={18} color={colors.white} />}
              style={styles.subscribeButton}
            >
              {isCreatingOrder && (
                <ActivityIndicator size="small" color={colors.white} style={styles.loadingIcon} />
              )}
            </Button>

            <Text style={styles.termsText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              Your subscription will auto-renew unless cancelled.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  content: {
    flex: 1,
  },
  currentStatusCard: {
    margin: 16,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: colors.success,
  },
  expiredBadge: {
    backgroundColor: colors.danger,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  statusDetails: {
    marginTop: 8,
  },
  statusPlan: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  statusDays: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  trialLimits: {
    backgroundColor: colors.grayLight,
    padding: 12,
    borderRadius: 8,
  },
  limitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  limitsText: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 2,
  },
  plansContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  currentPlanCard: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}05`,
  },
  popularPlanCard: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}05`,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: 20,
    right: 20,
    backgroundColor: colors.warning,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  planHeader: {
    marginBottom: 20,
    marginTop: 8,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  priceLabel: {
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 4,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  featureTextDisabled: {
    color: colors.textLight,
  },
  featureDisabled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureDisabledText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  planFooter: {
    marginTop: 8,
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: `${colors.warning}20`,
    borderRadius: 8,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 4,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: `${colors.success}20`,
    borderRadius: 8,
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 4,
  },
  selectButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  actionCard: {
    margin: 16,
    padding: 20,
  },
  subscribeButton: {
    marginBottom: 12,
  },
  loadingIcon: {
    marginRight: 8,
  },
  termsText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});