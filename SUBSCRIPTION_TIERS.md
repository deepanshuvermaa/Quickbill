# QuickBill Subscription Tiers

## Feature Hierarchy
Platinum > Gold > Silver

Each higher tier includes ALL features from lower tiers plus additional features.

## Silver Plan (₹1,999/month) - Basic
### ✅ Included Features:
- **Unlimited Bills, Items & Customers**
- **Basic Reports:**
  - Bill Reports
  - Item Reports
- **Printing:** Bluetooth only
- **Data Export & Sync**
- **Single User**

### ❌ Not Included:
- Inventory Management
- Tax Reports
- Customer Database
- USB/LAN Printing
- Priority Support

## Gold Plan (₹2,999/month) - Professional
### ✅ Everything in Silver PLUS:
- **Inventory Management**
  - Track stock levels
  - Inventory reports
- **Advanced Reports:**
  - Tax Reports (GST ready)
  - Customer Reports
- **Customer Database**
- **USB Printing Support**
- **Priority Support**
- **3 Users** (coming soon)

### ❌ Not Included:
- User Reports
- KOT Billing
- LAN Printing

## Platinum Plan (₹3,500/month) - Enterprise
### ✅ Everything in Gold PLUS:
- **User Reports** (track employee activity)
- **KOT Billing** (Kitchen Order Tickets)
- **LAN/Network Printing**
- **5 Users** (coming soon)
- **Premium Priority Support**

## Trial Plan (7 days free)
- **Full Platinum features** for 7 days
- Automatically converts to guest mode after expiry
- One-time offer for new users

## Guest Mode (Free)
- View-only access
- Limited to 50 bills
- No printing or reports
- Basic inventory view

## Feature Access Matrix

| Feature | Guest | Silver | Gold | Platinum |
|---------|-------|--------|------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create Bills | Limited | ✅ | ✅ | ✅ |
| Items Management | View | ✅ | ✅ | ✅ |
| Basic Reports | ❌ | ✅ | ✅ | ✅ |
| Inventory Management | View | ❌ | ✅ | ✅ |
| Tax Reports | ❌ | ❌ | ✅ | ✅ |
| Customer Database | ❌ | ❌ | ✅ | ✅ |
| User Reports | ❌ | ❌ | ❌ | ✅ |
| KOT Billing | ❌ | ❌ | ❌ | ✅ |
| Bluetooth Print | ❌ | ✅ | ✅ | ✅ |
| USB Print | ❌ | ❌ | ✅ | ✅ |
| LAN Print | ❌ | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |

## Implementation Notes

The subscription manager correctly implements this hierarchy:
- Each plan includes all features from lower tiers
- Feature checks use `hasFeatureAccess()` method
- Upgrade prompts show the minimum required plan
- Trial users get full Platinum access for 7 days