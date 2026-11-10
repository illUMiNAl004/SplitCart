import type { Store } from "./types";

// TODO: double-check these before launch. H&M ($60) and Amazon ($49) are
// current as of Nov 2026, the rest are rough guesses.
export const STORES: Store[] = [
  { id: "target", short: "T", name: "Target", freeShippingAt: 35, shippingFee: 5.99, color: "#E5383B" },
  { id: "hm", short: "H&M", name: "H&M", freeShippingAt: 60, shippingFee: 6.99, color: "#E4E4E7" },
  { id: "amazon", short: "a", name: "Amazon", freeShippingAt: 49, shippingFee: 6.99, color: "#F5A524" },
  { id: "uniqlo", short: "U", name: "Uniqlo", freeShippingAt: 99, shippingFee: 7.95, color: "#FF4D4D" },
  { id: "sephora", short: "S", name: "Sephora", freeShippingAt: 50, shippingFee: 5.95, color: "#F4F4F5" },
  { id: "ulta", short: "U", name: "Ulta", freeShippingAt: 35, shippingFee: 5.95, color: "#F7A1C4" },
];

export const storeById = (id: string): Store => STORES.find((s) => s.id === id) ?? STORES[0];
