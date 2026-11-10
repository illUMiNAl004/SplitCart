import { isExpired, toFreeShipping } from "./split";
import { storeById } from "./stores";
import type { Area, Cart, User } from "./types";

export type MatchRequest = {
  storeId: string;
  area: Area;
  itemsTotal: number;
  wantBy: number; // timestamp
};

export type Match = {
  cart: Cart;
  score: number;
  reasons: string[];
};

const HOUR = 3_600_000;

export function fmtIn(ms: number) {
  if (ms < HOUR) return `in ${Math.max(1, Math.round(ms / 60000))}m`;
  if (ms < 24 * HOUR) return `in ${Math.round(ms / HOUR)}h`;
  return "tomorrow";
}

// Same store only. Ranked by: same area (+3), your items unlock free
// shipping (+2), orders within 2h of when you want (+2), already has free
// shipping (+1). Ties go to the soonest deadline.
export function findMatches(carts: Cart[], user: User, req: MatchRequest, now = Date.now()): Match[] {
  return carts
    .filter(
      (c) =>
        c.storeId === req.storeId &&
        c.status === "open" &&
        !isExpired(c, now) &&
        !c.members.some((m) => m.userId === user.id),
    )
    .map((cart) => {
      const store = storeById(cart.storeId);
      const left = toFreeShipping(cart, store);
      const ordersIn = new Date(cart.deadline).getTime() - now;
      const reasons = [`Also ordering from ${store.name}`];
      let score = 10;

      if (cart.area === req.area) {
        score += 3;
        reasons.push(`Lives in ${cart.area}`);
      } else {
        reasons.push(`In ${cart.area}`);
      }

      const unlocksFreeShipping = left > 0 && req.itemsTotal >= left;
      if (unlocksFreeShipping) {
        score += 2;
        reasons.push("You'd unlock free shipping");
      } else if (left === 0) {
        score += 1;
        reasons.push("Free shipping already unlocked");
      }

      if (Math.abs(new Date(cart.deadline).getTime() - req.wantBy) <= 2 * HOUR) {
        score += 2;
        reasons.push(`Orders ${fmtIn(ordersIn)}, like you wanted`);
      } else {
        reasons.push(`Orders ${fmtIn(ordersIn)}`);
      }

      return { cart, score, reasons };
    })
    .sort((a, b) => b.score - a.score || +new Date(a.cart.deadline) - +new Date(b.cart.deadline));
}

export const openCountFor = (carts: Cart[], storeId: string, userId: string, now = Date.now()) =>
  carts.filter(
    (c) =>
      c.storeId === storeId && c.status === "open" && !isExpired(c, now) && !c.members.some((m) => m.userId === userId),
  ).length;
