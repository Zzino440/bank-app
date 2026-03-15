import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-[920px] px-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-mono text-sm uppercase tracking-widest text-muted">
            Patrimonio
          </h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {user.email}
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-lg text-muted">Dashboard in costruzione</p>
        <p className="mt-2 font-mono text-xs text-muted">
          Autenticato come {user.email}
        </p>
      </div>
    </div>
  );
}
