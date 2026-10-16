import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toMinorUnits } from "@/lib/plans";
import { verifyKashierWebhook } from "@/lib/kashier";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { event?: unknown; data?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return new NextResponse(null, { status: 400 }); }
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) return new NextResponse(null, { status: 400 });
  const data = body.data as Record<string, unknown>;
  if (!verifyKashierWebhook(data, request.headers.get("x-kashier-signature"))) return new NextResponse(null, { status: 401 });
  if (typeof body.event !== "string") return new NextResponse(null, { status: 200 });

  const merchantId = process.env.KASHIER_MERCHANT_ID;
  if (!merchantId || data.merchantId !== merchantId) return new NextResponse(null, { status: 401 });
  const orderId = typeof data.merchantOrderId === "string" ? data.merchantOrderId : typeof data.orderReference === "string" ? data.orderReference : "";
  if (!orderId) return new NextResponse(null, { status: 400 });
  const status = typeof data.status === "string" ? data.status.toUpperCase() : "";
  if (["refund", "partial_refund", "void", "reversal"].includes(body.event)) {
    if (status !== "SUCCESS") return new NextResponse(null, { status: 200 });
    try {
      const { error } = await createAdminClient().rpc("revoke_kashier_order", { p_merchant_order_id: orderId, p_event: body.event });
      return new NextResponse(null, { status: error ? 500 : 200 });
    } catch { return new NextResponse(null, { status: 500 }); }
  }
  if (body.event !== "pay") return new NextResponse(null, { status: 200 });
  // A webhook status is a transaction result, not necessarily the payment session's final state.
  // Only successful transactions can provision the workspace; failed attempts may be retried.
  if (status !== "SUCCESS") return new NextResponse(null, { status: 200 });
  if (data.currency !== "EGP" || data.amount === undefined) return new NextResponse(null, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data: order, error } = await admin.from("payment_orders").select("id,amount,currency,status").eq("merchant_order_id", orderId).maybeSingle();
    if (error || !order) return new NextResponse(null, { status: 409 });
    if (order.currency !== "EGP" || toMinorUnits(String(order.amount)) !== toMinorUnits(String(data.amount))) return new NextResponse(null, { status: 400 });
    const { error: rpcError } = await admin.rpc("fulfill_kashier_order", {
      p_merchant_order_id: orderId,
      p_success: true,
      p_transaction_id: typeof data.transactionId === "string" ? data.transactionId.slice(0, 160) : null,
    });
    if (rpcError) return new NextResponse(null, { status: 500 });
    return new NextResponse(null, { status: 200 });
  } catch { return new NextResponse(null, { status: 500 }); }
}
