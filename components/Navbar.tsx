"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3.5">
        <Link
          href="/dashboard"
          className="text-base font-bold tracking-tight text-slate-900"
        >
          Study<span className="text-brand-600">Sync</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
          >
            Dashboard
          </Link>
          <Link
            href="/preferences"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
          >
            Study
          </Link>
          <Button
            variant="secondary"
            size="sm"
            loading={signingOut}
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  );
}