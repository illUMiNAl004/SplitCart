"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import { useApp } from "@/components/useApp";
import { PhoneField } from "@/components/PhoneField";
import { Avatar, Button, Card, Chip, Label, Page, ProgressBar, StoreBadge, spring } from "@/components/ui";
import { isValidPhone } from "@/lib/phone";
import { STORES, storeById } from "@/lib/stores";
import { AREAS, type Area } from "@/lib/types";

const EDU = /^[^@\s]+@[^@\s]+\.edu$/i;

const inputCls =
  "h-14 w-full rounded-2xl bg-raised px-5 text-lg outline-none placeholder:text-muted/60 focus:ring-2 focus:ring-lime";

function HeroDemo() {
  const store = storeById("target");
  const steps = [
    { names: ["Rose"], total: 14.5 },
    { names: ["Rose", "Maya"], total: 24.4 },
    { names: ["Rose", "Maya", "You"], total: 35.9 },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % steps.length), 1700);
    return () => clearInterval(t);
  }, [steps.length]);
  const s = steps[i];
  const done = s.total >= store.freeShippingAt;

  return (
    <div className="relative rounded-card border border-line bg-surface p-6 shadow-2xl shadow-black/50 lg:p-7">
      <div className="flex items-center gap-3">
        <StoreBadge store={store} size={48} />
        <div className="flex-1">
          <div className="text-lg font-semibold">Target</div>
          <div className="flex items-center gap-1 text-sm text-muted">
            <MapPin size={13} /> Southwest · matching now
          </div>
        </div>
        <div className="flex -space-x-1.5">
          <AnimatePresence initial={false}>
            {s.names.map((n) => (
              <motion.div key={n} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}>
                <Avatar name={n} size={32} ring />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-6 flex items-end justify-between">
        <motion.div
          key={s.total}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          className="text-4xl font-semibold tracking-tight"
        >
          ${s.total.toFixed(2)}
        </motion.div>
        <div className="text-sm text-muted">free at $35</div>
      </div>
      <div className="mt-3">
        <ProgressBar value={s.total / store.freeShippingAt} tall />
      </div>
      <div className="mt-3 h-5 text-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={done ? "font-medium text-lime" : "text-muted"}
          >
            {done
              ? "Unlocked. Everyone skips the $5.99 shipping."
              : `$${(store.freeShippingAt - s.total).toFixed(2)} to free shipping`}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function GhostCard({ storeId, pct, className }: { storeId: string; pct: number; className: string }) {
  const store = storeById(storeId);
  return (
    <div
      className={`absolute hidden w-[78%] rounded-card border border-line/60 bg-surface/70 p-5 sm:block ${className}`}
    >
      <div className="flex items-center gap-3">
        <StoreBadge store={store} size={36} />
        <div className="font-semibold">{store.name}</div>
      </div>
      <div className="mt-4">
        <ProgressBar value={pct} />
      </div>
    </div>
  );
}

const HOW = [
  {
    n: "01",
    t: "Tell us what you're ordering",
    d: "Pick the store, enter your total and when you want to order. Takes ten seconds.",
  },
  {
    n: "02",
    t: "Get matched",
    d: "We pair you with students ordering from the same store, ranked by area and timing. Together you hit free shipping.",
  },
  {
    n: "03",
    t: "Text, order, Venmo",
    d: "See each other's numbers to sort out the handoff. The host checks out once and you Venmo your exact share.",
  },
];

export default function Landing() {
  const { ready, user, setUser } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "profile">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [venmo, setVenmo] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<Area>("Southwest");

  useEffect(() => {
    if (ready && user) router.replace("/carts");
  }, [ready, user, router]);

  const emailOk = EDU.test(email.trim());
  const profileOk = name.trim().length > 0 && venmo.trim().length > 1 && (phone === "" || isValidPhone(phone));

  const goProfile = () => {
    if (!emailOk) return;
    setStep("profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () => {
    setUser({
      id: `u-${email.trim().toLowerCase()}`,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      venmo: venmo.trim().replace(/^@/, ""),
      phone: phone || undefined,
      area,
    });
    router.replace("/carts");
  };

  const toSignup = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => document.getElementById("email")?.focus(), 400);
  };

  if (!ready || user) return null;

  if (step === "profile")
    return (
      <Page>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="mx-auto mt-10 max-w-lg lg:mt-20"
        >
          <Card className="lg:p-10">
            <h1 className="text-4xl font-semibold tracking-tight">Quick setup</h1>
            <p className="mt-2 text-muted">{email} · demo build, no email is sent</p>

            <div className="mt-8 space-y-6">
              <div>
                <Label>First name</Label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rose"
                  className={inputCls}
                />
              </div>
              <div>
                <Label>Venmo</Label>
                <div className="flex h-14 items-center rounded-2xl bg-raised px-5 focus-within:ring-2 focus-within:ring-lime">
                  <span className="text-lg text-muted">@</span>
                  <input
                    value={venmo}
                    onChange={(e) => setVenmo(e.target.value)}
                    placeholder="rose-umass"
                    className="h-full w-full bg-transparent pl-1 text-lg outline-none placeholder:text-muted/60"
                  />
                </div>
                <p className="mt-2 text-sm text-muted">Hosts get paid back here. Joiners pay through it.</p>
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <PhoneField value={phone} onChange={setPhone} />
                <p className="mt-2 text-sm text-muted">
                  So your matches can text you. Only people in the same cart see it.
                </p>
              </div>
              <div>
                <Label>Where you live</Label>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => (
                    <Chip key={a} active={a === area} onClick={() => setArea(a)}>
                      {a}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <Button variant="ghost" className="w-auto px-6" onClick={() => setStep("email")}>
                Back
              </Button>
              <Button disabled={!profileOk} onClick={finish}>
                Let&apos;s go
              </Button>
            </div>
          </Card>
        </motion.section>
      </Page>
    );

  return (
    <Page className="pb-16 lg:pb-16">
      {/* hero */}
      <section className="grid items-center gap-12 pt-10 lg:min-h-[calc(100dvh-72px)] lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:pb-16 lg:pt-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm text-muted">
            <BadgeCheck size={15} className="text-lime" /> For UMass students · .edu verified
          </span>
          <h1 className="mt-6 text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Free shipping,
            <br />
            <span className="text-lime">together.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-snug text-muted lg:text-xl">
            Get matched with students on campus ordering from the same store. Hit the free-shipping minimum together and
            skip the fee.
          </p>

          <div id="signup" className="mt-10 max-w-xl">
            <Label>Your school email</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@umass.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goProfile()}
                className={inputCls}
              />
              <Button className="sm:w-auto sm:shrink-0 sm:px-7" disabled={!emailOk} onClick={goProfile}>
                Continue <ArrowRight size={18} />
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted">.edu only, so everyone in a cart is a verified student.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="pointer-events-none absolute -inset-10 rounded-full bg-lime/10 blur-3xl" />
          <div className="relative sm:py-16">
            <GhostCard storeId="hm" pct={0.84} className="-top-2 right-0 rotate-[4deg] opacity-60" />
            <GhostCard storeId="sephora" pct={1} className="-bottom-2 left-0 -rotate-[3deg] opacity-60" />
            <HeroDemo />
          </div>
        </motion.div>
      </section>

      {/* how it works */}
      <section id="how" className="mt-24 scroll-mt-24 lg:mt-8">
        <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {HOW.map((h) => (
            <Card key={h.n} className="lg:p-7">
              <div className="text-sm font-semibold text-lime">{h.n}</div>
              <div className="mt-3 text-xl font-semibold">{h.t}</div>
              <p className="mt-2 text-muted">{h.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* savings example */}
      <section className="mt-24 grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Five students, one H&amp;M order.</h2>
          <p className="mt-4 max-w-md text-lg text-muted">
            Ordering alone, each of them pays $6.99 to ship a $10 basket. Pooled into one cart, the order clears the
            minimum and shipping disappears.
          </p>
        </div>
        <Card className="space-y-3 lg:p-8">
          <div className="flex justify-between text-muted">
            <span>Five separate orders</span>
            <span>$52.00 + $34.95 shipping</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>One SplitCart order</span>
            <span>$52.00 + free shipping</span>
          </div>
          <div className="flex items-end justify-between border-t border-line pt-4">
            <span className="text-lg font-semibold">Group saves</span>
            <span className="text-4xl font-semibold tracking-tight text-lime">$34.95</span>
          </div>
        </Card>
      </section>

      {/* stores */}
      <section id="stores" className="mt-24 scroll-mt-24">
        <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Stores you can pool</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STORES.map((s) => (
            <Card key={s.id} className="flex flex-col items-center gap-3 py-6">
              <StoreBadge store={s} size={48} />
              <div className="font-medium">{s.name}</div>
              <div className="-mt-2 text-sm text-muted">free at ${s.freeShippingAt}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="mt-24 flex flex-col items-start justify-between gap-6 rounded-card bg-lime p-8 text-ink sm:p-10 lg:flex-row lg:items-center lg:p-14">
        <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
          Your next order doesn&apos;t need a shipping fee.
        </h2>
        <Button className="w-auto bg-ink px-8 text-white hover:bg-raised" onClick={toSignup}>
          Get started <ArrowRight size={18} />
        </Button>
      </section>

      <footer className="mt-16 flex flex-col justify-between gap-2 border-t border-line/50 pt-8 text-sm text-muted sm:flex-row">
        <span>© 2026 SplitCart</span>
        <span>Made at UMass Amherst</span>
      </footer>
    </Page>
  );
}
