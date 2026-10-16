import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  let supabase;
  try { supabase = await createClient(); }
  catch { redirect("/login?setup=1"); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fapp");
  const { data: workspaces } = await supabase.from("workspaces").select("id,slug,status")
    .eq("owner_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(10);
  let expiredSlug: string | null = null;
  for (const workspace of workspaces ?? []) {
    const { data: subscription } = await supabase.from("subscriptions").select("status,current_period_end").eq("workspace_id", workspace.id).maybeSingle();
    if (subscription?.status === "active" && (!subscription.current_period_end || new Date(subscription.current_period_end).getTime() > Date.now())) {
      redirect(`/workspace/${encodeURIComponent(workspace.slug)}`);
    }
    if (subscription?.status === "active" && subscription.current_period_end) expiredSlug ??= workspace.slug;
  }
  if (expiredSlug) redirect(`/subscription/expired?workspace=${encodeURIComponent(expiredSlug)}`);
  redirect("/create");
}
