"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useApp } from "@/components/useApp";
import {
  ActionBar,
  AvatarStack,
  Button,
  Card,
  Chip,
  Label,
  MoneyInput,
  Page,
  ProgressBar,
  StoreBadge,
  spring,
} from "@/components/ui";
import { useRequireUser } from "@/components/useRequireUser";
import { findMatches, openCountFor, type Match } from "@/lib/match";
import { createCart, joinCart } from "@/lib/repo";
import { money, pooledTotal } from "@/lib/split";
import { STORES, storeById } from "@/lib/stores";
import { AREAS, type Area } from "@/lib/types";

const WHEN = [
  { label: "ASAP", at: () => Date.now() + 3_600_000 },
  { label: "In a few hours", at: () => Date.now() + 3 * 3_600_000 },
  {
    label: "Tonight",
    at: () => {
      const d = new Date();
      d.setHours(22, 0, 0, 0);
      if (d.getTime() < Date.now() + 3_600_000) d.setDate(d.getDate() + 1);
      return d.getTime();
    },
  },
  {
    label: "Tomorrow",
    at: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      return d.getTime();
    },
  },
];

type Phase = "form" | "searching" | "result";

function Searching({ storeId }: { storeId: string }) {
  const store = storeById(storeId);
  return (
    <motion.div
      key="searching"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[60vh] flex-col items-center justify-center text-center"
    >
      <div className="relative grid h-48 w-48 place-items-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border border-lime/50"
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          />
        ))}
        <StoreBadge store={store} size={72} />
      </div>
      <div className="mt-8 text-2xl font-semibold tracking-tight">Finding {store.name} shoppers near you…</div>
      <div className="mt-2 text-muted">Same store, same area, similar timing.</div>
    </motion.div>
  );
}

function MatchCard({
  match,
  items,
  best,
  onJoin,
}: {
  match: Match;
  items: number;
  best?: boolean;
  onJoin: () => void;
}) {
  const { cart, reasons } = match;
  const store = storeById(cart.storeId);
  const host = cart.members.find((m) => m.userId === cart.hostId)!;
  const now = pooledTotal(cart);
  const after = now + items;
  const leftAfter = Math.max(0, store.freeShippingAt - after);

  return (
    <Card className={best ? "border-lime/50 lg:p-8" : "lg:p-6"}>
      <div className="flex items-center gap-3">
        <StoreBadge store={store} size={best ? 52 : 40} />
        <div className="min-w-0 flex-1">
          <div className={best ? "text-xl font-semibold" : "font-semibold"}>
            {host.name}&apos;s {store.name} cart
          </div>
          <div className="text-sm text-muted">
            {cart.members.length} {cart.members.length === 1 ? "person" : "people"} · {money(now)} so far
          </div>
        </div>
        <AvatarStack names={cart.members.map((m) => m.name)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {reasons.map((r) => (
          <span key={r} className="rounded-full bg-raised px-3 py-1 text-xs text-white/80">
            {r}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <ProgressBar value={after / store.freeShippingAt} />
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted">
            With you: {money(after)} / {money(store.freeShippingAt)}
          </span>
          {leftAfter === 0 ? (
            <span className="font-medium text-lime">You save {money(store.shippingFee)}</span>
          ) : (
            <span className="text-muted">{money(leftAfter)} to go</span>
          )}
        </div>
      </div>

      <Button className={best ? "mt-6" : "mt-5 h-12 text-base"} variant={best ? "primary" : "ghost"} onClick={onJoin}>
        Join {host.name}&apos;s cart
      </Button>
    </Card>
  );
}

export default function MatchPage() {
  const { ready, user } = useRequireUser();
  const { carts, upsertCart } = useApp();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("form");
  const [storeId, setStoreId] = useState(STORES[0].id);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [whenIdx, setWhenIdx] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [wantBy, setWantBy] = useState(0);

  if (!ready || !user) return null;

  const store = storeById(storeId);
  const items = Math.round((parseFloat(amount) || 0) * 100) / 100;
  const myArea = area ?? user.area;
  const liveCount = openCountFor(carts, storeId, user.id);

  const search = () => {
    const at = WHEN[whenIdx].at();
    setWantBy(at);
    setMatches(findMatches(carts, user, { storeId, area: myArea, itemsTotal: items, wantBy: at }));
    setPhase("searching");
    window.scrollTo({ top: 0 });
    setTimeout(() => setPhase("result"), 1600);
  };

  const join = (m: Match) => {
    upsertCart(joinCart(m.cart, user, items, note.trim() || undefined));
    router.push(`/carts/${m.cart.id}`);
  };

  const openOwn = () => {
    const cart = createCart(user, {
      storeId,
      area: myArea,
      deadline: new Date(wantBy).toISOString(),
      itemsTotal: items,
      itemsNote: note.trim() || undefined,
    });
    upsertCart(cart);
    router.push(`/carts/${cart.id}`);
  };

  const [best, ...rest] = matches;
  const bestHost = best?.cart.members.find((m) => m.userId === best.cart.hostId);

  return (
    <Page>
      <div className="mx-auto max-w-3xl">
        <AnimatePresence mode="wait">
          {phase === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring}
            >
              <button
                onClick={() => router.back()}
                className="-ml-2 mt-4 flex items-center gap-1.5 rounded-full p-2 text-muted hover:text-white lg:mt-8"
              >
                <ArrowLeft size={20} /> <span className="hidden lg:inline">Back</span>
              </button>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight lg:text-5xl">Find your match</h1>
              <p className="mt-1 text-muted lg:mt-3 lg:text-lg">
                Tell us what you&apos;re ordering. We&apos;ll pair you with students buying from the same store.
              </p>

              <section className="mt-8 lg:mt-10">
                <Label>Where are you ordering from?</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {STORES.map((s) => (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStoreId(s.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors ${
                        s.id === storeId ? "border-lime bg-lime/10" : "border-line bg-surface hover:border-muted"
                      }`}
                    >
                      <StoreBadge store={s} size={36} />
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="-mt-1.5 text-xs text-muted">free at ${s.freeShippingAt}</div>
                    </motion.button>
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <Label>Your items total</Label>
                <MoneyInput value={amount} onChange={setAmount} />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What are you getting? (or paste a link)"
                  className="mt-2 h-12 w-full rounded-2xl bg-raised px-5 outline-none placeholder:text-muted/60 focus:ring-2 focus:ring-lime"
                />
              </section>

              <section className="mt-8">
                <Label>When do you want to order?</Label>
                <div className="flex flex-wrap gap-2">
                  {WHEN.map((w, i) => (
                    <Chip key={w.label} active={i === whenIdx} onClick={() => setWhenIdx(i)}>
                      {w.label}
                    </Chip>
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <Label>Your area</Label>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => (
                    <Chip key={a} active={a === myArea} onClick={() => setArea(a)}>
                      {a}
                    </Chip>
                  ))}
                </div>
              </section>

              <ActionBar className="lg:mt-6">
                <div className="mb-3 flex items-center justify-center gap-2 text-sm text-muted lg:justify-start">
                  <span className="relative flex h-2 w-2">
                    {liveCount > 0 && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
                    )}
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${liveCount > 0 ? "bg-lime" : "bg-muted"}`}
                    />
                  </span>
                  {liveCount > 0
                    ? `${liveCount} open ${store.name} ${liveCount === 1 ? "cart" : "carts"} right now`
                    : `No ${store.name} carts yet. You could be the first.`}
                </div>
                <Button disabled={items <= 0} onClick={search} className="lg:w-auto lg:px-10">
                  <Sparkles size={18} /> Find my match
                </Button>
              </ActionBar>
            </motion.div>
          )}

          {phase === "searching" && <Searching storeId={storeId} />}

          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="pt-8 lg:pt-14"
            >
              {best ? (
                <>
                  <div className="text-sm font-medium uppercase tracking-[0.12em] text-lime">It&apos;s a match</div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight lg:text-5xl">
                    {bestHost?.name} is ordering from {store.name} too.
                  </h1>
                  <p className="mt-2 text-muted lg:text-lg">
                    Join and you&apos;ll see each other&apos;s numbers to sort out the handoff.
                  </p>

                  <div className="mt-8">
                    <MatchCard match={best} items={items} best onJoin={() => join(best)} />
                  </div>

                  {rest.length > 0 && (
                    <section className="mt-10">
                      <Label>Other matches</Label>
                      <div className="grid gap-3 md:grid-cols-2">
                        {rest.map((m) => (
                          <MatchCard key={m.cart.id} match={m} items={items} onJoin={() => join(m)} />
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="mt-10 flex flex-col items-center gap-2 border-t border-line/50 pt-8 text-center">
                    <span className="text-muted">None of these work?</span>
                    <Button variant="ghost" className="w-auto px-6" onClick={openOwn}>
                      Open my own {store.name} cart
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center pt-6 text-center lg:pt-10">
                  <StoreBadge store={store} size={72} />
                  <h1 className="mt-6 text-3xl font-semibold tracking-tight lg:text-5xl">
                    No {store.name} matches yet.
                  </h1>
                  <p className="mt-3 max-w-md text-muted lg:text-lg">
                    Open the cart now. The next person who searches for {store.name} gets matched to you, and
                    you&apos;ll see each other&apos;s numbers once they join.
                  </p>
                  <Card className="mt-8 w-full max-w-md text-left">
                    <div className="flex justify-between text-sm text-muted">
                      <span>Your items</span>
                      <span>{money(items)}</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={items / store.freeShippingAt} />
                    </div>
                    <div className="mt-2 text-sm text-muted">
                      {items >= store.freeShippingAt
                        ? "You already hit free shipping on your own."
                        : `${money(store.freeShippingAt - items)} more from matches unlocks free shipping`}
                    </div>
                  </Card>
                  <div className="mt-8 flex w-full max-w-md flex-col gap-2">
                    <Button onClick={openOwn}>Open my {store.name} cart</Button>
                    <Button variant="ghost" onClick={() => setPhase("form")}>
                      Try another store
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Page>
  );
}
