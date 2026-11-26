"use client";

// Turns "what-if" mode on/off by adding ?whatif=1 to the page address.
// The page then uses predicted marks wherever there isn't a real one.

import { usePathname, useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function WhatIfSwitch({ on }: { on: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <Switch id="what-if" checked={on} onCheckedChange={(checked) => router.replace(checked ? `${pathname}?whatif=1` : pathname)} />
      <Label htmlFor="what-if">What-if</Label>
    </div>
  );
}
