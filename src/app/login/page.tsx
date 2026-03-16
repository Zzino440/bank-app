"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setRegistered(true);
      }
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setRegistered(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
        <h1 className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">
          Patrimonio
        </h1>

        {/* Toggle */}
        <div className="mb-6 flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 font-mono text-xs uppercase tracking-wide transition-colors ${
              mode === "login"
                ? "bg-accent text-[#0a1a0e] font-semibold"
                : "text-muted hover:text-text"
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 py-2 font-mono text-xs uppercase tracking-wide transition-colors ${
              mode === "register"
                ? "bg-accent text-[#0a1a0e] font-semibold"
                : "text-muted hover:text-text"
            }`}
          >
            Registrati
          </button>
        </div>

        {registered ? (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
            <p className="mb-1 text-sm font-medium text-accent">Registrazione completata!</p>
            <p className="font-mono text-xs text-muted">
              Controlla la mail per confermare l&apos;account, poi accedi.
            </p>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-3 font-mono text-xs text-accent underline"
            >
              Vai al login
            </button>
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

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 font-mono text-sm text-text outline-none transition-colors focus:border-accent"
              />
            </div>

            {mode === "register" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-muted"
                >
                  Conferma password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 font-mono text-sm text-text outline-none transition-colors focus:border-accent"
                />
              </div>
            )}

            {error && (
              <p className="font-mono text-xs text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#0a1a0e] transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {loading
                ? "Attendere..."
                : mode === "login"
                ? "Accedi"
                : "Crea account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
