import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import { useSubscriptionManager } from '@/utils/subscription-manager';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/utils/navigation';
import { AlertTriangle, CreditCard, Crown, Lock } from 'lucide-react-native';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature: string;
  showUpgrade?: boolean;
  fallback?: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature,
  showUpgrade = true,
  fallback
}) => {
  const subscriptionManager = useSubscriptionManager();
  const { subscription, isGuestMode } = useAuthStore();
  const router = useRouter();

  const hasAccess = subscriptionManager.hasFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  // Show appropriate upgrade message
  const renderUpgradeMessage = () => {
    if (isGuestMode) {
      return (
        <View style={styles.upgradeContainer}>
          <View style={styles.iconContainer}>
            <Lock size={32} color={colors.warning} />
          </View>
          <Text style={styles.upgradeTitle}>Sign Up Required</Text>
          <Text style={styles.upgradeMessage}>
            Please create an account to access this feature
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.upgradeButtonText}>Sign Up Now</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!subscription) {
      return (
        <View style={styles.upgradeContainer}>
          <View style={styles.iconContainer}>
            <Crown size={32} color={colors.warning} />
          </View>
          <Text style={styles.upgradeTitle}>Subscription Required</Text>
          <Text style={styles.upgradeMessage}>
            Choose a plan to access this feature
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/subscription-plans')}
          >
            <Text style={styles.upgradeButtonText}>View Plans</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const limits = subscriptionManager.getCurrentLimits();
    const warning = subscriptionManager.getSubscriptionWarning();

    return (
      <View style={styles.upgradeContainer}>
        <View style={styles.iconContainer}>
          <CreditCard size={32} color={colors.danger} />
        </View>
        <Text style={styles.upgradeTitle}>
          {subscription.status === 'expired' ? 'Subscription Expired' : 'Upgrade Required'}
        </Text>
        <Text style={styles.upgradeMessage}>
          {warning || 'Upgrade your plan to access this feature'}
        </Text>
        
        {subscription.plan === 'trial' && (
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanText}>Current Plan: Free Trial</Text>
            <Text style={styles.limitsText}>
              • {limits.maxBills} bills limit
              • {limits.maxItems} items limit
              • Basic features only
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => {
            if (subscription.status === 'expired') {
              router.push('/subscription-plans');
            } else {
              router.push('/subscription-plans');
            }
          }}
        >
          <Text style={styles.upgradeButtonText}>
            {subscription.status === 'expired' ? 'Renew Subscription' : 'Upgrade Plan'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return renderUpgradeMessage();
};

interface LimitGuardProps {
  children: React.ReactNode;
  checkType: 'bills' | 'items' | 'customers';
  currentCount: number;
  actionName?: string;
}

export const LimitGuard: React.FC<LimitGuardProps> = ({
  children,
  checkType,
  currentCount,
  actionName = 'perform this action'
}) => {
  const subscriptionManager = useSubscriptionManager();

  const checkLimit = () => {
    switch (checkType) {
      case 'bills':
        return subscriptionManager.canCreateBill(currentCount);
      case 'items':
        return subscriptionManager.canAddItem(currentCount);
      // Add more cases as needed
      default:
        return { allowed: true };
    }
  };

  const { allowed, reason } = checkLimit();

  if (allowed) {
    return <>{children}</>;
  }

  // Show limit reached message
  return (
    <View style={styles.limitContainer}>
      <AlertTriangle size={24} color={colors.warning} />
      <Text style={styles.limitTitle}>Limit Reached</Text>
      <Text style={styles.limitMessage}>{reason}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  upgradeContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    margin: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.warning}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeMessage: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  currentPlanInfo: {
    backgroundColor: colors.grayLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  limitsText: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  limitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}20`,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
    margin: 16,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 8,
    marginRight: 8,
  },
  limitMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },
});