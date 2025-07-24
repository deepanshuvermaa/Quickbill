import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { useSubscriptionManager } from '@/utils/subscription-manager';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/utils/navigation';
import { navigateToSubscription } from '@/utils/subscription-navigation';
import { AlertTriangle, Crown, Clock, X } from 'lucide-react-native';

interface SubscriptionBannerProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({
  onDismiss,
  showDismiss = false
}) => {
  const subscriptionManager = useSubscriptionManager();
  const { subscription, isGuestMode, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Don't show banner if user is not authenticated and not in guest mode
  if (!isAuthenticated && !isGuestMode) {
    return null;
  }

  const warning = subscriptionManager.getSubscriptionWarning();
  const daysRemaining = subscriptionManager.getDaysRemaining();

  // Don't show banner if no warning
  if (!warning && !isGuestMode) {
    return null;
  }

  const getBannerStyle = () => {
    if (isGuestMode) {
      return styles.guestBanner;
    }
    
    if (!subscription || subscription.status === 'expired') {
      return styles.expiredBanner;
    }
    
    if (daysRemaining <= 3) {
      return styles.urgentBanner;
    }
    
    if (daysRemaining <= 7) {
      return styles.warningBanner;
    }
    
    return styles.infoBanner;
  };

  const getIcon = () => {
    if (isGuestMode) {
      return <Crown size={20} color={colors.primary} />;
    }
    
    if (!subscription || subscription.status === 'expired') {
      return <AlertTriangle size={20} color={colors.white} />;
    }
    
    return <Clock size={20} color={colors.warning} />;
  };

  const getMessage = () => {
    if (isGuestMode) {
      return 'You\'re using Guest Mode. Sign up to save your data and access all features.';
    }
    
    return warning;
  };

  const getActionText = () => {
    if (isGuestMode) {
      return 'Sign Up';
    }
    
    if (!subscription || subscription.status === 'expired') {
      return 'Renew Now';
    }
    
    if (subscription.plan === 'trial') {
      return 'Upgrade';
    }
    
    return 'Extend';
  };

  const handleAction = () => {
    if (isGuestMode) {
      router.push('/auth/register');
    } else {
      navigateToSubscription();
    }
  };

  return (
    <View style={[styles.banner, getBannerStyle()]}>
      <View style={styles.bannerContent}>
        <View style={styles.bannerLeft}>
          {getIcon()}
          <Text style={styles.bannerText}>{getMessage()}</Text>
        </View>
        
        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAction}
          >
            <Text style={styles.actionButtonText}>{getActionText()}</Text>
          </TouchableOpacity>
          
          {showDismiss && onDismiss && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
            >
              <X size={16} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export const SubscriptionStatusCard: React.FC = () => {
  const subscriptionManager = useSubscriptionManager();
  const { subscription, isGuestMode, isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  if (isGuestMode) {
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Crown size={24} color={colors.primary} />
          <Text style={styles.statusTitle}>Guest Mode</Text>
        </View>
        <Text style={styles.statusMessage}>
          Limited features available. Sign up to unlock everything!
        </Text>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={styles.statusButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <AlertTriangle size={24} color={colors.warning} />
          <Text style={styles.statusTitle}>No Active Subscription</Text>
        </View>
        <Text style={styles.statusMessage}>
          Choose a plan to start using QuickBill
        </Text>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => navigateToSubscription()}
        >
          <Text style={styles.statusButtonText}>View Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const daysRemaining = subscriptionManager.getDaysRemaining();
  const limits = subscriptionManager.getCurrentLimits();

  return (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Crown size={24} color={colors.success} />
        <Text style={styles.statusTitle}>
          {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
        </Text>
      </View>
      
      <View style={styles.statusDetails}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[
            styles.statusValue,
            subscription.status === 'active' ? styles.activeStatus : styles.expiredStatus
          ]}>
            {subscription.status === 'active' ? 'Active' : 'Expired'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Days Remaining:</Text>
          <Text style={styles.statusValue}>{daysRemaining}</Text>
        </View>
        
        {subscription.plan === 'trial' && (
          <View style={styles.limitsInfo}>
            <Text style={styles.limitsTitle}>Current Limits:</Text>
            <Text style={styles.limitsText}>
              • {limits.maxBills} bills maximum
            </Text>
            <Text style={styles.limitsText}>
              • {limits.maxItems} items maximum
            </Text>
            <Text style={styles.limitsText}>
              • 7 days trial period
            </Text>
          </View>
        )}
      </View>
      
      {(subscription.status === 'expired' || subscription.plan === 'trial') && (
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => navigateToSubscription()}
        >
          <Text style={styles.statusButtonText}>
            {subscription.status === 'expired' ? 'Renew' : 'Upgrade'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
  },
  guestBanner: {
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  warningBanner: {
    backgroundColor: `${colors.warning}15`,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  urgentBanner: {
    backgroundColor: `${colors.danger}15`,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  expiredBanner: {
    backgroundColor: colors.danger,
  },
  infoBanner: {
    backgroundColor: `${colors.info}15`,
    borderWidth: 1,
    borderColor: colors.info,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    lineHeight: 18,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  statusDetails: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  activeStatus: {
    color: colors.success,
  },
  expiredStatus: {
    color: colors.danger,
  },
  limitsInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.grayLight,
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
  statusButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});