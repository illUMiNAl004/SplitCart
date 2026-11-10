import { useMemo, useSyncExternalStore } from "react";
import { CARTS_KEY, repo } from "@/lib/repo";
import type { Cart, User } from "@/lib/types";

type Snapshot = { ready: boolean; user: User | null; carts: Cart[] };

const SERVER: Snapshot = { ready: false, user: null, carts: [] };
let snap: Snapshot = SERVER;
const listeners = new Set<() => void>();

const emit = (next: Partial<Snapshot>) => {
  snap = { ...snap, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => {
  if (!snap.ready) snap = { ready: true, user: repo.loadUser(), carts: repo.loadCarts() };
  return snap;
};

const actions = {
  setUser(user: User | null) {
    repo.saveUser(user);
    emit({ user });
  },
  upsertCart(cart: Cart) {
    const carts = snap.carts.some((c) => c.id === cart.id)
      ? snap.carts.map((c) => (c.id === cart.id ? cart : c))
      : [cart, ...snap.carts];
    repo.saveCarts(carts);
    emit({ carts });
  },
  resetDemo() {
    localStorage.removeItem(CARTS_KEY);
    emit({ carts: repo.loadCarts() });
  },
};

type AppState = Snapshot & typeof actions;

// Components subscribe directly instead of through context, so each one
// hydrates from the server snapshot before reading localStorage.
export function useApp(): AppState {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => SERVER);
  return useMemo(() => ({ ...state, ...actions }), [state]);
}
