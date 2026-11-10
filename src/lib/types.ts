export const AREAS = ["Southwest", "Central", "Northeast", "Orchard Hill", "Sylvan", "North", "Off-campus"] as const;
export type Area = (typeof AREAS)[number];

export type User = {
  id: string;
  name: string;
  email: string; // must be .edu
  venmo: string; // handle without @
  phone?: string; // only visible to people in the same cart
  area: Area;
};

export type Store = {
  id: string;
  name: string;
  short: string; // badge text until we have store logos
  freeShippingAt: number; // order subtotal that unlocks free shipping
  shippingFee: number; // what one person pays alone under the threshold
  color: string; // badge background
};

export type CartStatus = "open" | "ordered" | "arrived" | "settled";

export type Member = {
  userId: string;
  name: string;
  venmo: string;
  phone?: string;
  itemsTotal: number; // pre-tax subtotal of this person's items
  itemsNote?: string;
  paid: boolean; // host is always paid
  joinedAt: string;
};

export type Cart = {
  id: string;
  storeId: string;
  hostId: string;
  area: Area;
  deadline: string;
  minPeople: number;
  status: CartStatus;
  members: Member[]; // members[0] is the host
  createdAt: string;
  // set by the host after checkout
  finalTax?: number;
  finalShipping?: number;
};
