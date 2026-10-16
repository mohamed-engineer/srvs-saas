import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkspaceView from "./workspace-view";

export default async function WorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let supabase;
  try { supabase = await createClient(); }
  catch { redirect("/login?setup=1"); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/workspace/${slug}`)}`);
  const { data: workspace } = await supabase.from("workspaces").select("id,name,business_type,brand_color,slug,status")
    .eq("slug", slug).eq("owner_id", user.id).maybeSingle();
  if (!workspace) redirect("/create");
  if (workspace.status === "suspended") redirect(`/subscription/expired?workspace=${encodeURIComponent(slug)}`);
  if (workspace.status === "active") {
    const { data: subscription } = await supabase.from("subscriptions").select("status,current_period_end").eq("workspace_id", workspace.id).maybeSingle();
    if (subscription?.status === "active" && subscription.current_period_end && new Date(subscription.current_period_end).getTime() <= Date.now()) {
      redirect(`/subscription/expired?workspace=${encodeURIComponent(slug)}`);
    }
  }
  if (workspace.status !== "active") {
    const { data: order } = await supabase.from("payment_orders").select("merchant_order_id")
      .eq("workspace_id", workspace.id).eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (order) redirect(`/payment/return?order=${encodeURIComponent(order.merchant_order_id)}`);
    redirect("/create");
  }
  if (workspace.status === "active") {
    const { data: subscription } = await supabase.from("subscriptions").select("status").eq("workspace_id", workspace.id).maybeSingle();
    if (subscription?.status !== "active") redirect("/create");
  }
  return <WorkspaceView workspace={workspace} />;
}
