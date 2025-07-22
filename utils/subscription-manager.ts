import { useAuthStore } from '@/store/authStore';

export type SubscriptionPlan = 'trial' | 'silver' | 'gold' | 'platinum' | 'none';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'grace_period' | 'trial';

interface SubscriptionLimits {
  maxBills: number; // -1 for unlimited
  maxItems: number; // -1 for unlimited
  maxCustomers: number; // -1 for unlimited
  maxUsers: number; // Number of allowed user logins
  canPrint: boolean;
  canExport: boolean;
  canSync: boolean;
  hasReports: boolean;
  hasBillReports: boolean;
  hasItemReports: boolean;
  hasInventory: boolean;
  hasInventoryReports: boolean;
  hasTaxReports: boolean;
  hasCustomerDatabase: boolean;
  hasCustomerReports: boolean;
  hasUserReports: boolean;
  hasKotBilling: boolean;
  printerSupport: string[]; // ['bluetooth', 'usb', 'lan']
  hasPrioritySupport: boolean;
}

// Define limits for each plan
const PLAN_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  none: {
    maxBills: 0,
    maxItems: 0,
    maxCustomers: 0,
    maxUsers: 0,
    canPrint: false,
    canExport: false,
    canSync: false,
    hasReports: false,
    hasBillReports: false,
    hasItemReports: false,
    hasInventory: false,
    hasInventoryReports: false,
    hasTaxReports: false,
    hasCustomerDatabase: false,
    hasCustomerReports: false,
    hasUserReports: false,
    hasKotBilling: false,
    printerSupport: [],
    hasPrioritySupport: false,
  },
  trial: {
    maxBills: -1, // Unlimited during trial
    maxItems: -1,
    maxCustomers: -1,
    maxUsers: 1,
    canPrint: true,
    canExport: true,
    canSync: true,
    hasReports: true,
    hasBillReports: true,
    hasItemReports: true,
    hasInventory: true,
    hasInventoryReports: true,
    hasTaxReports: true,
    hasCustomerDatabase: true,
    hasCustomerReports: true,
    hasUserReports: true,
    hasKotBilling: true,
    printerSupport: ['bluetooth'], // Full Platinum features during trial
    hasPrioritySupport: true,
  },
  silver: {
    maxBills: -1,
    maxItems: -1,
    maxCustomers: -1,
    maxUsers: 1,
    canPrint: true,
    canExport: true,
    canSync: true,
    hasReports: true,
    hasBillReports: true,
    hasItemReports: true,
    hasInventory: false,
    hasInventoryReports: false,
    hasTaxReports: false,
    hasCustomerDatabase: false,
    hasCustomerReports: false,
    hasUserReports: false,
    hasKotBilling: false,
    printerSupport: ['bluetooth'],
    hasPrioritySupport: false,
  },
  gold: {
    maxBills: -1,
    maxItems: -1,
    maxCustomers: -1,
    maxUsers: 1, // Will be 3 when multi-user is implemented
    canPrint: true,
    canExport: true,
    canSync: true,
    hasReports: true,
    hasBillReports: true,
    hasItemReports: true,
    hasInventory: true,
    hasInventoryReports: true,
    hasTaxReports: true,
    hasCustomerDatabase: true,
    hasCustomerReports: true,
    hasUserReports: false,
    hasKotBilling: false,
    printerSupport: ['bluetooth', 'usb'],
    hasPrioritySupport: true,
  },
  platinum: {
    maxBills: -1,
    maxItems: -1,
    maxCustomers: -1,
    maxUsers: 1, // Will be 5 when multi-user is implemented
    canPrint: true,
    canExport: true,
    canSync: true,
    hasReports: true,
    hasBillReports: true,
    hasItemReports: true,
    hasInventory: true,
    hasInventoryReports: true,
    hasTaxReports: true,
    hasCustomerDatabase: true,
    hasCustomerReports: true,
    hasUserReports: true,
    hasKotBilling: true,
    printerSupport: ['bluetooth', 'usb', 'lan'],
    hasPrioritySupport: true,
  },
};

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  
  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  /**
   * Check if user has access to a specific feature
   */
  hasFeatureAccess(feature: string): boolean {
    const { isAuthenticated, isGuestMode, subscription } = useAuthStore.getState();
    
    // Guest mode has very limited access
    if (isGuestMode) {
      const guestFeatures = ['dashboard', 'billing', 'items_view'];
      return guestFeatures.includes(feature);
    }
    
    // Not authenticated and not guest
    if (!isAuthenticated) {
      return false;
    }
    
    // No subscription data
    if (!subscription) {
      return false;
    }
    
    // Check if subscription is active or in grace period
    if (!this.isSubscriptionActive(subscription)) {
      return false;
    }
    
    const limits = this.getCurrentLimits();
    
    // Feature-specific access control
    switch (feature) {
      case 'print':
        return limits.canPrint;
      case 'export':
        return limits.canExport;
      case 'sync':
        return limits.canSync;
      case 'reports':
        return limits.hasReports;
      case 'bill_reports':
        return limits.hasBillReports;
      case 'item_reports':
        return limits.hasItemReports;
      case 'inventory':
      case 'inventory_management':
        return limits.hasInventory;
      case 'inventory_reports':
        return limits.hasInventoryReports;
      case 'tax_reports':
        return limits.hasTaxReports;
      case 'customer_database':
        return limits.hasCustomerDatabase;
      case 'customer_reports':
        return limits.hasCustomerReports;
      case 'user_reports':
        return limits.hasUserReports;
      case 'kot_billing':
        return limits.hasKotBilling;
      case 'priority_support':
        return limits.hasPrioritySupport;
      case 'bluetooth_printing':
        return limits.printerSupport.includes('bluetooth');
      case 'usb_printing':
        return limits.printerSupport.includes('usb');
      case 'lan_printing':
        return limits.printerSupport.includes('lan');
      default:
        return true; // Basic features are available to all authenticated users
    }
  }

  /**
   * Check if user can create more bills
   */
  canCreateBill(currentBillCount: number): { allowed: boolean; reason?: string } {
    const { isAuthenticated, isGuestMode, subscription } = useAuthStore.getState();
    
    if (isGuestMode) {
      return { allowed: false, reason: 'Guest users cannot create bills. Please sign up to continue.' };
    }
    
    if (!isAuthenticated || !subscription) {
      return { allowed: false, reason: 'Please log in to create bills.' };
    }
    
    if (!this.isSubscriptionActive(subscription)) {
      return { allowed: false, reason: 'Your subscription has expired. Please renew to continue.' };
    }
    
    const limits = this.getCurrentLimits();
    
    if (limits.maxBills !== -1 && currentBillCount >= limits.maxBills) {
      return { 
        allowed: false, 
        reason: `You've reached your limit of ${limits.maxBills} bills. Upgrade your plan to create more.` 
      };
    }
    
    return { allowed: true };
  }

  /**
   * Check if user can add more items
   */
  canAddItem(currentItemCount: number): { allowed: boolean; reason?: string } {
    const { isAuthenticated, isGuestMode, subscription } = useAuthStore.getState();
    
    if (isGuestMode) {
      return { allowed: false, reason: 'Guest users cannot add items. Please sign up to continue.' };
    }
    
    if (!isAuthenticated || !subscription) {
      return { allowed: false, reason: 'Please log in to add items.' };
    }
    
    if (!this.isSubscriptionActive(subscription)) {
      return { allowed: false, reason: 'Your subscription has expired. Please renew to continue.' };
    }
    
    const limits = this.getCurrentLimits();
    
    if (limits.maxItems !== -1 && currentItemCount >= limits.maxItems) {
      return { 
        allowed: false, 
        reason: `You've reached your limit of ${limits.maxItems} items. Upgrade your plan to add more.` 
      };
    }
    
    return { allowed: true };
  }

  /**
   * Get current subscription limits
   */
  getCurrentLimits(): SubscriptionLimits {
    const { isAuthenticated, isGuestMode, subscription } = useAuthStore.getState();
    
    if (isGuestMode || !isAuthenticated || !subscription) {
      return PLAN_LIMITS.none;
    }
    
    // Map old plan names to new ones if necessary
    let plan = subscription.plan;
    if (['monthly', 'quarterly', 'yearly'].includes(plan)) {
      plan = 'silver'; // Default old plans to silver
    }
    
    return PLAN_LIMITS[plan as SubscriptionPlan] || PLAN_LIMITS.none;
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(subscription: any): boolean {
    if (!subscription) return false;
    
    const now = new Date().getTime();
    const endDate = new Date(subscription.endDate).getTime();
    const gracePeriodEnd = subscription.gracePeriodEnd ? new Date(subscription.gracePeriodEnd).getTime() : null;
    
    // Active subscription
    if ((subscription.status === 'active' || subscription.status === 'trial') && now <= endDate) {
      return true;
    }
    
    // In grace period
    if (subscription.status === 'grace_period' && gracePeriodEnd && now <= gracePeriodEnd) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if in grace period
   */
  isInGracePeriod(): boolean {
    const { subscription } = useAuthStore.getState();
    
    if (!subscription) return false;
    
    return subscription.status === 'grace_period';
  }

  /**
   * Get days remaining in subscription
   */
  getDaysRemaining(): number {
    const { subscription } = useAuthStore.getState();
    
    if (!subscription) return 0;
    
    const now = new Date().getTime();
    const endDate = new Date(subscription.endDate).getTime();
    const gracePeriodEnd = subscription.gracePeriodEnd ? new Date(subscription.gracePeriodEnd).getTime() : null;
    
    if (subscription.status === 'active' || subscription.status === 'trial') {
      return Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    }
    
    if (subscription.status === 'grace_period' && gracePeriodEnd) {
      return Math.max(0, Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24)));
    }
    
    return 0;
  }

  /**
   * Get subscription warning message
   */
  getSubscriptionWarning(): string | null {
    const { subscription } = useAuthStore.getState();
    
    if (!subscription) return 'No active subscription. Please choose a plan to continue.';
    
    const daysRemaining = this.getDaysRemaining();
    
    if (subscription.status === 'expired') {
      return 'Your subscription has expired. Please renew to continue using the app.';
    }
    
    if (subscription.status === 'grace_period') {
      if (daysRemaining > 0) {
        return `Your subscription has expired. You have ${daysRemaining} days left in your grace period. Please renew now and backup your data.`;
      } else {
        return 'Your grace period has expired. Please renew immediately to restore access.';
      }
    }
    
    if (subscription.isTrial && daysRemaining <= 3) {
      return `Your free trial expires in ${daysRemaining} days. Choose a plan to continue using QuickBill.`;
    }
    
    if (subscription.status === 'active' && daysRemaining <= 7 && !subscription.isTrial) {
      return `Your subscription expires in ${daysRemaining} days. Please renew to avoid service interruption.`;
    }
    
    return null;
  }

  /**
   * Get plan display name
   */
  getPlanDisplayName(plan: string): string {
    const planNames: Record<string, string> = {
      trial: 'Free Trial',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
      none: 'No Plan'
    };
    
    return planNames[plan] || plan;
  }

  /**
   * Get plan price
   */
  getPlanPrice(plan: string): number {
    const planPrices: Record<string, number> = {
      silver: 1999,
      gold: 2999,
      platinum: 3500
    };
    
    return planPrices[plan] || 0;
  }

  /**
   * Check if feature requires upgrade
   */
  getUpgradeRequiredForFeature(feature: string): { required: boolean; minPlan?: string } {
    const { subscription } = useAuthStore.getState();
    
    if (!subscription || !this.hasFeatureAccess(feature)) {
      // Determine minimum plan required for feature
      const featurePlans: Record<string, string> = {
        inventory: 'gold',
        inventory_management: 'gold',
        inventory_reports: 'gold',
        tax_reports: 'gold',
        customer_database: 'gold',
        customer_reports: 'gold',
        user_reports: 'platinum',
        kot_billing: 'platinum',
        usb_printing: 'gold',
        lan_printing: 'platinum'
      };
      
      return {
        required: true,
        minPlan: featurePlans[feature] || 'silver'
      };
    }
    
    return { required: false };
  }
}

// Export singleton instance
export const subscriptionManager = SubscriptionManager.getInstance();

// Hook for easy access in components
export const useSubscriptionManager = () => {
  return subscriptionManager;
};