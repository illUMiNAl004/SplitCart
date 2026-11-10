import type { Cart, Member, Store } from "./types";

// Planned fee is $0.99, but payments go straight to the host for now.
export const SPLITCART_FEE = 0;

const cents = (n: number) => Math.round(n * 100) / 100;

export const pooledTotal = (cart: Cart) => cents(cart.members.reduce((sum, m) => sum + m.itemsTotal, 0));

export const toFreeShipping = (cart: Cart, store: Store) =>
  cents(Math.max(0, store.freeShippingAt - pooledTotal(cart)));

export const progress = (cart: Cart, store: Store) => Math.min(1, pooledTotal(cart) / store.freeShippingAt);

export const isExpired = (cart: Cart, now = Date.now()) =>
  cart.status === "open" && new Date(cart.deadline).getTime() <= now;

export const isUnlocked = (cart: Cart, store: Store) =>
  toFreeShipping(cart, store) === 0 && cart.members.length >= cart.minPeople;

export type Share = {
  member: Member;
  isHost: boolean;
  items: number;
  shipping: number;
  tax: number;
  fee: number;
  total: number;
  saved: number; // vs. ordering alone and paying full shipping
};

// Shipping is split evenly, tax by item total. Any rounding cent goes to the
// host so the shares add up to the real order total.
export function computeShares(cart: Cart, store: Store): Share[] {
  const pooled = pooledTotal(cart);
  const n = cart.members.length || 1;
  const shipping = cart.finalShipping ?? (pooled >= store.freeShippingAt ? 0 : store.shippingFee);
  const tax = cart.finalTax ?? 0;
  const orderTotal = pooled + shipping + tax;

  const shares = cart.members.map<Share>((m) => {
    const isHost = m.userId === cart.hostId;
    const shipShare = cents(shipping / n);
    const taxShare = pooled ? cents((tax * m.itemsTotal) / pooled) : 0;
    const fee = isHost ? 0 : SPLITCART_FEE;
    const total = cents(m.itemsTotal + shipShare + taxShare + fee);
    return {
      member: m,
      isHost,
      items: m.itemsTotal,
      shipping: shipShare,
      tax: taxShare,
      fee,
      total,
      saved: cents(store.shippingFee - shipShare - fee),
    };
  });

  const host = shares.find((s) => s.isHost);
  if (host) {
    const others = shares.filter((s) => !s.isHost).reduce((a, s) => a + s.total - s.fee, 0);
    host.total = cents(orderTotal - others);
  }
  return shares;
}

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
