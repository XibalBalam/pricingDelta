import { useState, useMemo, useEffect } from 'react';

export type PricingTier = 'essential' | 'professional' | 'elite';

interface PricingResult {
  totalCost: number;
  unitPrice: number;
  tier: PricingTier;
  breakdown: {
    base: number;
    addons: number;
  };
  includedFeatures: string[];
}

const BASE_PRICE = 8.00; // Annual
const LOGO_PRICE = 1.50;
const DOMAIN_PRICE = 1.50;
const MAPS_PRICE = 2.00;

export const useDistributorPricing = () => {
  const [quantity, setQuantity] = useState<number>(10);
  const [isAnnual, setIsAnnual] = useState<boolean>(true);
  const [addons, setAddons] = useState({
    logo: false,
    domain: false,
    history: 0 as 0 | 3 | 6 | 12,
    maps: false,
  });

  // Ensure minimum quantity
  useEffect(() => {
    // We removed the validaton here to allow typing in input.
    // The validation is done onBlur in the component.
    // if (quantity < 10) setQuantity(10); 
  }, [quantity]);

  const pricingData = useMemo<PricingResult>(() => {
    // 1. Determine Tier
    let tier: PricingTier = 'essential';
    if (quantity >= 50 && quantity < 500) tier = 'professional';
    if (quantity >= 500) tier = 'elite';

    // 2. Identify Included Features Base on Quantity
    const included: string[] = [];
    let freeHistoryMonths = 0;

    if (quantity >= 50) {
      included.push('logo');
    }
    if (quantity >= 100) {
      included.push('domain');
    }
    if (quantity >= 500) {
      freeHistoryMonths = 3;
      included.push('history-3');
    }
    if (quantity >= 1000) {
      freeHistoryMonths = 6;
      included.push('history-6');
    }

    // 3. Calculate Add-ons Cost
    let addonsCostPerUnit = 0;
    
    // Logo
    if (addons.logo && !included.includes('logo')) {
      addonsCostPerUnit += LOGO_PRICE;
    }
    
    // Domain
    if (addons.domain && !included.includes('domain')) {
      addonsCostPerUnit += DOMAIN_PRICE;
    }

    // Maps
    if (addons.maps) {
      addonsCostPerUnit += MAPS_PRICE;
    }

    // History
    // Logic: 3m ($2) -> 6m (+$2) -> 12m (+$2)
    // If free is 3m, and user selects 6m, they pay upgrade difference?
    // Prompt says: "Si el usuario elige '6 meses', el costo es la suma de base + upgrade a 6m."
    // Let's assume standard pricing table:
    // 3mo: $2
    // 6mo: $4
    // 12mo: $6
    // If 3mo is included, 3mo cost is 0. 6mo cost is $2. 12mo cost is $4.
    // If 6mo is included, 6mo cost is 0. 12mo cost is $2.
    
    let historyPrice = 0;
    if (addons.history > 0) {
      // Calculate raw price
      let rawHistoryPrice = 0;
      if (addons.history === 3) rawHistoryPrice = 2.00;
      if (addons.history === 6) rawHistoryPrice = 4.00;
      if (addons.history === 12) rawHistoryPrice = 6.00;

      // Calculate discount based on free tier
      let discount = 0;
      if (freeHistoryMonths === 3) discount = 2.00;
      if (freeHistoryMonths === 6) discount = 4.00; // Covers up to 6mo cost

      historyPrice = Math.max(0, rawHistoryPrice - discount);
      addonsCostPerUnit += historyPrice;
    }

    // 4. Calculate Totals (Annual Base)
    // If Monthly, usually we divide annual by 12 and add a premium (e.g., 20%).
    // But for simplicity/MVP, let's assume the provided prices are Annual Per Unit.
    // If Toggle is Monthly, we might just divide by 12 * 1.2 or similar.
    // Let's implement a simple multiplier for Monthly view.
    const MONTHLY_MULTIPLIER = 1.2; // 20% more expensive if paying monthly
    
    let basePerUnit = BASE_PRICE;
    let finalAddonsPerUnit = addonsCostPerUnit;

    if (!isAnnual) {
        // Convert annual prices to monthly
        basePerUnit = (BASE_PRICE / 12) * MONTHLY_MULTIPLIER;
        finalAddonsPerUnit = (addonsCostPerUnit / 12) * MONTHLY_MULTIPLIER;
    }

    const totalUnitPrice = basePerUnit + finalAddonsPerUnit;
    const totalCost = totalUnitPrice * quantity;

    return {
      totalCost,
      unitPrice: totalUnitPrice,
      tier,
      breakdown: {
        base: basePerUnit * quantity,
        addons: finalAddonsPerUnit * quantity
      },
      includedFeatures: included
    };

  }, [quantity, isAnnual, addons]);

  // Auto-enable included features
  useEffect(() => {
    const included = pricingData.includedFeatures;
    
    setAddons(prev => {
      const next = { ...prev };
      if (included.includes('logo') && !prev.logo) next.logo = true;
      if (included.includes('domain') && !prev.domain) next.domain = true;
      if (included.includes('history-3') && prev.history < 3) next.history = 3;
      if (included.includes('history-6') && prev.history < 6) next.history = 6;
      return next;
    });
  }, [pricingData.includedFeatures]);

  return {
    quantity,
    setQuantity,
    isAnnual,
    setIsAnnual,
    addons,
    setAddons,
    ...pricingData
  };
};
