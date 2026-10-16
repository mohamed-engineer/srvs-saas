import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getKashierApiBase } from "@/lib/kashier";
import { toMinorUnits } from "@/lib/plans";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order")?.slice(0, 64) || "";
  if (!/^SRVS-[\da-f-]{36}$/i.test(orderId)) return NextResponse.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "سجّل الدخول لمراجعة الدفع." }, { status: 401 });
    const { data: order, error } = await supabase.from("payment_orders").select("workspace_id,status,kashier_session_id,amount,currency").eq("merchant_order_id", orderId).eq("owner_id", user.id).maybeSingle();
    if (error || !order) return NextResponse.json({ error: "لم يتم العثور على طلب الدفع." }, { status: 404 });
    let status = order.status;
    if (status === "pending" && order.kashier_session_id) {
      const gatewayResponse = await fetch(`${getKashierApiBase()}/v3/payment/sessions/${encodeURIComponent(order.kashier_session_id)}`, { cache: "no-store" });
      if (gatewayResponse.ok) {
        const session = await gatewayResponse.json() as { _id?:string; status?:string; merchantId?:string; capturedAmount?:string|number; paymentParams?:{order?:string;amount?:string|number;currency?:string} };
        const finalStatus = session.status?.toUpperCase();
        const validOrder = session._id === order.kashier_session_id && session.paymentParams?.order === orderId && session.merchantId === process.env.KASHIER_MERCHANT_ID && session.paymentParams.currency === "EGP" && session.paymentParams.amount !== undefined && toMinorUnits(String(session.paymentParams.amount)) === toMinorUnits(String(order.amount));
        if (validOrder && finalStatus === "PAID" && session.capturedAmount !== undefined && toMinorUnits(String(session.capturedAmount)) === toMinorUnits(String(order.amount))) {
          const admin = createAdminClient();
          const { data: fulfilled, error: fulfillError } = await admin.rpc("fulfill_kashier_order", { p_merchant_order_id: orderId, p_success: true, p_transaction_id: null });
          if (!fulfillError && (fulfilled === "paid" || fulfilled === "already_paid")) status = "paid";
        } else if (validOrder && ["FAILED","EXPIRED","ABANDONED","REJECTED","VOIDED","REVERSED","REFUNDED"].includes(finalStatus || "")) {
          await createAdminClient().rpc("fulfill_kashier_order", { p_merchant_order_id: orderId, p_success: false, p_transaction_id: null });
          status = "failed";
        }
      }
    }
    const { data: workspace } = await supabase.from("workspaces").select("slug,status").eq("id", order.workspace_id).eq("owner_id", user.id).maybeSingle();
    if (status === "paid" && workspace?.status !== "active") {
      const { data: refreshed } = await supabase.from("workspaces").select("slug,status").eq("id", order.workspace_id).eq("owner_id", user.id).maybeSingle();
      return NextResponse.json({ status, workspaceSlug: refreshed?.slug ?? null, workspaceStatus: refreshed?.status ?? null });
    }
    return NextResponse.json({ status, workspaceSlug: workspace?.slug ?? null, workspaceStatus: workspace?.status ?? null });
  } catch { return NextResponse.json({ error: "قاعدة البيانات غير جاهزة لمراجعة الدفع." }, { status: 503 }); }
}
