import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { configuredPlanPrice, isPlanKey } from "@/lib/plans";
import { getKashierApiBase } from "@/lib/kashier";

export const runtime = "nodejs";

function stringField(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function slugPart(value: string) { return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 48) || "my-business"; }

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "الطلب غير صالح." }, { status: 403 });
  }
  let supabase;
  try { supabase = await createClient(); }
  catch { return NextResponse.json({ error: "قاعدة البيانات غير مجهزة. أضف بيانات Supabase إلى .env.local." }, { status: 503 }); }
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "سجّل الدخول قبل متابعة الدفع." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "البيانات المرسلة غير صالحة." }, { status: 400 }); }
  const name = stringField(body.name, 80);
  const businessType = stringField(body.businessType, 80);
  const brandColor = stringField(body.brandColor, 7);
  const plan = body.plan;
  if (name.length < 2 || !businessType || !/^#[\da-fA-F]{6}$/.test(brandColor) || !isPlanKey(plan)) {
    return NextResponse.json({ error: "راجع اسم النشاط ونوعه والباقة واللون." }, { status: 400 });
  }
  const price = configuredPlanPrice(plan);
  if (!price) return NextResponse.json({ error: "سعر الباقة غير محدد بعد. أضف السعر المتفق عليه في .env.local." }, { status: 503 });

  const merchantId = process.env.KASHIER_MERCHANT_ID;
  const apiKey = process.env.KASHIER_API_KEY;
  const secretKey = process.env.KASHIER_SECRET_KEY;
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  const mode = process.env.KASHIER_MODE || "test";
  if (!merchantId || !apiKey || !secretKey || !appUrl || !["test", "live"].includes(mode)) {
    return NextResponse.json({ error: "أضف إعدادات Kashier ورابط الموقع إلى .env.local قبل بدء الدفع." }, { status: 503 });
  }
  let parsedAppUrl: URL;
  try { parsedAppUrl = new URL(appUrl); }
  catch { return NextResponse.json({ error: "قيمة APP_URL في .env.local غير صالحة." }, { status: 503 }); }
  if (parsedAppUrl.protocol !== "https:" && !(mode === "test" && ["localhost", "127.0.0.1"].includes(parsedAppUrl.hostname))) {
    return NextResponse.json({ error: "استخدم رابط HTTPS صالحاً في APP_URL عند تشغيل الدفع المباشر." }, { status: 503 });
  }
  let admin;
  try { admin = createAdminClient(); }
  catch { return NextResponse.json({ error: "أضف SUPABASE_SECRET_KEY إلى .env.local لتأمين تسجيل الدفع." }, { status: 503 }); }

  const workspaceId = randomUUID();
  const suffix = randomUUID().slice(0, 8);
  const slug = `${slugPart(name)}-${suffix}`;
  const merchantOrderId = `SRVS-${randomUUID()}`;
  const { error: workspaceError } = await admin.from("workspaces").insert({
    id: workspaceId, owner_id: user.id, name, slug, business_type: businessType, brand_color: brandColor, status: "pending_payment",
  });
  if (workspaceError) return NextResponse.json({ error: "تعذر إنشاء مساحة العمل. تأكد من تشغيل ملف supabase/schema.sql." }, { status: 500 });
  const { error: orderError } = await admin.from("payment_orders").insert({
    owner_id: user.id, workspace_id: workspaceId, plan, amount: price, currency: "EGP", merchant_order_id: merchantOrderId, status: "pending",
  });
  if (orderError) return NextResponse.json({ error: "تعذر تسجيل طلب الدفع." }, { status: 500 });

  const now = new Date();
  const configuredWebhook = process.env.KASHIER_WEBHOOK_URL?.trim();
  const webhookUrl = configuredWebhook || `${appUrl}/api/kashier/webhook`;
  let publicWebhookUrl: string | undefined;
  try {
    const parsedWebhook = new URL(webhookUrl);
    if (configuredWebhook && parsedWebhook.protocol !== "https:") return NextResponse.json({ error: "يجب أن يكون KASHIER_WEBHOOK_URL رابط HTTPS عاماً." }, { status: 503 });
    if (parsedWebhook.protocol === "https:") publicWebhookUrl = parsedWebhook.toString();
  } catch {
    if (configuredWebhook) return NextResponse.json({ error: "قيمة KASHIER_WEBHOOK_URL غير صالحة." }, { status: 503 });
    /* Local HTTP app URLs use authenticated session verification after redirect. */
  }
  const returnUrl = new URL("/payment/return", appUrl);
  returnUrl.searchParams.set("order", merchantOrderId);
  const sessionBody = {
    merchantId,
    mode,
    expireAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
    maxFailureAttempts: 3,
    paymentType: "credit",
    amount: price,
    currency: "EGP",
    order: merchantOrderId,
    merchantRedirect: encodeURIComponent(returnUrl.toString()),
    ...(publicWebhookUrl ? { serverWebhook: publicWebhookUrl } : {}),
    display: "ar",
    type: "one-time",
    allowedMethods: process.env.KASHIER_ALLOWED_METHODS || "card,wallet",
    failureRedirect: true,
    description: `اشتراك SRVS Accounting - ${name}`.slice(0, 119),
    // Kashier requires a stable merchant-side customer reference alongside the email.
    customer: { email: user.email, reference: user.id },
    metaData: { workspaceId, userId: user.id, plan, slug },
  };

  try {
    const gatewayResponse = await fetch(`${getKashierApiBase()}/v3/payment/sessions`, {
      method: "POST", headers: { "content-type": "application/json", Authorization: secretKey, "api-key": apiKey },
      body: JSON.stringify(sessionBody), cache: "no-store",
    });
    const gatewayBody = await gatewayResponse.json().catch(() => ({})) as {
      _id?: string;
      sessionUrl?: string;
      message?: string;
      error?: string | { message?: string; code?: string };
      code?: string;
    };
    if (!gatewayResponse.ok || !gatewayBody._id || !gatewayBody.sessionUrl) {
      const providerError = typeof gatewayBody.error === "string"
        ? gatewayBody.error
        : gatewayBody.error?.message;
      console.error("[kashier-checkout] Session creation rejected", {
        status: gatewayResponse.status,
        code: gatewayBody.code ?? (typeof gatewayBody.error === "object" ? gatewayBody.error?.code : undefined),
        message: gatewayBody.message ?? providerError,
        hasSessionId: Boolean(gatewayBody._id),
        hasSessionUrl: Boolean(gatewayBody.sessionUrl),
        mode,
      });
      await admin.from("payment_orders").update({ status: "failed" }).eq("merchant_order_id", merchantOrderId);
      return NextResponse.json({ error: "Kashier لم يستطع إنشاء جلسة الدفع. راجع مفاتيح وضع الاختبار وإعدادات التاجر." }, { status: 502 });
    }
    const checkout = new URL(gatewayBody.sessionUrl);
    if (checkout.protocol !== "https:" || checkout.hostname !== "payments.kashier.io") {
      await admin.from("payment_orders").update({ status: "failed" }).eq("merchant_order_id", merchantOrderId);
      return NextResponse.json({ error: "رابط الدفع الذي أعادته Kashier غير صالح." }, { status: 502 });
    }
    const { error: saveSessionError } = await admin.from("payment_orders").update({ kashier_session_id: gatewayBody._id }).eq("merchant_order_id", merchantOrderId);
    if (saveSessionError) return NextResponse.json({ error: "تعذر ربط جلسة الدفع بطلبك." }, { status: 500 });
    return NextResponse.json({ checkoutUrl: checkout.toString() });
  } catch {
    await admin.from("payment_orders").update({ status: "failed" }).eq("merchant_order_id", merchantOrderId);
    return NextResponse.json({ error: "تعذر الاتصال ببوابة Kashier حالياً." }, { status: 502 });
  }
}
