"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { CartCard } from "@/components/CartCard";
import { ActionBar, Button, Chip, Page } from "@/components/ui";
import { useRequireUser } from "@/components/useRequireUser";
import { isExpired } from "@/lib/split";
import { AREAS, type Area } from "@/lib/types";

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
const H2 = "mb-4 text-sm font-medium uppercase tracking-[0.12em] text-muted";

export default function Feed() {
  const { ready, user, carts } = useRequireUser();
  const router = useRouter();
  const [area, setArea] = useState<Area | "All">("All");

  const { mine, open } = useMemo(() => {
    if (!user) return { mine: [], open: [] };
    const isMine = (c: (typeof carts)[number]) => c.members.some((m) => m.userId === user.id);
    return {
      mine: carts.filter((c) => isMine(c) && c.status !== "settled"),
      open: carts
        .filter((c) => !isMine(c) && c.status === "open" && !isExpired(c))
        .filter((c) => area === "All" || c.area === area)
        .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)),
    };
  }, [carts, user, area]);

  if (!ready || !user) return null;

  return (
    <Page>
      <div className="mt-8 flex items-end justify-between gap-6 lg:mt-14">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight lg:text-5xl">Hey {user.name}</h1>
          <p className="mt-1 text-muted lg:mt-3 lg:text-lg">
            Tell us what you&apos;re ordering and we&apos;ll match you, or browse open carts below.
          </p>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => router.push("/match")}
        className="group mt-8 flex w-full items-center gap-5 rounded-card border border-lime/40 bg-gradient-to-r from-lime/15 to-transparent p-5 text-left transition-colors hover:border-lime lg:mt-10 lg:p-7"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime text-ink lg:h-14 lg:w-14">
          <Sparkles size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold lg:text-xl">What are you ordering?</div>
          <div className="text-muted">Get matched with students buying from the same store.</div>
        </div>
        <span className="hidden rounded-full bg-lime px-5 py-2.5 font-semibold text-ink transition-transform group-hover:translate-x-1 sm:block">
          Find my match
        </span>
      </motion.button>

      {mine.length > 0 && (
        <section className="mt-10">
          <h2 className={H2}>Your carts</h2>
          <div className={GRID}>
            {mine.map((c) => (
              <CartCard key={c.id} cart={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 lg:mt-14">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className={H2 + " mb-0"}>Or browse open carts</h2>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:justify-end lg:px-0">
            {(["All", ...AREAS] as const).map((a) => (
              <Chip key={a} active={a === area} onClick={() => setArea(a)}>
                {a}
              </Chip>
            ))}
          </div>
        </div>
        <motion.div layout className={GRID}>
          {open.map((c) => (
            <CartCard key={c.id} cart={c} />
          ))}
          {open.length === 0 && (
            <motion.div
              layout
              className="rounded-card border border-dashed border-line p-8 text-center text-muted sm:col-span-2 lg:col-span-3"
            >
              No open carts in {area === "All" ? "your area" : area} yet.
              <br />
              <span className="text-white">Start one and others can join.</span>
            </motion.div>
          )}
        </motion.div>
      </section>

      <ActionBar className="lg:hidden">
        <Button onClick={() => router.push("/match")}>
          <Sparkles size={19} /> Find my match
        </Button>
      </ActionBar>
    </Page>
  );
}
