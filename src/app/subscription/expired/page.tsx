import Link from "next/link";
import { ArrowLeft,Clock3,Mail } from "lucide-react";

export default function SubscriptionExpiredPage(){
 return <main className="auth-page" dir="rtl"><header className="auth-nav"><Link href="/" className="marketing-brand"><span className="brand-symbol">S</span><span>SRVS<small>ACCOUNTING</small></span></Link><span className="create-secure">إدارة الاشتراك</span></header><section className="auth-card"><div className="auth-mark"><Clock3 size={20}/></div><span className="section-label">SRVS Accounting</span><h1>انتهت مدة الاشتراك</h1><p>مساحة العمل محفوظة، لكن الوصول إليها متوقف حتى تجديد الاشتراك. تواصل مع فريق SRVS لتجديده أو تعديل الباقة.</p><a className="cta-primary auth-submit" href="mailto:support@srvsdigital.com?subject=تجديد%20اشتراك%20SRVS">التواصل مع الدعم <Mail size={15}/></a><Link className="wizard-login-link" href="/profile">عرض الملف الشخصي <ArrowLeft size={14}/></Link></section><footer className="auth-bottom">© 2026 SRVS Digital</footer></main>
}
