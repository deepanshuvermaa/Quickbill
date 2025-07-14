export type TaxMode = 'no_tax' | 'single_tax' | 'gst';
export type TaxCalculationType = 'exclusive' | 'inclusive';
export type GstType = 'intrastate' | 'interstate';

export interface TaxSettings {
  mode: TaxMode;
  singleTaxRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  calculationType: TaxCalculationType;
  gstType: GstType;
}

export interface TaxCalculation {
  subtotal: number;
  tax: number;
  total: number;
  breakdown: {
    tax?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    total: number;
  } | null;
}

export interface TaxBreakdown {
  totalTax: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export const calculateTax = (amount: number, taxSettings: TaxSettings): TaxCalculation => {
  if (taxSettings.mode === 'no_tax') {
    return {
      subtotal: amount,
      tax: 0,
      total: amount,
      breakdown: null
    };
  }
  
  let subtotal = amount;
  let tax = 0;
  let breakdown: any = {};
  
  if (taxSettings.calculationType === 'inclusive') {
    // Tax is included in the amount
    if (taxSettings.mode === 'single_tax') {
      const divisor = 1 + (taxSettings.singleTaxRate / 100);
      subtotal = amount / divisor;
      tax = amount - subtotal;
      breakdown = { tax: tax, total: tax };
    } else if (taxSettings.mode === 'gst') {
      let totalGstRate: number;
      if (taxSettings.gstType === 'intrastate') {
        totalGstRate = taxSettings.cgstRate + taxSettings.sgstRate;
      } else {
        totalGstRate = taxSettings.igstRate;
      }
      const divisor = 1 + (totalGstRate / 100);
      subtotal = amount / divisor;
      tax = amount - subtotal;
      
      if (taxSettings.gstType === 'intrastate') {
        breakdown = {
          cgst: (subtotal * taxSettings.cgstRate) / 100,
          sgst: (subtotal * taxSettings.sgstRate) / 100,
          total: tax
        };
      } else {
        breakdown = {
          igst: (subtotal * taxSettings.igstRate) / 100,
          total: tax
        };
      }
    }
  } else {
    // Tax is exclusive (added on top)
    subtotal = amount;
    if (taxSettings.mode === 'single_tax') {
      tax = (amount * taxSettings.singleTaxRate) / 100;
      breakdown = { tax: tax, total: tax };
    } else if (taxSettings.mode === 'gst') {
      if (taxSettings.gstType === 'intrastate') {
        const cgst = (amount * taxSettings.cgstRate) / 100;
        const sgst = (amount * taxSettings.sgstRate) / 100;
        tax = cgst + sgst;
        breakdown = {
          cgst: cgst,
          sgst: sgst,
          total: tax
        };
      } else {
        const igst = (amount * taxSettings.igstRate) / 100;
        tax = igst;
        breakdown = {
          igst: igst,
          total: tax
        };
      }
    }
  }
  
  return {
    subtotal: subtotal,
    tax: tax,
    total: subtotal + tax,
    breakdown: breakdown
  };
};

export const formatTaxDisplay = (taxCalculation: TaxCalculation, taxSettings: TaxSettings): string[] => {
  const lines: string[] = [];
  
  if (taxSettings.mode === 'no_tax' || !taxCalculation.breakdown) {
    return lines;
  }
  
  if (taxSettings.mode === 'single_tax' && taxCalculation.breakdown.tax) {
    lines.push(`Tax (${taxSettings.singleTaxRate}%): ₹${taxCalculation.breakdown.tax.toFixed(2)}`);
  } else if (taxSettings.mode === 'gst') {
    if (taxCalculation.breakdown.cgst) {
      lines.push(`CGST (${taxSettings.cgstRate}%): ₹${taxCalculation.breakdown.cgst.toFixed(2)}`);
    }
    if (taxCalculation.breakdown.sgst) {
      lines.push(`SGST (${taxSettings.sgstRate}%): ₹${taxCalculation.breakdown.sgst.toFixed(2)}`);
    }
    if (taxCalculation.breakdown.igst) {
      lines.push(`IGST (${taxSettings.igstRate}%): ₹${taxCalculation.breakdown.igst.toFixed(2)}`);
    }
  }
  
  return lines;
};

export const calculateTaxBreakdown = (amount: number, taxSettings: TaxSettings): TaxBreakdown => {
  const taxCalc = calculateTax(amount, taxSettings);
  
  return {
    totalTax: taxCalc.tax,
    cgst: taxCalc.breakdown?.cgst || 0,
    sgst: taxCalc.breakdown?.sgst || 0,
    igst: taxCalc.breakdown?.igst || 0,
  };
};

// Calculate tax for items with individual tax settings
export interface ItemTaxCalculation {
  itemAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export const calculateItemTax = (
  price: number, 
  quantity: number,
  taxType?: 'GST' | 'IGST' | 'EXEMPT',
  gstRate?: number,
  igstRate?: number
): ItemTaxCalculation => {
  const itemAmount = price * quantity;
  
  if (!taxType || taxType === 'EXEMPT') {
    return {
      itemAmount,
      taxAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: itemAmount
    };
  }
  
  if (taxType === 'GST' && gstRate) {
    const cgst = (itemAmount * gstRate / 2) / 100;
    const sgst = (itemAmount * gstRate / 2) / 100;
    const taxAmount = cgst + sgst;
    
    return {
      itemAmount,
      taxAmount,
      cgst,
      sgst,
      igst: 0,
      totalAmount: itemAmount + taxAmount
    };
  }
  
  if (taxType === 'IGST' && igstRate) {
    const igst = (itemAmount * igstRate) / 100;
    
    return {
      itemAmount,
      taxAmount: igst,
      cgst: 0,
      sgst: 0,
      igst,
      totalAmount: itemAmount + igst
    };
  }
  
  return {
    itemAmount,
    taxAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: itemAmount
  };
};