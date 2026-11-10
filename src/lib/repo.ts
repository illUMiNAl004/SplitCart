import { seedCarts } from "./seed";
import type { Area, Cart, Member, User } from "./types";

// localStorage for now. Swap `repo` for a Supabase version with the same shape.
export interface Repo {
  loadUser(): User | null;
  saveUser(user: User | null): void;
  loadCarts(): Cart[];
  saveCarts(carts: Cart[]): void;
}

const USER_KEY = "splitcart:user";
export const CARTS_KEY = "splitcart:carts:v2";

const localRepo: Repo = {
  loadUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },
  saveUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  },
  loadCarts() {
    const raw = localStorage.getItem(CARTS_KEY);
    if (raw) return JSON.parse(raw) as Cart[];
    const seeded = seedCarts();
    localStorage.setItem(CARTS_KEY, JSON.stringify(seeded));
    return seeded;
  },
  saveCarts(carts) {
    localStorage.setItem(CARTS_KEY, JSON.stringify(carts));
  },
};

export const repo: Repo = localRepo;

// Cart updates. Pure functions, so they work with any backend.

export type NewCartInput = {
  storeId: string;
  area: Area;
  deadline: string;
  minPeople?: number;
  itemsTotal: number;
  itemsNote?: string;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const asMember = (user: User, itemsTotal: number, itemsNote?: string, paid = false): Member => ({
  userId: user.id,
  name: user.name,
  venmo: user.venmo,
  phone: user.phone,
  itemsTotal,
  itemsNote,
  paid,
  joinedAt: new Date().toISOString(),
});

export function createCart(user: User, input: NewCartInput): Cart {
  return {
    id: `c-${uid()}`,
    storeId: input.storeId,
    hostId: user.id,
    area: input.area,
    deadline: input.deadline,
    minPeople: input.minPeople ?? 2,
    status: "open",
    members: [asMember(user, input.itemsTotal, input.itemsNote, true)],
    createdAt: new Date().toISOString(),
  };
}

export const joinCart = (cart: Cart, user: User, itemsTotal: number, itemsNote?: string): Cart =>
  cart.members.some((m) => m.userId === user.id)
    ? updateMyItems(cart, user.id, itemsTotal, itemsNote)
    : { ...cart, members: [...cart.members, asMember(user, itemsTotal, itemsNote)] };

export const updateMyItems = (cart: Cart, userId: string, itemsTotal: number, itemsNote?: string): Cart => ({
  ...cart,
  members: cart.members.map((m) => (m.userId === userId ? { ...m, itemsTotal, itemsNote } : m)),
});

export const leaveCart = (cart: Cart, userId: string): Cart => ({
  ...cart,
  members: cart.members.filter((m) => m.userId !== userId),
});

export const placeOrder = (cart: Cart, finalTax: number, finalShipping: number): Cart => ({
  ...cart,
  status: "ordered",
  finalTax,
  finalShipping,
});

export const markArrived = (cart: Cart): Cart => ({
  ...cart,
  status: cart.members.every((m) => m.paid) ? "settled" : "arrived",
});

export function setPaid(cart: Cart, userId: string, paid: boolean): Cart {
  const members = cart.members.map((m) => (m.userId === userId ? { ...m, paid } : m));
  const allPaid = members.every((m) => m.paid);
  return {
    ...cart,
    members,
    status: allPaid && cart.status === "arrived" ? "settled" : cart.status,
  };
}

export const setMemberPhone = (cart: Cart, userId: string, phone: string | undefined): Cart => ({
  ...cart,
  members: cart.members.map((m) => (m.userId === userId ? { ...m, phone } : m)),
});
