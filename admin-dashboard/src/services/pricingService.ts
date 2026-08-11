/**
 * Centralized Pricing Engine & Business Rules Service for Frontend.
 * Enforces:
 * 1. Shop: Minimum Selling Price rule (Price >= minimumSellingPrice)
 * 2. Wholesale Dealer: Automatic calculation from dealer's configured discount % (Displays actual selling amount)
 * 3. Customer: Manual price entry during sales, no onboarding pricing configuration
 */

export interface PricingProduct {
  id: number;
  productCode?: string;
  name: string;
  mrp: number;
  minimumSellingPrice?: number;
  dealerPrice?: number;
  wholesalePrice?: number;
  retailPrice?: number;
}

export interface PricingBuyer {
  id?: number;
  name?: string;
  customerType?: 'SHOP' | 'WHOLESALE_AGENT' | 'WHOLESALE_DEALER' | 'RETAIL_CUSTOMER' | 'CUSTOMER' | string;
  discountPercent?: number;
}

export interface CalculatedItemPrice {
  productId: number;
  productName: string;
  customerType: 'SHOP' | 'WHOLESALE_DEALER' | 'CUSTOMER';
  mrp: number;
  minimumSellingPrice: number;
  discountPercent: number;
  basePrice: number;
  unitSellingPrice: number;
  totalPrice: number;
  quantity: number;
  isValid: boolean;
  validationMessage?: string;
}

export const normalizeCustomerType = (type?: string): 'SHOP' | 'WHOLESALE_DEALER' | 'CUSTOMER' => {
  if (!type) return 'SHOP';
  const t = type.toUpperCase();
  if (t.includes('WHOLESALE') || t.includes('DEALER') || t.includes('AGENT')) return 'WHOLESALE_DEALER';
  if (t.includes('CUSTOMER') || t.includes('RETAIL')) return 'CUSTOMER';
  return 'SHOP';
};

/**
 * Calculates selling price and validates buyer rules.
 */
export const calculateProductSellingPrice = (
  product: PricingProduct,
  buyer?: PricingBuyer,
  requestedPrice?: number,
  quantity: number = 1
): CalculatedItemPrice => {
  const custType = normalizeCustomerType(buyer?.customerType);
  const qty = quantity > 0 ? quantity : 1;
  const mrp = Number(product.mrp) || 50;
  const minPrice = product.minimumSellingPrice != null && !isNaN(Number(product.minimumSellingPrice))
    ? Number(product.minimumSellingPrice)
    : (product.dealerPrice != null ? Number(product.dealerPrice) : mrp * 0.9);

  // 1. WHOLESALE DEALER: Automatic calculation based on dealer's individual discount %
  if (custType === 'WHOLESALE_DEALER') {
    const dealerDiscount = buyer?.discountPercent != null ? Number(buyer.discountPercent) : 10;
    const base = mrp;
    const discountAmountPerUnit = (base * dealerDiscount) / 100;
    const finalUnitPrice = parseFloat((base - discountAmountPerUnit).toFixed(2));
    const totalPrice = parseFloat((finalUnitPrice * qty).toFixed(2));

    return {
      productId: product.id,
      productName: product.name,
      customerType: 'WHOLESALE_DEALER',
      mrp,
      minimumSellingPrice: minPrice,
      discountPercent: dealerDiscount,
      basePrice: base,
      unitSellingPrice: finalUnitPrice,
      totalPrice,
      quantity: qty,
      isValid: true
    };
  }

  // 2. SHOP: Enforces Minimum Selling Price rule
  if (custType === 'SHOP') {
    const entered = requestedPrice != null && !isNaN(Number(requestedPrice)) ? Number(requestedPrice) : minPrice;
    const isValid = entered >= minPrice;
    const finalUnitPrice = parseFloat(entered.toFixed(2));
    const totalPrice = parseFloat((finalUnitPrice * qty).toFixed(2));

    return {
      productId: product.id,
      productName: product.name,
      customerType: 'SHOP',
      mrp,
      minimumSellingPrice: minPrice,
      discountPercent: 0,
      basePrice: mrp,
      unitSellingPrice: finalUnitPrice,
      totalPrice,
      quantity: qty,
      isValid,
      validationMessage: isValid ? undefined : `Minimum selling price for this product is ₹${minPrice.toFixed(2)}.`
    };
  }

  // 3. CUSTOMER: Manual price entry directly from user
  const manualPrice = requestedPrice != null && !isNaN(Number(requestedPrice))
    ? Number(requestedPrice)
    : (product.retailPrice != null ? Number(product.retailPrice) : mrp);
  const finalUnitPrice = parseFloat(manualPrice.toFixed(2));
  const totalPrice = parseFloat((finalUnitPrice * qty).toFixed(2));

  return {
    productId: product.id,
    productName: product.name,
    customerType: 'CUSTOMER',
    mrp,
    minimumSellingPrice: minPrice,
    discountPercent: 0,
    basePrice: mrp,
    unitSellingPrice: finalUnitPrice,
    totalPrice,
    quantity: qty,
    isValid: true
  };
};

/**
 * Validates whether entered price meets shop minimum price requirement.
 */
export const validateShopMinimumPrice = (product: PricingProduct, price: number): { isValid: boolean; message?: string } => {
  const minPrice = product.minimumSellingPrice != null && !isNaN(Number(product.minimumSellingPrice))
    ? Number(product.minimumSellingPrice)
    : (product.dealerPrice != null ? Number(product.dealerPrice) : (product.mrp || 50) * 0.9);

  if (price < minPrice) {
    return {
      isValid: false,
      message: `Minimum selling price for this product is ₹${minPrice.toFixed(2)}.`
    };
  }
  return { isValid: true };
};
