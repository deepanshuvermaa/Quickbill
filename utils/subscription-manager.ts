import { useAuthStore } from '@/store/authStore';

export type SubscriptionPlan = 'trial' | 'monthly' | 'quarterly' | 'yearly' | 'none';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'grace_period';

interface SubscriptionLimits {
  maxBills: number; // -1 for unlimited
  maxItems: number; // -1 for unlimited
  maxCustomers: number; // -1 for unlimited
  canPrint: boolean;
  canExport: boolean;
  canSync: boolean;
  hasReports: boolean;
  hasPrioritySupport: boolean;
}

// Define limits for each plan
const PLAN_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  none: {
    maxBills: 0,
    maxItems: 0,
    maxCustomers: 0,
    canPrint: false,
    canExport: false,
    canSync: false,
    hasReports: false,
    hasPrioritySupport: false,
  },
  trial: {
    maxBills: 20,
    maxItems: 50,
    maxCustomers: 25,
    canPrint: true,
    canExport: false,
    canSync: false,
    hasReports: true,
    hasPrioritySupport: false,
  },
  monthly: {
    maxBills: -1, // unlimited
    maxItems: -1,
    maxCustomers: -1,
    canPrint: true,
    canExport: true,
    canSync: true,
    hasReports: true,
    hasPrioritySupport: true,
  },
  quarterly: {
    maxBills: -1,
    maxItems: -1,
    maxCustomers: -1,
    canPrint: true,
    canExport: true,
    canSync: true,
    hasReports: true,
    hasPrioritySupport: true,
  },
  yearly: {
    maxBills: -1,
    maxItems: -1,
    maxCustomers: -1,
    canPrint: true,
    canExport: true,
    canSync: true,
    hasReports: true,
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
      case 'priority_support':
        return limits.hasPrioritySupport;
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
    
    return PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.none;
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
    if (subscription.status === 'active' && now <= endDate) {
      return true;
    }
    
    // In grace period
    if (subscription.status === 'expired' && gracePeriodEnd && now <= gracePeriodEnd) {
      return true;
    }
    
    return false;
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
    
    if (subscription.status === 'active') {
      return Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    }
    
    if (subscription.status === 'expired' && gracePeriodEnd) {
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
      if (daysRemaining > 0) {
        return `Your subscription has expired. You have ${daysRemaining} days left in your grace period.`;
      } else {
        return 'Your subscription and grace period have expired. Please renew to continue using the app.';
      }
    }
    
    if (subscription.status === 'active' && daysRemaining <= 7) {
      return `Your subscription expires in ${daysRemaining} days. Please renew to avoid service interruption.`;
    }
    
    return null;
  }
}

// Export singleton instance
export const subscriptionManager = SubscriptionManager.getInstance();

// Hook for easy access in components
export const useSubscriptionManager = () => {
  return subscriptionManager;
};