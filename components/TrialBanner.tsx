import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { Clock, AlertTriangle } from 'lucide-react-native';
import { navigateToSubscription } from '@/utils/subscription-navigation';

export const TrialBanner = () => {
  const router = useRouter();
  const { subscription } = useAuthStore();
  
  if (!subscription) return null;
  
  const daysRemaining = subscription.daysRemaining;
  const isInGracePeriod = subscription.isInGracePeriod;
  const isTrialNearExpiry = daysRemaining <= 7 && subscription.plan === 'trial';
  const isSubscriptionExpired = subscription.status === 'expired';
  
  // Don't show banner if everything is fine
  if (
    !isTrialNearExpiry && 
    !isInGracePeriod && 
    !isSubscriptionExpired && 
    subscription.status === 'active'
  ) {
    return null;
  }
  
  const getBannerConfig = () => {
    if (isSubscriptionExpired && isInGracePeriod) {
      return {
        backgroundColor: colors.danger + '20',
        borderColor: colors.danger,
        textColor: colors.danger,
        icon: <AlertTriangle size={16} color={colors.danger} />,
        title: 'Grace Period',
        message: `Your subscription expired. ${daysRemaining} days left to renew.`,
        buttonText: 'Renew Now',
        urgent: true,
      };
    }
    
    if (isSubscriptionExpired) {
      return {
        backgroundColor: colors.danger + '30',
        borderColor: colors.danger,
        textColor: colors.danger,
        icon: <AlertTriangle size={16} color={colors.danger} />,
        title: 'Subscription Expired',
        message: 'Your subscription has expired. Please renew to continue using the app.',
        buttonText: 'Renew Now',
        urgent: true,
      };
    }
    
    if (isTrialNearExpiry) {
      return {
        backgroundColor: colors.warning + '20',
        borderColor: colors.warning,
        textColor: colors.warning,
        icon: <Clock size={16} color={colors.warning} />,
        title: 'Trial Ending Soon',
        message: `Your free trial ends in ${daysRemaining} days.`,
        buttonText: 'Subscribe Now',
        urgent: daysRemaining <= 3,
      };
    }
    
    return null;
  };
  
  const config = getBannerConfig();
  if (!config) return null;
  
  return (
    <View style={[
      styles.banner,
      { 
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.info}>
          {config.icon}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: config.textColor }]}>
              {config.title}
            </Text>
            <Text style={[styles.message, { color: config.textColor }]}>
              {config.message}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.button,
            { 
              backgroundColor: config.textColor,
              borderColor: config.textColor,
            }
          ]}
          onPress={() => navigateToSubscription()}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            {config.buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});