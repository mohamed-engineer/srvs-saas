"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, CircleHelp, Palette, Store, WalletCards } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

const colors = ["#29b8e8", "#377cf6", "#8b67e9", "#16a97a", "#f07852"];
const planNames: Record<string,string> = { monthly: "شهري", annual: "سنوي", lifetime: "مدى الحياة" };

export default function CreateSystem() {
  const router = useRouter();
  const [step,setStep] = useState(1);
  const [name,setName] = useState("");
  const [kind,setKind] = useState("متجر تجزئة");
  const [color,setColor] = useState(colors[0]);
  const [error,setError] = useState("");
  const [plan,setPlan] = useState("annual");
  const [busy,setBusy] = useState(false);
  const [signedIn,setSignedIn] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPlan(params.get("plan") || "annual");
    if (hasSupabasePublicEnv()) createClient().auth.getUser().then(({data})=>setSignedIn(Boolean(data.user))).catch(()=>setSignedIn(false));
    if (params.get("resume") === "1") {
      try {
        const saved = sessionStorage.getItem("srvs-onboarding-draft");
        if (saved) { const draft = JSON.parse(saved) as { name?:string; kind?:string; color?:string; plan?:string }; setName(draft.name||""); setKind(draft.kind||"متجر تجزئة"); setColor(draft.color||colors[0]); setPlan(draft.plan||params.get("plan")||"annual"); setStep(3); }
      } catch { /* Start with a clean onboarding form if an old draft is unreadable. */ }
    }
  }, []);
  async function continueToPayment() {
    if (!name.trim()) { setError("اكتب اسم نشاطك عشان نكمل."); setStep(1); return; }
    setError(""); setBusy(true);
    try {
      if (!hasSupabasePublicEnv()) throw new Error("أضف إعدادات Supabase في .env.local أولاً.");
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        sessionStorage.setItem("srvs-onboarding-draft", JSON.stringify({name,kind,color,plan}));
        router.push(`/login?mode=signup&next=${encodeURIComponent("/create?resume=1")}`);
        return;
      }
      const response = await fetch("/api/payments/checkout", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({name, businessType:kind, brandColor:color, plan}) });
      const result = await response.json() as {checkoutUrl?:string;error?:string};
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error||"تعذر بدء الدفع.");
      window.location.assign(result.checkoutUrl);
    } catch (e) { setError(e instanceof Error?e.message:"تعذر متابعة الطلب."); setBusy(false); }
  }
  return <main className="create-page" dir="rtl"><header className="create-nav"><Link className="marketing-brand" href="/"><span className="brand-symbol">S</span><span>SRVS<small>ACCOUNTING</small></span></Link><span className="create-secure"><CircleHelp size={15}/> إعداد نظامك</span></header><section className="create-wrap"><Link href="/" className="back-home"><ArrowRight size={15}/> العودة للرئيسية</Link><div className="create-heading"><span className="section-label">مساحة عملك على بُعد خطوات</span><h1>خلّينا نجهز نظامك.</h1><p>أدخل بيانات نشاطك وشاهد معاينة مخصصة قبل التفعيل.</p></div><div className="wizard-progress"><span className={step>=1?"progress-active":""}><i>1</i> نشاطك</span><b/><span className={step>=2?"progress-active":""}><i>2</i> المظهر</span><b/><span className={step>=3?"progress-active":""}><i>3</i> الباقة</span></div><div className="wizard-card">
      {step===1&&<><div className="wizard-title"><span><Store size={19}/></span><div><h2>احكيلنا عن نشاطك</h2><p>هنستخدم الاسم ده لتجهيز مساحة عملك.</p></div></div><label className="wizard-label">اسم النشاط التجاري<input autoFocus value={name} onChange={e=>{setName(e.target.value);setError("")}} placeholder="مثال: متجر النور" maxLength={48}/></label><label className="wizard-label">نوع النشاط<select value={kind} onChange={e=>setKind(e.target.value)}><option>متجر تجزئة</option><option>سوبر ماركت</option><option>مطعم أو كافيه</option><option>تجارة جملة</option><option>نشاط آخر</option></select></label>{error&&<p className="wizard-error">{error}</p>}<button className="cta-primary wizard-next" onClick={()=>name.trim()?setStep(2):setError("اكتب اسم نشاطك الأول.")}>التالي <ArrowLeft size={16}/></button></>}
      {step===2&&<><div className="wizard-title"><span><Palette size={19}/></span><div><h2>اختار لون مساحة عملك</h2><p>تقدر تغيّره لاحقاً من إعدادات النظام.</p></div></div><label className="wizard-label">اللون الرئيسي</label><div className="color-picker">{colors.map(c=><button key={c} aria-label={c} onClick={()=>setColor(c)} style={{background:c}} className={color===c?"color-selected":""}>{color===c&&<Check size={18}/>}</button>)}</div><div className="mini-brand-preview" style={{"--tenant-color":color} as React.CSSProperties}><span>معاينة مبدئية</span><div><i>S</i><b>{name||"اسم نشاطك"}</b></div><small>{kind} · SRVS Accounting</small></div><div className="wizard-actions"><button className="plan-button" onClick={()=>setStep(1)}><ChevronLeft size={15}/> السابق</button><button className="cta-primary" onClick={()=>setStep(3)}>التالي <ArrowLeft size={16}/></button></div></>}
      {step===3&&<><div className="wizard-title"><span><WalletCards size={19}/></span><div><h2>راجع طلبك</h2><p>بعد تسجيل الدخول هتنتقل للدفع الآمن عبر Kashier.</p></div></div><div className="order-summary"><div><span>النشاط</span><b>{name} · {kind}</b></div><div><span>الباقة المختارة</span><b>{planNames[plan]||"سنوي"}</b></div><div><span>اللون الرئيسي</span><b className="order-color"><i style={{background:color}}/>{color}</b></div></div><div className="payment-notice"><span>i</span><p><b>التفعيل بعد تأكيد الدفع</b><br/>هنجهز مساحة عمل نشاطك بعد ما Kashier يؤكد نجاح المعاملة لخادمنا. الرجوع من صفحة الدفع لوحده مش كفاية لتفعيل الاشتراك.</p></div>{error&&<p className="wizard-error" role="alert">{error}</p>}<button className="cta-primary wizard-next" onClick={continueToPayment} disabled={busy||!hasSupabasePublicEnv()}>{busy?"جاري تجهيز الدفع...":!hasSupabasePublicEnv()?"تجهيز الربط مطلوب":signedIn?"متابعة إلى الدفع":"إنشاء حساب ومتابعة الدفع"} <ArrowLeft size={16}/></button>{signedIn?<Link className="wizard-login-link" href="/profile">مراجعة إعدادات حسابي</Link>:<Link className="wizard-login-link" href={`/login?next=${encodeURIComponent("/create?resume=1")}`} onClick={()=>sessionStorage.setItem("srvs-onboarding-draft",JSON.stringify({name,kind,color,plan}))}>عندي حساب بالفعل — تسجيل الدخول</Link>}<button className="wizard-back" onClick={()=>setStep(2)}><ChevronLeft size={14}/> تعديل المظهر</button></>}
    </div><p className="create-footnote"><Check size={14}/> بياناتك المالية لا تمر عبر SRVS؛ الدفع يتم داخل Kashier</p></section><footer className="create-footer">© 2026 SRVS Digital <span>مساحة آمنة لإعداد نظامك</span></footer></main>;
}
