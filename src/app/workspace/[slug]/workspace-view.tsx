"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Boxes, ChartNoAxesCombined, FileText, LayoutDashboard, LogOut, Settings2, ShoppingCart, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Workspace={id:string;name:string;business_type:string;brand_color:string;slug:string;status:string};
const nav=[[LayoutDashboard,"الرئيسية"],[ShoppingCart,"نقطة البيع"],[Boxes,"المخزون والأصناف"],[FileText,"الفواتير"],[Wallet,"الحسابات"],[ChartNoAxesCombined,"التقارير"]] as const;

export default function WorkspaceView({workspace}:{workspace:Workspace}){
 const router=useRouter();
 async function signOut(){await createClient().auth.signOut();router.replace("/login");router.refresh()}
 return <main className="tenant-preview" dir="rtl" style={{"--tenant-color":workspace.brand_color} as React.CSSProperties}>
  <aside className="tenant-side"><Link href="/profile" className="tenant-brand"><i>{workspace.name.slice(0,1)}</i><b>{workspace.name}<small>SRVS ACCOUNTING</small></b></Link><span className="tenant-caption">مساحة العمل</span>{nav.map(([Icon,label],i)=><div className={`tenant-nav-row ${i===0?"tenant-active":""}`} key={label}><Icon size={17}/>{label}</div>)}<Link className="tenant-nav-row" href="/profile"><Settings2 size={17}/>إعدادات النشاط</Link><button className="tenant-nav-row tenant-logout" onClick={signOut}><LogOut size={17}/>تسجيل الخروج</button></aside>
  <section className="tenant-main"><header><span>مساحة العمل / الرئيسية</span><Link href="/profile">إعدادات الحساب <ArrowLeft size={13}/></Link></header><div className="tenant-content"><div className="tenant-title"><div><small>{workspace.business_type} · مساحة عمل مخصصة</small><h1>أهلاً بك في {workspace.name} <i>✦</i></h1><p>اتجهزت مساحة نشاطك. ابدأ بإضافة بياناتك لتظهر مؤشراتك وتقاريرك هنا.</p></div><span className="tenant-status-pill">الاشتراك نشط <i/></span></div><div className="tenant-warning tenant-active-note"><span>تم التفعيل</span> تم تأكيد الدفع وتجهيز مساحة العمل. أضف أصنافك وأول فاتورة لبدء متابعة نشاطك.</div>
   <div className="tenant-metrics"><article><small>مبيعات اليوم</small><b>٠ <i>ج.م</i></b><span>تظهر بعد تسجيل أول فاتورة</span></article><article><small>الفواتير</small><b>٠</b><span>لا توجد فواتير بعد</span></article><article><small>المخزون</small><b>٠</b><span>أضف أصنافك لمتابعة الكميات</span></article><article><small>العملاء</small><b>٠</b><span>أضف أول عميل لنشاطك</span></article></div>
   <section className="tenant-placeholder"><span className="feature-icon"><ShoppingCart size={20}/></span><h2>مساحة {workspace.name} جاهزة</h2><p>اتربط اشتراكك وحساب نشاطك بنجاح. واجهات التشغيل والمخزون والمحاسبة ستُحمّل من قاعدة بيانات مساحتك بعد إكمال إعداد النظام.</p><Link href="/profile">إعدادات النشاط والملف الشخصي <ArrowLeft size={15}/></Link></section></div></section></main>
}
