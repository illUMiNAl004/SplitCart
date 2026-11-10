"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, MapPin } from "lucide-react";
import { storeById } from "@/lib/stores";
import { isExpired, money, progress, toFreeShipping } from "@/lib/split";
import type { Cart } from "@/lib/types";
import { AvatarStack, Countdown, ProgressBar, StoreBadge, spring } from "./ui";

const STATUS_LABEL = { ordered: "Ordered", arrived: "Arrived", settled: "Settled" } as const;

export function CartCard({ cart }: { cart: Cart }) {
  const store = storeById(cart.storeId);
  const left = toFreeShipping(cart, store);
  const expired = isExpired(cart);
  const host = cart.members.find((m) => m.userId === cart.hostId);
  const waiting = cart.status === "open" && !expired && cart.members.length < cart.minPeople;

  return (
    <motion.div
      layout
      transition={spring}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Link
        href={`/carts/${cart.id}`}
        className="flex h-full flex-col rounded-card border border-line/60 bg-surface p-5 transition-colors hover:border-muted/50 active:scale-[0.99] lg:p-6"
      >
        <div className="flex items-start gap-3">
          <StoreBadge store={store} />
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold leading-tight">{store.name}</div>
            <div className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-muted">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">
                {host?.name ?? "Someone"}&apos;s cart · {cart.area}
              </span>
            </div>
          </div>
          {cart.status === "open" ? (
            <Countdown deadline={cart.deadline} />
          ) : (
            <span className="rounded-full bg-lime/15 px-2.5 py-1 text-xs font-medium text-lime">
              {STATUS_LABEL[cart.status]}
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          <ProgressBar value={progress(cart, store)} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          {waiting ? (
            <span className="flex items-center gap-2 text-sm font-medium text-lime">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
              </span>
              Waiting for a match
            </span>
          ) : left === 0 ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-lime">
              <Check size={16} strokeWidth={3} /> Free shipping unlocked
            </span>
          ) : (
            <span className={`text-sm ${expired ? "text-muted" : "text-white/90"}`}>
              <span className="font-semibold">{money(left)}</span>
              <span className="text-muted"> to free shipping</span>
            </span>
          )}
          <AvatarStack names={cart.members.map((m) => m.name)} />
        </div>
      </Link>
    </motion.div>
  );
}
