import { getDatabase, Product, Subscription } from '@app/db';
import { formatCurrency, createId } from '@app/utils';

export interface PricingPlan extends Product {
  formattedPrice: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  product: Product;
}

export function getPricingTable(): PricingPlan[] {
  const db = getDatabase();
  return db.getProducts().map((product) => ({
    ...product,
    formattedPrice: `${formatCurrency(product.priceCents)}/${product.interval}`,
  }));
}

export function getSubscriptionForUser(userId: string): {
  subscription: Subscription;
  product: Product;
} | null {
  const db = getDatabase();
  const subscription = db.getSubscriptions().find((item) => item.userId === userId);
  if (!subscription) {
    return null;
  }
  const product = db.getProducts().find((item) => item.id === subscription.productId);
  if (!product) {
    return null;
  }
  return { subscription, product };
}

export function createCheckoutSession(productId: string): CheckoutSession {
  const db = getDatabase();
  const product = db.getProducts().find((item) => item.id === productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const id = createId('evt');
  return {
    id,
    url: `https://checkout.example.com/session/${id}`,
    product,
  };
}

export function getCustomerPortalUrl(userId: string): string {
  return `https://billing.example.com/portal?user=${encodeURIComponent(userId)}`;
}

