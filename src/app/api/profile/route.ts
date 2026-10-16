import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function loadProfile(supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const [{ data: profile, error: profileError }, { data: workspace, error: workspaceError }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,phone").eq("id", user.id).maybeSingle(),
    supabase.from("workspaces").select("id,name,business_type,brand_color,slug,status").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (profileError || workspaceError) throw new Error("قاعدة البيانات غير جاهزة. شغّل supabase/schema.sql على مشروعك أولاً.");
  const { data: subscription, error: subscriptionError } = workspace
    ? await supabase.from("subscriptions").select("plan,current_period_end").eq("workspace_id", workspace.id).maybeSingle()
    : { data: null, error: null };
  if (subscriptionError) throw new Error("تعذر تحميل بيانات الاشتراك.");
  return {
    email: user.email ?? "",
    fullName: profile?.full_name || String(user.user_metadata?.full_name || ""),
    phone: profile?.phone || "",
    workspace: workspace ? { id: workspace.id, name: workspace.name, businessType: workspace.business_type, brandColor: workspace.brand_color, slug: workspace.slug, status: workspace.status, plan: subscription?.plan ?? null, currentPeriodEnd: subscription?.current_period_end ?? null } : null,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "سجّل الدخول للوصول إلى ملفك الشخصي." }, { status: 401 });
    return NextResponse.json(await loadProfile(supabase, user));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر تحميل الملف الشخصي." }, { status: 503 }); }
}

export async function PATCH(request: NextRequest) {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "الطلب غير صالح." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "البيانات المرسلة غير صالحة." }, { status: 400 }); }
  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 80) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 24) : "";
  if (fullName.length < 2) return NextResponse.json({ error: "اكتب الاسم بالكامل." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "سجّل الدخول لحفظ التغييرات." }, { status: 401 });
    const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (profileError) return NextResponse.json({ error: "تعذر حفظ بيانات الحساب. تأكد من تشغيل مخطط قاعدة البيانات." }, { status: 500 });
    if (body.workspace && typeof body.workspace === "object") {
      const workspace = body.workspace as Record<string, unknown>;
      const id = typeof workspace.id === "string" ? workspace.id : "";
      const name = typeof workspace.name === "string" ? workspace.name.trim().slice(0, 80) : "";
      const businessType = typeof workspace.businessType === "string" ? workspace.businessType.trim().slice(0, 80) : "";
      const brandColor = typeof workspace.brandColor === "string" ? workspace.brandColor : "";
      if (!id || name.length < 2 || !businessType || !/^#[\da-fA-F]{6}$/.test(brandColor)) return NextResponse.json({ error: "راجع بيانات هوية النشاط." }, { status: 400 });
      const { data: updated, error: workspaceError } = await supabase.rpc("update_my_workspace", { p_workspace_id: id, p_name: name, p_business_type: businessType, p_brand_color: brandColor });
      if (workspaceError || !updated) return NextResponse.json({ error: "تعذر تحديث هوية النشاط." }, { status: 500 });
    }
    return NextResponse.json(await loadProfile(supabase, user));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر حفظ التغييرات." }, { status: 503 }); }
}
