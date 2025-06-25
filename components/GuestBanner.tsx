import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { User, Lock, LogIn } from 'lucide-react-native';

export const GuestBanner = () => {
  const router = useRouter();
  const { isGuestMode, isAuthenticated, user } = useAuthStore();
  
  // Debug: console.log('GuestBanner render:', { isGuestMode, isAuthenticated });
  
  if (!isGuestMode) return null;
  
  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.info}>
          <User size={20} color={colors.warning} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Guest Mode</Text>
            <Text style={styles.message}>
              You're using limited features. Login for full access.
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => {
            // Debug: console.log('Guest banner login button pressed');
            router.push('/auth/login' as any);
          }}
        >
          <LogIn size={16} color={colors.white} />
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.features}>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>✓ Dashboard</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>✓ Billing</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>✓ View Items</Text>
        </View>
        <View style={styles.featureItem}>
          <Lock size={12} color={colors.textLight} />
          <Text style={styles.restrictedText}>History, Reports, Customers & More</Text>
        </View>
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
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    color: colors.warning,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '500',
  },
  restrictedText: {
    fontSize: 10,
    color: colors.textLight,
    marginLeft: 4,
  },
});