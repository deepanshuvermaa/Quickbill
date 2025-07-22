import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import { useSubscriptionManager } from '@/utils/subscription-manager';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/utils/navigation';
import { AlertTriangle, Crown, Clock, X, AlertCircle } from 'lucide-react-native';
import { authenticatedApiCall, API_ENDPOINTS } from '@/utils/api';

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
  
  const warning = subscriptionManager.getSubscriptionWarning();
  const daysRemaining = subscriptionManager.getDaysRemaining();
  const isInGracePeriod = subscriptionManager.isInGracePeriod();

  // Don't show banner if user is not authenticated and not in guest mode
  if (!isAuthenticated && !isGuestMode) {
    return null;
  }

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
    
    if (isInGracePeriod) {
      return styles.gracePeriodBanner;
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
    
    if (isInGracePeriod) {
      return <AlertCircle size={20} color={colors.danger} />;
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
    
    if (subscription.isTrial) {
      return 'Choose Plan';
    }
    
    return 'Manage';
  };

  const handleAction = () => {
    if (isGuestMode) {
      router.push('/auth/register');
    } else {
      router.push('/auth/subscription');
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
            activeOpacity={0.8}
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
  const isInGracePeriod = subscriptionManager.isInGracePeriod();

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
          onPress={() => router.push('/auth/subscription')}
        >
          <Text style={styles.statusButtonText}>View Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const daysRemaining = subscriptionManager.getDaysRemaining();
  const limits = subscriptionManager.getCurrentLimits();

  return (
    <TouchableOpacity 
      style={styles.statusCard}
      onPress={() => router.push('/auth/subscription')}
      activeOpacity={0.9}
    >
      <View style={styles.statusHeader}>
        <Crown size={24} color={colors.success} />
        <Text style={styles.statusTitle}>
          {subscriptionManager.getPlanDisplayName(subscription.plan)} Plan
        </Text>
      </View>
      
      <View style={styles.statusDetails}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[
            styles.statusValue,
            subscription.status === 'active' || subscription.status === 'trial' ? styles.activeStatus : 
            isInGracePeriod ? styles.graceStatus : styles.expiredStatus
          ]}>
            {subscription.status === 'active' || subscription.status === 'trial' ? 'Active' : 
             isInGracePeriod ? 'Grace Period' : 'Expired'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Days Remaining:</Text>
          <Text style={styles.statusValue}>{daysRemaining}</Text>
        </View>
        
        {subscription.isTrial && (
          <View style={styles.limitsInfo}>
            <Text style={styles.limitsTitle}>Trial Features:</Text>
            <Text style={styles.limitsText}>
              • Full Platinum access
            </Text>
            <Text style={styles.limitsText}>
              • All features unlocked
            </Text>
            <Text style={styles.limitsText}>
              • {subscription.trialDaysRemaining || daysRemaining} days remaining
            </Text>
          </View>
        )}
        
        {subscription.tierLevel && !subscription.isTrial && (
          <View style={[styles.tierBadge, styles[`tier_${subscription.tierLevel}`]]}>
            <Text style={styles.tierBadgeText}>
              {subscription.tierLevel.toUpperCase()} TIER
            </Text>
          </View>
        )}
      </View>
      
      {(subscription.status === 'expired' || subscription.isTrial || isInGracePeriod) && (
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => router.push('/auth/subscription')}
        >
          <Text style={styles.statusButtonText}>
            {subscription.status === 'expired' ? 'Renew' : subscription.isTrial ? 'Choose Plan' : 'Renew Now'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// Grace Period Notification Component
export const GracePeriodNotification: React.FC = () => {
  const { subscription, token } = useAuthStore();
  const subscriptionManager = useSubscriptionManager();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subscription?.status === 'grace_period' && token) {
      loadNotifications();
    }
  }, [subscription, token]);

  const loadNotifications = async () => {
    if (!token) return;
    
    try {
      const response = await authenticatedApiCall(
        API_ENDPOINTS.SUBSCRIPTIONS.GRACE_NOTIFICATIONS,
        token
      );
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to load grace notifications:', error);
    }
  };

  const acknowledgeNotification = async (notificationId: number) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      await authenticatedApiCall(
        API_ENDPOINTS.SUBSCRIPTIONS.ACKNOWLEDGE_NOTIFICATION,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ notificationId }),
        }
      );
      
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      Alert.alert('Error', 'Failed to acknowledge notification');
    } finally {
      setIsLoading(false);
    }
  };

  if (!subscription || subscription.status !== 'grace_period' || notifications.length === 0) {
    return null;
  }

  const daysRemaining = subscriptionManager.getDaysRemaining();

  return (
    <View style={styles.gracePeriodNotification}>
      <View style={styles.notificationHeader}>
        <AlertCircle size={24} color={colors.danger} />
        <Text style={styles.notificationTitle}>Grace Period Active</Text>
      </View>
      
      <Text style={styles.notificationMessage}>
        Your subscription has expired. You have {daysRemaining} days remaining to renew and backup your data.
      </Text>
      
      <View style={styles.notificationActions}>
        <TouchableOpacity
          style={[styles.notificationButton, styles.primaryButton]}
          onPress={() => router.push('/auth/subscription')}
        >
          <Text style={styles.primaryButtonText}>Renew Now</Text>
        </TouchableOpacity>
        
        {notifications[0] && (
          <TouchableOpacity
            style={[styles.notificationButton, styles.secondaryButton]}
            onPress={() => acknowledgeNotification(notifications[0].id)}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
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
  gracePeriodBanner: {
    backgroundColor: `${colors.danger}25`,
    borderWidth: 2,
    borderColor: colors.danger,
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
  graceStatus: {
    color: colors.warning,
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
  tierBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  tier_silver: {
    backgroundColor: '#9CA3AF',
  },
  tier_gold: {
    backgroundColor: '#F59E0B',
  },
  tier_platinum: {
    backgroundColor: '#8B5CF6',
  },
  tierBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gracePeriodNotification: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.danger,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.danger,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.grayLight,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});