"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
        <h1 className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">
          Patrimonio
        </h1>
        <h2 className="mb-6 text-lg font-semibold text-text">Accedi</h2>

        {sent ? (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
            <p className="mb-1 text-sm font-medium text-accent">
              Link inviato!
            </p>
            <p className="font-mono text-xs text-muted">
              Controlla la casella {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la-tua@email.com"
                required
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 font-mono text-sm text-text outline-none transition-colors focus:border-accent"
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#0a1a0e] transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {loading ? "Invio in corso..." : "Invia magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
