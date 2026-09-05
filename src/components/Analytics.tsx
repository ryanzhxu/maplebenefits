"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires an anonymous pageview beacon on every route change. Renders nothing. */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    track("pageview", { path: pathname });
  }, [pathname]);

  return null;
}
