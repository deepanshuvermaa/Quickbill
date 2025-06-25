import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Button } from './Button';
import { Lock, User, CreditCard } from 'lucide-react-native';

interface LoginToContinueProps {
  title?: string;
  message?: string;
  feature?: string;
}

export const LoginToContinue = ({ 
  title = "Login Required", 
  message = "Please login to access this feature",
  feature
}: LoginToContinueProps) => {
  const router = useRouter();
  
  const getFeatureSpecificContent = () => {
    switch (feature) {
      case 'customers':
        return {
          icon: <User size={64} color={colors.primary} />,
          title: 'Customer Management',
          message: 'Login to manage your customer database, track purchase history, and build stronger relationships.',
        };
      case 'expenses':
        return {
          icon: <CreditCard size={64} color={colors.primary} />,
          title: 'Expense Tracking',
          message: 'Login to track business expenses, categorize spending, and generate expense reports.',
        };
      case 'reports':
        return {
          icon: <Lock size={64} color={colors.primary} />,
          title: 'Advanced Reports',
          message: 'Login to access detailed sales reports, profit analysis, and business insights.',
        };
      case 'settings':
        return {
          icon: <Lock size={64} color={colors.primary} />,
          title: 'Account Settings',
          message: 'Login to manage your business profile, subscription, and app preferences.',
        };
      case 'history':
        return {
          icon: <Lock size={64} color={colors.primary} />,
          title: 'Bill History',
          message: 'Login to view your complete bill history, reprint receipts, and track payments.',
        };
      case 'items_management':
        return {
          icon: <Lock size={64} color={colors.primary} />,
          title: 'Inventory Management',
          message: 'Login to add, edit, and manage your inventory. Track stock levels and get low stock alerts.',
        };
      default:
        return {
          icon: <Lock size={64} color={colors.primary} />,
          title,
          message,
        };
    }
  };
  
  const content = getFeatureSpecificContent();
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {content.icon}
        </View>
        
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.message}>{content.message}</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Login to Continue"
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
          />
          
          <Button
            title="Create Account"
            onPress={() => router.push('/auth/register')}
            variant="outline"
            style={styles.registerButton}
          />
        </View>
        
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>With an account you get:</Text>
          <Text style={styles.benefit}>✓ Unlimited bills and customers</Text>
          <Text style={styles.benefit}>✓ Complete bill history</Text>
          <Text style={styles.benefit}>✓ Advanced reports and insights</Text>
          <Text style={styles.benefit}>✓ Inventory management</Text>
          <Text style={styles.benefit}>✓ Data backup and sync</Text>
          <Text style={styles.benefit}>✓ 30-day free trial</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 50,
    backgroundColor: colors.primary + '10',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  loginButton: {
    marginBottom: 12,
  },
  registerButton: {
    marginBottom: 0,
  },
  benefitsContainer: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  benefit: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
    paddingLeft: 8,
  },
});