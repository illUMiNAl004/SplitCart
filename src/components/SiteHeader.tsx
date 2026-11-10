"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, RotateCcw, Sparkles } from "lucide-react";
import { isValidPhone } from "@/lib/phone";
import { setMemberPhone } from "@/lib/repo";
import { PhoneField } from "./PhoneField";
import { useApp } from "./useApp";
import { Wordmark } from "./Logo";
import { Avatar, Button, Label, Sheet, cn } from "./ui";

export function SiteHeader() {
  const { ready, user, carts, setUser, upsertCart, resetDemo } = useApp();
  const router = useRouter();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [phone, setPhone] = useState("");

  const openMenu = () => {
    setPhone(user?.phone ?? "");
    setMenu(true);
  };

  // update every cart you're in too, so your groups see the new number
  const savePhone = () => {
    if (!user) return;
    const next = phone ? phone : undefined;
    setUser({ ...user, phone: next });
    carts
      .filter((c) => c.members.some((m) => m.userId === user.id))
      .forEach((c) => upsertCart(setMemberPhone(c, user.id, next)));
    setMenu(false);
  };
  const phoneChanged = phone !== (user?.phone ?? "");
  const phoneOk = phone === "" || isValidPhone(phone);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-[15px] text-white/70 transition-colors hover:text-white",
        path === href && "bg-raised text-white",
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/40 bg-ink/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:h-[72px]">
        <Link href={user ? "/carts" : "/"} aria-label="SplitCart home">
          <Wordmark />
        </Link>

        {ready && user && (
          <div className="flex items-center gap-2">
            <nav className="mr-2 hidden items-center gap-1 lg:flex">{navLink("/carts", "Browse carts")}</nav>
            <Button
              className="hidden h-10 w-auto px-4 text-[15px] lg:inline-flex"
              onClick={() => router.push("/match")}
            >
              <Sparkles size={16} /> Find a match
            </Button>
            <button onClick={openMenu} aria-label="Account" className="ml-1">
              <Avatar name={user.name} size={36} />
            </button>
          </div>
        )}

        {ready && !user && (
          <nav className="flex items-center gap-1">
            <a
              href="#how"
              className="hidden rounded-full px-4 py-2 text-[15px] text-white/70 hover:text-white sm:block"
            >
              How it works
            </a>
            <a
              href="#stores"
              className="hidden rounded-full px-4 py-2 text-[15px] text-white/70 hover:text-white sm:block"
            >
              Stores
            </a>
            <Button
              className="ml-2 h-10 w-auto px-4 text-[15px]"
              onClick={() => document.getElementById("email")?.focus()}
            >
              Get started
            </Button>
          </nav>
        )}
      </div>

      {user && (
        <Sheet open={menu} onClose={() => setMenu(false)} title={user.name}>
          <p className="-mt-3 mb-6 text-muted">
            {user.email} · @{user.venmo} · {user.area}
          </p>
          <Label>Phone (optional)</Label>
          <PhoneField value={phone} onChange={setPhone} />
          <p className="mt-2 text-sm text-muted">Only people in the same cart can see it.</p>
          {phoneChanged && (
            <Button className="mt-3" disabled={!phoneOk} onClick={savePhone}>
              {phone ? "Save number" : "Remove number"}
            </Button>
          )}
          <div className="mt-6 space-y-3 border-t border-line pt-6">
            <Button
              variant="ghost"
              onClick={() => {
                resetDemo();
                setMenu(false);
              }}
            >
              <RotateCcw size={18} /> Reset demo carts
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setMenu(false);
                setUser(null);
                router.replace("/");
              }}
            >
              <LogOut size={18} /> Sign out
            </Button>
          </div>
        </Sheet>
      )}
    </header>
  );
}
