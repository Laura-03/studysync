"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Study<span className="text-brand-600">Sync</span>
        </Link>
        <h1 className="mt-6 text-xl font-semibold text-slate-900">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Log in to continue studying.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-sm font-medium text-slate-500">Loading…</div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}