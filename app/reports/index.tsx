import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { navigateToSubscription } from '@/utils/subscription-navigation';
import { 
  BarChart, 
  TrendingUp, 
  Package, 
  DollarSign, 
  ChevronRight,
  ArrowLeft,
  Lock
} from 'lucide-react-native';
import { useSubscriptionManager } from '@/utils/subscription-manager';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

export default function ReportsScreen() {
  const router = useRouter();
  const subscriptionManager = useSubscriptionManager();
  const { subscription } = useAuthStore();
  
  // Force refresh subscription data when entering this screen
  useSubscriptionCheck('reports');
  
  const renderReportCard = (
    title: string, 
    description: string, 
    icon: React.ReactNode, 
    route: string,
    requiredFeature?: string
  ) => {
    const hasAccess = !requiredFeature || subscriptionManager.hasFeatureAccess(requiredFeature);
    const upgradeRequired = requiredFeature ? subscriptionManager.getUpgradeRequiredForFeature(requiredFeature) : { required: false };
    
    return (
      <Card style={[styles.reportCard, !hasAccess && styles.lockedCard]}>
        <TouchableOpacity 
          style={styles.reportCardContent}
          onPress={() => {
            if (hasAccess) {
              router.push(route);
            } else {
              navigateToSubscription();
            }
          }}
          disabled={!hasAccess && !upgradeRequired.required}
        >
          <View style={[styles.reportIconContainer, !hasAccess && styles.lockedIconContainer]}>
            {hasAccess ? icon : <Lock size={24} color={colors.gray} />}
          </View>
          <View style={styles.reportInfo}>
            <Text style={[styles.reportTitle, !hasAccess && styles.lockedTitle]}>{title}</Text>
            <Text style={[styles.reportDescription, !hasAccess && styles.lockedDescription]}>
              {hasAccess ? description : `Upgrade to ${subscriptionManager.getPlanDisplayName(upgradeRequired.minPlan || 'silver')} to unlock`}
            </Text>
          </View>
          <ChevronRight size={20} color={hasAccess ? colors.gray : colors.border} />
        </TouchableOpacity>
      </Card>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Reports',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Business Reports</Text>
        
        {renderReportCard(
          "Sales Report",
          "View sales data, trends, and performance metrics",
          <BarChart size={24} color={colors.primary} />,
          "/reports/sales",
          "bill_reports"
        )}
        
        {renderReportCard(
          "Inventory Report",
          "Track stock levels, popular items, and inventory value",
          <Package size={24} color={colors.secondary} />,
          "/reports/inventory",
          "inventory_reports"
        )}
        
        {renderReportCard(
          "Expense Report",
          "Analyze expenses by category and time period",
          <DollarSign size={24} color={colors.danger} />,
          "/reports/expenses",
          "bill_reports"
        )}
        
        {renderReportCard(
          "Profit & Loss",
          "View income, expenses, and overall business performance",
          <TrendingUp size={24} color={colors.success} />,
          "/reports/profit-loss",
          "tax_reports"
        )}
        
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            Reports provide valuable insights into your business performance. 
            Use these tools to make data-driven decisions and identify areas for improvement.
          </Text>
        </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  reportCard: {
    marginBottom: 16,
  },
  reportCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  noteContainer: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  lockedCard: {
    opacity: 0.7,
  },
  lockedIconContainer: {
    backgroundColor: `${colors.gray}20`,
  },
  lockedTitle: {
    color: colors.textLight,
  },
  lockedDescription: {
    color: colors.gray,
    fontStyle: 'italic',
  },
});