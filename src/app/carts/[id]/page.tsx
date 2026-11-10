"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, ExternalLink, MapPin, MessageCircle, PartyPopper } from "lucide-react";
import { PhoneField } from "@/components/PhoneField";
import clsx from "clsx";
import { useApp } from "@/components/useApp";
import {
  ActionBar,
  Avatar,
  Button,
  Card,
  Countdown,
  Label,
  MoneyInput,
  Page,
  ProgressBar,
  Sheet,
  StoreBadge,
  spring,
} from "@/components/ui";
import { useRequireUser } from "@/components/useRequireUser";
import { formatPhone, isValidPhone, smsHref } from "@/lib/phone";
import { joinCart, leaveCart, markArrived, placeOrder, setMemberPhone, setPaid, updateMyItems } from "@/lib/repo";
import { computeShares, isExpired, isUnlocked, money, pooledTotal, progress, toFreeShipping } from "@/lib/split";
import { storeById } from "@/lib/stores";
import type { CartStatus } from "@/lib/types";
import { venmoPayUrl } from "@/lib/venmo";

const STEPS: { key: CartStatus; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "ordered", label: "Ordered" },
  { key: "arrived", label: "Arrived" },
  { key: "settled", label: "Settled" },
];

function Stepper({ status }: { status: CartStatus }) {
  const at = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{ scale: i === at ? 1.15 : 1 }}
              className={clsx(
                "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                i <= at ? "bg-lime text-ink" : "bg-raised text-muted",
              )}
            >
              {i < at ? <Check size={13} strokeWidth={3.5} /> : i + 1}
            </motion.div>
            <span className={clsx("text-xs", i <= at ? "text-white" : "text-muted")}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="mx-1.5 mb-5 h-0.5 flex-1 overflow-hidden rounded bg-raised">
              <motion.div className="h-full bg-lime" initial={false} animate={{ width: i < at ? "100%" : "0%" }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className={clsx("flex justify-between", strong ? "pt-3 text-lg font-semibold" : "text-muted")}>
    <span>{label}</span>
    <span className={strong ? "text-white" : ""}>{value}</span>
  </div>
);

export default function CartDetail() {
  const { ready, user } = useRequireUser();
  const { carts, upsertCart, setUser } = useApp();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sheet, setSheet] = useState<null | "join" | "order">(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [tax, setTax] = useState("");
  const [shipping, setShipping] = useState("0");
  const [myPhone, setMyPhone] = useState("");
  const [copied, setCopied] = useState(false);

  const cart = carts.find((c) => c.id === id);
  if (!ready || !user) return null;
  if (!cart)
    return (
      <main className="mx-auto max-w-md px-5 pt-20 text-center text-muted">
        This cart doesn&apos;t exist anymore.
        <Button variant="ghost" className="mt-6" onClick={() => router.replace("/carts")}>
          Back to carts
        </Button>
      </main>
    );

  const store = storeById(cart.storeId);
  const shares = computeShares(cart, store);
  const me = cart.members.find((m) => m.userId === user.id);
  const myShare = shares.find((s) => s.member.userId === user.id);
  const host = cart.members.find((m) => m.userId === cart.hostId)!;
  const isHost = user.id === cart.hostId;
  const left = toFreeShipping(cart, store);
  const expired = isExpired(cart);
  const unlocked = isUnlocked(cart, store);
  const needPeople = Math.max(0, cart.minPeople - cart.members.length);
  const pending = cart.members.filter((m) => !m.paid).length;
  const waiting = cart.status === "open" && !expired && cart.members.length < cart.minPeople;
  const others = cart.members.filter((m) => m.userId !== user.id);
  const otherPhones = others.flatMap((m) => (m.phone ? [m.phone] : []));

  const sharePhone = () => {
    setUser({ ...user, phone: myPhone });
    carts
      .filter((c) => c.members.some((m) => m.userId === user.id))
      .forEach((c) => upsertCart(setMemberPhone(c, user.id, myPhone)));
  };

  const copyNumbers = async () => {
    try {
      await navigator.clipboard.writeText(otherPhones.map(formatPhone).join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked, numbers are still on screen
    }
  };

  const typed = parseFloat(amount) || 0;
  const preview = me ? updateMyItems(cart, user.id, typed) : joinCart(cart, user, typed);
  const previewShare = computeShares(preview, store).find((s) => s.member.userId === user.id);

  const openJoin = () => {
    setAmount(me ? String(me.itemsTotal) : "");
    setNote(me?.itemsNote ?? "");
    setSheet("join");
  };

  const confirmJoin = () => {
    const value = Math.round(typed * 100) / 100;
    upsertCart(
      me
        ? updateMyItems(cart, user.id, value, note.trim() || undefined)
        : joinCart(cart, user, value, note.trim() || undefined),
    );
    setSheet(null);
  };

  const confirmOrder = () => {
    upsertCart(placeOrder(cart, parseFloat(tax) || 0, parseFloat(shipping) || 0));
    setSheet(null);
  };

  // main button depends on your role and the cart status
  let action: React.ReactNode = null;
  if (cart.status === "open") {
    if (isHost) {
      action = (
        <>
          <Button disabled={!unlocked} onClick={() => setSheet("order")}>
            {unlocked
              ? "Place the order"
              : left > 0
                ? `${money(left)} more to unlock`
                : `Needs ${needPeople} more ${needPeople === 1 ? "person" : "people"}`}
          </Button>
          <Button variant="ghost" className="mt-2 h-12 text-base" onClick={openJoin}>
            Edit my items
          </Button>
        </>
      );
    } else if (me) {
      action = (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={openJoin}>
            Edit my items
          </Button>
          <Button variant="danger" className="w-auto" onClick={() => upsertCart(leaveCart(cart, user.id))}>
            Leave
          </Button>
        </div>
      );
    } else if (!expired) {
      action = <Button onClick={openJoin}>Join this cart</Button>;
    }
  } else if (me && !isHost && !me.paid && myShare) {
    action = (
      <>
        <motion.a
          whileTap={{ scale: 0.97 }}
          href={venmoPayUrl(host.venmo, myShare.total - myShare.fee, `SplitCart · ${store.name}`)}
          target="_blank"
          rel="noreferrer"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-lime px-6 text-[17px] font-semibold text-ink"
        >
          Pay {host.name} {money(myShare.total - myShare.fee)} on Venmo <ExternalLink size={17} />
        </motion.a>
        <Button
          variant="ghost"
          className="mt-2 h-12 text-base"
          onClick={() => upsertCart(setPaid(cart, user.id, true))}
        >
          I&apos;ve paid
        </Button>
      </>
    );
  } else if (isHost && cart.status === "ordered") {
    action = <Button onClick={() => upsertCart(markArrived(cart))}>Package arrived</Button>;
  }

  return (
    <Page>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <button
          onClick={() => router.push("/carts")}
          className="-ml-2 mt-4 flex items-center gap-1.5 rounded-full p-2 text-muted hover:text-white lg:mt-8"
          aria-label="Back"
        >
          <ArrowLeft size={20} /> <span className="hidden lg:inline">All carts</span>
        </button>

        <div className="lg:mt-4 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-14">
          <div>
            <header className="mt-2 flex items-center gap-4">
              <StoreBadge store={store} size={56} />
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-semibold tracking-tight lg:text-5xl">{store.name}</h1>
                <div className="text-muted">Hosted by {isHost ? "you" : host.name}</div>
              </div>
              {cart.status === "open" && <Countdown deadline={cart.deadline} />}
            </header>

            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <MapPin size={14} /> {cart.area}
            </div>

            <Card className="mt-6">
              <div className="flex items-end justify-between">
                <div>
                  <motion.div
                    key={pooledTotal(cart)}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    className="text-5xl font-semibold tracking-tight"
                  >
                    {money(pooledTotal(cart))}
                  </motion.div>
                  <div className="mt-1 text-muted">of {money(store.freeShippingAt)} for free shipping</div>
                </div>
                <div className="text-right text-sm text-muted">
                  <span className="text-lg font-semibold text-white">{cart.members.length}</span> / {cart.minPeople}+
                  people
                </div>
              </div>
              <div className="mt-5">
                <ProgressBar value={progress(cart, store)} tall />
              </div>
              <div className="mt-3 text-sm">
                {left === 0 ? (
                  <span className="font-medium text-lime">
                    Free shipping unlocked. Everyone saves {money(store.shippingFee)}.
                  </span>
                ) : expired ? (
                  <span className="text-muted">Closed before reaching the minimum.</span>
                ) : (
                  <span className="text-muted">
                    <span className="font-semibold text-white">{money(left)}</span> to go
                  </span>
                )}
              </div>
              {waiting && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-lime/10 px-4 py-3 text-sm text-lime">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
                  </span>
                  Waiting for a match. Anyone who searches for {store.name} gets paired with this cart.
                </div>
              )}
            </Card>

            <div className="mt-6 px-1">
              <Stepper status={cart.status} />
            </div>

            <section className="mt-8">
              <Label>In this cart</Label>
              <Card flush className="divide-y divide-line/60">
                <AnimatePresence initial={false}>
                  {shares.map((s) => (
                    <motion.div
                      key={s.member.userId}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 px-5 py-4"
                    >
                      <Avatar name={s.member.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {s.member.userId === user.id ? "You" : s.member.name}
                          {s.isHost && (
                            <span className="ml-2 rounded-full bg-lime/15 px-2 py-0.5 text-xs text-lime">Host</span>
                          )}
                        </div>
                        {s.member.itemsNote && <div className="truncate text-sm text-muted">{s.member.itemsNote}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{money(cart.status === "open" ? s.items : s.total)}</div>
                        {cart.status !== "open" && !s.isHost && (
                          <button
                            disabled={!isHost}
                            onClick={() => upsertCart(setPaid(cart, s.member.userId, !s.member.paid))}
                            className={clsx(
                              "text-xs",
                              s.member.paid ? "text-lime" : "text-muted",
                              isHost && "underline-offset-2 hover:underline",
                            )}
                          >
                            {s.member.paid ? "Paid" : isHost ? "Mark paid" : "Unpaid"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Card>
              {isHost && cart.status !== "open" && cart.status !== "settled" && (
                <p className="mt-2 px-1 text-sm text-muted">
                  {pending === 0 ? "Everyone has paid." : `Waiting on ${pending} payment${pending === 1 ? "" : "s"}.`}
                  {cart.status === "ordered" && " Tap 'Package arrived' when the box shows up."}
                </p>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-28">
            {!me && cart.status === "open" && !expired && (
              <section className="mt-8 lg:mt-0">
                <Label>Join this cart</Label>
                <Card className="space-y-3 lg:p-7">
                  <div className="text-2xl font-semibold tracking-tight">
                    Skip <span className="text-lime">{money(store.shippingFee)}</span> shipping
                  </div>
                  <p className="text-muted">
                    Add your {store.name} items to {host.name}&apos;s cart. {host.name} checks out once and you Venmo @
                    {host.venmo} your exact share, tax included.
                  </p>
                  <p className="text-sm text-muted">
                    Once you join, you&apos;ll see everyone&apos;s numbers to sort out the handoff.
                  </p>
                </Card>
              </section>
            )}

            {myShare && (
              <section className="mt-8 lg:mt-0">
                <Label>Your share</Label>
                <Card className="space-y-1.5">
                  <Row label="Items" value={money(myShare.items)} />
                  <Row label="Shipping" value={myShare.shipping === 0 ? "Free" : money(myShare.shipping)} />
                  <Row label="Tax" value={cart.finalTax === undefined ? "After checkout" : money(myShare.tax)} />
                  <Row
                    label={isHost ? "Your part of the order" : `You pay ${host.name}`}
                    value={money(myShare.total - myShare.fee)}
                    strong
                  />
                  {myShare.saved > 0 && (
                    <div className="pt-2 text-sm font-medium text-lime">
                      You save {money(myShare.saved)} vs ordering alone.
                    </div>
                  )}
                </Card>
              </section>
            )}

            {me && (
              <section className="mt-8">
                <Label>Your group</Label>
                <Card className="space-y-4">
                  {others.length === 0 ? (
                    <p className="text-muted">
                      No one else yet. When someone matches with you, their number shows up here.
                    </p>
                  ) : (
                    others.map((m) => (
                      <div key={m.userId} className="flex items-center gap-3">
                        <Avatar name={m.name} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">
                            {m.name}
                            {m.userId === cart.hostId && (
                              <span className="ml-2 rounded-full bg-lime/15 px-2 py-0.5 text-xs text-lime">Host</span>
                            )}
                          </div>
                          <div className="text-sm text-muted">
                            {m.phone ? formatPhone(m.phone) : "No number shared"}
                          </div>
                        </div>
                        {m.phone && (
                          <a
                            href={smsHref(
                              m.phone,
                              `Hey ${m.name}, it's ${user.name} from our SplitCart ${store.name} cart!`,
                            )}
                            className="flex items-center gap-1.5 rounded-full bg-raised px-4 py-2 text-sm font-medium transition-colors hover:bg-line"
                          >
                            <MessageCircle size={15} /> Text
                          </a>
                        )}
                      </div>
                    ))
                  )}
                  {otherPhones.length > 1 && (
                    <button onClick={copyNumbers} className="text-sm font-medium text-lime hover:underline">
                      {copied ? "Copied" : "Copy all numbers for a group chat"}
                    </button>
                  )}
                  <p className="border-t border-line pt-4 text-sm text-muted">
                    Text each other to agree on where and when to hand things off.
                  </p>
                  {!me.phone && (
                    <div>
                      <div className="mb-2 text-sm font-medium">Share your number with this group</div>
                      <PhoneField value={myPhone} onChange={setMyPhone} />
                      <Button className="mt-2 h-12 text-base" disabled={!isValidPhone(myPhone)} onClick={sharePhone}>
                        Share my number
                      </Button>
                    </div>
                  )}
                </Card>
              </section>
            )}

            {cart.status === "settled" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
                className="mt-8 flex flex-col items-center gap-2 text-center"
              >
                <PartyPopper className="text-lime" size={32} />
                <div className="text-xl font-semibold">All settled</div>
                <div className="text-muted">
                  This cart saved the group {money(store.shippingFee * cart.members.length)} in shipping.
                </div>
              </motion.div>
            )}

            {action && <ActionBar>{action}</ActionBar>}
          </aside>
        </div>

        <Sheet
          open={sheet === "join"}
          onClose={() => setSheet(null)}
          title={me ? "Edit your items" : `Join ${store.name}`}
        >
          <Label>Your items total</Label>
          <MoneyInput value={amount} onChange={setAmount} autoFocus />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What are you getting? (or paste a link)"
            className="mt-2 h-12 w-full rounded-2xl bg-raised px-5 outline-none placeholder:text-muted/60 focus:ring-2 focus:ring-lime"
          />
          <div className="mt-4">
            <ProgressBar value={progress(preview, store)} />
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted">
                Cart {money(pooledTotal(preview))} / {money(store.freeShippingAt)}
              </span>
              {previewShare && previewShare.saved > 0 && typed > 0 && (
                <span className="font-medium text-lime">You save {money(previewShare.saved)}</span>
              )}
            </div>
          </div>
          <Button className="mt-6" disabled={typed <= 0} onClick={confirmJoin}>
            {me ? "Save" : `Join for ${money(typed)} + tax`}
          </Button>
          {!isHost && (
            <p className="mt-3 text-center text-sm text-muted">
              {host.name} checks out, then you Venmo @{host.venmo} your share.
            </p>
          )}
        </Sheet>

        <Sheet open={sheet === "order"} onClose={() => setSheet(null)} title="Place the order">
          <ol className="mb-6 space-y-2 text-muted">
            <li>1. Check out on {store.name} with everyone&apos;s items.</li>
            <li>2. Enter the tax and shipping from your receipt.</li>
            <li>3. We&apos;ll send everyone their exact Venmo amount.</li>
          </ol>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tax</Label>
              <MoneyInput value={tax} onChange={setTax} autoFocus />
            </div>
            <div>
              <Label>Shipping</Label>
              <MoneyInput value={shipping} onChange={setShipping} />
            </div>
          </div>
          <Button className="mt-6" onClick={confirmOrder}>
            I placed the order
          </Button>
        </Sheet>
      </motion.div>
    </Page>
  );
}
