"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./useApp";

export function useRequireUser() {
  const app = useApp();
  const router = useRouter();
  useEffect(() => {
    if (app.ready && !app.user) router.replace("/");
  }, [app.ready, app.user, router]);
  return app;
}
