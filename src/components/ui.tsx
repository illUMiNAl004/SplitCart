"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Store } from "@/lib/types";

export const cn = (...c: ClassValue[]) => twMerge(clsx(c));

const DESKTOP = "(min-width: 1024px)";
// matches Tailwind `lg`
export function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(DESKTOP);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(DESKTOP).matches,
    () => false,
  );
}

export function Page({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 pb-48 sm:px-8 lg:pb-24", className)}>{children}</div>;
}

// Pinned to the bottom on phones, inline on desktop.
export function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md bg-gradient-to-t from-ink via-ink/95 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8",
        "lg:static lg:mx-0 lg:max-w-none lg:bg-none lg:p-0 lg:pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={cn(
        "inline-flex h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-[17px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-lime text-ink hover:bg-[#d6f86d]",
        variant === "ghost" && "bg-raised text-white hover:bg-line",
        variant === "danger" && "bg-transparent text-danger hover:bg-raised",
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    />
  );
}

export function Card({
  className,
  children,
  flush,
}: {
  className?: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <div className={cn("rounded-card border border-line/60 bg-surface", !flush && "p-5", className)}>{children}</div>
  );
}

export function ProgressBar({ value, tall }: { value: number; tall?: boolean }) {
  const done = value >= 1;
  return (
    <div className={clsx("relative w-full overflow-hidden rounded-full bg-raised", tall ? "h-4" : "h-2.5")}>
      <motion.div
        className={clsx("absolute inset-y-0 left-0 rounded-full", done ? "bg-lime" : "bg-lime/80")}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(value, 0.03) * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

export function StoreBadge({ store, size = 44 }: { store: Store; size?: number }) {
  const light = ["#E4E4E7", "#F4F4F5", "#F7A1C4", "#F5A524"].includes(store.color);
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl font-bold"
      style={{
        width: size,
        height: size,
        background: store.color,
        color: light ? "#101114" : "#fff",
        fontSize: size * (store.short.length > 1 ? 0.3 : 0.46),
      }}
    >
      {store.short}
    </div>
  );
}

export function Avatar({ name, size = 32, ring }: { name: string; size?: number; ring?: boolean }) {
  // stable pastel per name
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0) * 17, 0) % 360;
  return (
    <div
      className={clsx(
        "grid shrink-0 place-items-center rounded-full font-semibold text-ink",
        ring && "ring-2 ring-surface",
      )}
      style={{ width: size, height: size, background: `hsl(${hue} 70% 78%)`, fontSize: size * 0.42 }}
      title={name}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  return (
    <div className="flex -space-x-1.5">
      {names.slice(0, max).map((n, i) => (
        <Avatar key={n + i} name={n} size={28} ring />
      ))}
      {names.length > max && (
        <div className="grid h-7 w-7 place-items-center rounded-full bg-raised text-xs text-muted ring-2 ring-surface">
          +{names.length - max}
        </div>
      )}
    </div>
  );
}

function fmtLeft(ms: number) {
  if (ms <= 0) return "Closed";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m left`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m left`;
  return `${Math.floor(h / 24)}d left`;
}

export function Countdown({ deadline, className }: { deadline: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(deadline).getTime() - now;
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        ms <= 0 ? "bg-raised text-muted" : ms < 3_600_000 ? "bg-lime/15 text-lime" : "bg-raised text-white/80",
        className,
      )}
    >
      {fmtLeft(ms)}
    </span>
  );
}

// Bottom sheet on phones, centered dialog on desktop.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const desktop = useIsDesktop();
  const hidden = desktop ? { opacity: 0, y: 24, scale: 0.97 } : { y: "100%" };
  const shown = desktop ? { opacity: 1, y: 0, scale: 1 } : { y: 0 };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet"
          className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label={title}
            className="relative w-full max-w-md rounded-t-[2rem] border-t border-line bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:max-w-lg lg:rounded-[2rem] lg:border lg:px-8 lg:pb-8 lg:pt-8"
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={spring}
            drag={desktop ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line lg:hidden" />
            <h2 className="mb-5 text-2xl font-semibold tracking-tight">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MoneyInput({
  value,
  onChange,
  autoFocus,
  placeholder = "0.00",
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex items-baseline gap-1 rounded-2xl bg-raised px-5 py-4 focus-within:ring-2 focus-within:ring-lime">
      <span className="text-3xl font-semibold text-muted">$</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-line"
      />
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-lime bg-lime text-ink" : "border-line bg-transparent text-white/80 hover:border-muted",
      )}
    >
      {children}
    </motion.button>
  );
}

export const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted">{children}</div>
);
