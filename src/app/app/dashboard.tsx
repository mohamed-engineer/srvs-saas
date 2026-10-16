"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Bell, Boxes, CalendarDays, Check, ChevronDown, CircleHelp,
  Command, CreditCard, Download, FileBarChart, FileText, LayoutDashboard, Menu, MoreHorizontal,
  Plus, RotateCcw, Search, Settings2, ShieldCheck, ShoppingCart, Sparkles, TrendingDown,
  TrendingUp, Truck, UsersRound, Wallet, X,
} from "lucide-react";
import ErpWorkspace from "../erp-workspace";

type Tx = { name: string; category: string; date: string; amount: number; kind: "in" | "out"; status: string; initials: string; color: string };
const transactions: Tx[] = [
  { name: "شركة نُقطة للتسويق", category: "دفعة فاتورة #INV-2048", date: "اليوم، ١٠:٤٢ ص", amount: 18500, kind: "in", status: "مكتملة", initials: "نق", color: "violet" },
  { name: "مساحة عمل — ذا ويرك", category: "إيجار المكتب", date: "اليوم، ٩:١٥ ص", amount: 6200, kind: "out", status: "مكتملة", initials: "W", color: "orange" },
  { name: "أحمد محمد", category: "راتب شهر أكتوبر", date: "أمس، ٤:٣٠ م", amount: 12000, kind: "out", status: "مكتملة", initials: "أم", color: "blue" },
  { name: "شركة أفق الرقمية", category: "دفعة فاتورة #INV-2045", date: "أمس، ١:٠٥ م", amount: 24500, kind: "in", status: "مكتملة", initials: "أف", color: "green" },
  { name: "AWS Cloud Services", category: "اشتراك خدمات سحابية", date: "١٤ أكتوبر، ١١:٢٠ ص", amount: 3850, kind: "out", status: "قيد المراجعة", initials: "A", color: "amber" },
];

const navItems = [
  { label: "الرئيسية", icon: LayoutDashboard }, { label: "نقطة البيع", icon: ShoppingCart },
  { label: "المخزون والأصناف", icon: Boxes }, { label: "الجرد اليومي", icon: CalendarDays },
  { label: "الموردون", icon: Truck }, { label: "المبيعات", icon: FileText },
  { label: "الحسابات والميزانية", icon: Wallet }, { label: "المرتجعات", icon: RotateCcw },
  { label: "العملاء والديون", icon: UsersRound }, { label: "التقارير", icon: FileBarChart },
  { label: "إدارة الصلاحيات", icon: ShieldCheck },
];
const money = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

function IconButton({ children, label, onClick, className = "" }: { children: React.ReactNode; label: string; onClick?: () => void; className?: string }) {
  return <button aria-label={label} title={label} onClick={onClick} className={`icon-button ${className}`}>{children}</button>;
}

export default function Home() {
  const [active, setActive] = useState("الرئيسية");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("آخر ٧ أيام");
  const [showForm, setShowForm] = useState(false);
  const [entryKind, setEntryKind] = useState<"in" | "out">("in");
  const [notice, setNotice] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [txList, setTxList] = useState(transactions);
  const [transactionsReady, setTransactionsReady] = useState(false);
  const [today, setToday] = useState("");
  const filtered = useMemo(() => txList.filter((tx) => `${tx.name} ${tx.category}`.toLowerCase().includes(query.toLowerCase())), [query, txList]);
  const totalIncome = txList.filter((tx) => tx.kind === "in").reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = txList.filter((tx) => tx.kind === "out").reduce((sum, tx) => sum + tx.amount, 0);

  useEffect(() => {
    setToday(new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()));
    try {
      const saved = localStorage.getItem("srvs-transactions-v1");
      if (saved) setTxList(JSON.parse(saved) as Tx[]);
    } catch { /* Keep the sample transactions if local demo data is invalid. */ }
    setTransactionsReady(true);
  }, []);
  useEffect(() => { if (transactionsReady) localStorage.setItem("srvs-transactions-v1", JSON.stringify(txList)); }, [txList, transactionsReady]);

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function addTransaction(name: string, category: string, amount: number, kind: "in" | "out") {
    setTxList((current) => [{ name, category, date: "الآن", amount, kind, status: "مكتملة", initials: name.slice(0, 2), color: kind === "in" ? "green" : "amber" }, ...current]);
  }

  function submitEntry(formData: FormData) {
    const name = String(formData.get("name") || "عملية جديدة");
    const raw = Number(formData.get("amount"));
    const kind = String(formData.get("kind")) as "in" | "out";
    if (!raw || raw < 1) return;
    addTransaction(name, kind === "in" ? "إيراد جديد" : "مصروف جديد", raw, kind);
    setShowForm(false); announce("تمت إضافة العملية بنجاح");
  }

  return (
    <main className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><span>S</span><i /></div><div className="brand-name">SRVS<span>BOOKS</span></div><IconButton label="إغلاق القائمة" className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18}/></IconButton></div>
        <div className="workspace"><div className="workspace-icon">ن</div><div className="workspace-text"><b>سوبر ماركت النور</b><span>الخطة الاحترافية</span></div><ChevronDown size={15} className="muted"/></div>
        <div className="nav-caption">مساحة العمل</div>
        <nav className="nav-list">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActive(label); setMobileOpen(false); }} className={`nav-item ${active === label ? "active" : ""}`}><Icon size={18} strokeWidth={1.8}/><span>{label}</span></button>)}</nav>
        <div className="nav-caption second-caption">إدارة</div>
        <button className={`nav-item ${active === "الإعدادات" ? "active" : ""}`} onClick={() => { setActive("الإعدادات"); setMobileOpen(false); }}><Settings2 size={18}/><span>الإعدادات</span></button>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-top"><span className="help-icon"><CircleHelp size={16}/></span><span>تحتاج مساعدة؟</span><ArrowLeft size={14}/></div><p>فريق SRVS جاهز لمساعدتك في أي وقت.</p><a href="mailto:support@srvsdigital.com">تواصل مع الدعم <ArrowLeft size={12}/></a></div>
          <div className="profile"><div className="avatar avatar-profile">ع</div><div className="profile-text"><b>عمر خالد</b><span>مدير الحساب</span></div><MoreHorizontal size={19} className="muted"/></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="breadcrumb"><IconButton label="فتح القائمة" className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={19}/></IconButton><span>مساحة العمل</span><span className="crumb-slash">/</span><b>{active}</b></div><div className="top-actions"><div className="top-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن أي شيء..."/><kbd><Command size={11}/> K</kbd></div><span className="top-sep"/><IconButton label="الإشعارات" onClick={() => setNotice("لا توجد إشعارات جديدة")}><Bell size={18}/><i className="notification-dot"/></IconButton><Link className="top-avatar profile-avatar-link" href="/profile" aria-label="إعدادات الملف الشخصي">ع</Link></div></header>

        <div className="content">
          {active === "الرئيسية" ? <>
          <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> {today}</div><h1>صباح الخير، عمر <span>✦</span></h1><p>إليك ملخص أعمالك المالي لهذا اليوم.</p></div><div className="welcome-actions"><button className="button button-secondary" onClick={() => setNotice("جاري تجهيز تقريرك للتحميل")}><Download size={16}/> تصدير التقرير</button><button className="button button-primary" onClick={() => { setEntryKind("in"); setShowForm(true); }}><Plus size={17}/> عملية جديدة</button></div></div>

          <section className="metrics-grid" aria-label="ملخص الحسابات">
            <article className="metric-card metric-main"><div className="metric-head"><span>إجمالي الإيرادات</span><span className="metric-icon blue-icon"><Wallet size={18}/></span></div><div className="metric-value">ج.م {money(totalIncome)}</div><div className="metric-foot"><span className="trend trend-up"><TrendingUp size={13}/> ١٢٫٨٪</span><span>مقارنة بالشهر الماضي</span><svg className="sparkline" viewBox="0 0 120 38" fill="none"><path d="M1 31C13 31 12 25 23 27s12-14 23-12 14 17 24 12S82 9 91 13s15 8 28-8" stroke="currentColor" strokeWidth="2"/><path d="M1 31C13 31 12 25 23 27s12-14 23-12 14 17 24 12S82 9 91 13s15 8 28-8v21H1Z" fill="url(#sp1)"/><defs><linearGradient id="sp1" x1="60" y1="5" x2="60" y2="38"><stop stopColor="#4F8CFF" stopOpacity=".2"/><stop offset="1" stopColor="#4F8CFF" stopOpacity="0"/></linearGradient></defs></svg></div></article>
            <article className="metric-card"><div className="metric-head"><span>إجمالي المصروفات</span><span className="metric-icon purple-icon"><CreditCard size={18}/></span></div><div className="metric-value">ج.م {money(totalExpenses)}</div><div className="metric-foot"><span className="trend trend-down"><TrendingDown size={13}/> ٣٫٢٪</span><span>مقارنة بالشهر الماضي</span><svg className="sparkline purple-line" viewBox="0 0 120 38" fill="none"><path d="M1 11c12 3 13 15 25 11s14 8 25 5 13-9 24-5 15-12 24-11 11 10 20 4" stroke="currentColor" strokeWidth="2"/></svg></div></article>
            <article className="metric-card"><div className="metric-head"><span>صافي الربح</span><span className="metric-icon green-icon"><TrendingUp size={18}/></span></div><div className="metric-value">ج.م {money(totalIncome - totalExpenses)}</div><div className="metric-foot"><span className="trend trend-up"><TrendingUp size={13}/> ١٨٫٤٪</span><span>مقارنة بالشهر الماضي</span><svg className="sparkline green-line" viewBox="0 0 120 38" fill="none"><path d="M1 32c12-3 15-15 26-12s12-9 23-7 13 7 23 4 14-8 23-6 13-6 23-8" stroke="currentColor" strokeWidth="2"/></svg></div></article>
            <article className="metric-card"><div className="metric-head"><span>فواتير مستحقة</span><span className="metric-icon amber-icon"><FileText size={18}/></span></div><div className="metric-value">ج.م ١٨٬٧٥٠</div><div className="metric-foot"><span className="due-pill">٤ فواتير</span><span>تحتاج إلى متابعة</span><span className="due-bars"><i/><i/><i/><i/><i/></span></div></article>
          </section>

          <section className="insight-banner"><div className="insight-glow"/><div className="insight-icon"><Sparkles size={18}/></div><div className="insight-copy"><b>أعمالك تنمو بشكل رائع هذا الشهر</b><span>إيراداتك زادت بنسبة <strong>١٢٫٨٪</strong> عن الشهر الماضي. حافظ على هذا التقدم!</span></div><button onClick={() => setActive("التقارير")}>عرض التحليل <ArrowLeft size={14}/></button><button className="insight-dismiss" aria-label="إغلاق" onClick={(e) => e.currentTarget.parentElement?.remove()}><X size={15}/></button></section>

          <section className="analytics-grid">
            <article className="panel chart-panel"><div className="panel-header"><div><h2>نظرة عامة</h2><p>تابع أداءك المالي خلال الفترة المحددة</p></div><button className="select-button" onClick={() => setPeriod(period === "آخر ٧ أيام" ? "آخر ٣٠ يوم" : "آخر ٧ أيام")}><CalendarDays size={14}/>{period}<ChevronDown size={13}/></button></div>
              <div className="chart-legend"><span><i className="legend-income"/> الإيرادات <b>ج.م {money(totalIncome)}</b></span><span><i className="legend-expense"/> المصروفات <b>ج.م {money(totalExpenses)}</b></span></div>
              <div className="chart-wrap"><div className="chart-y"><span>٣٠ ألف</span><span>٢٠ ألف</span><span>١٠ آلاف</span><span>٠</span></div><div className="chart-canvas"><div className="chart-gridlines"><i/><i/><i/><i/></div><svg viewBox="0 0 700 210" preserveAspectRatio="none" className="chart-svg"><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5791ff" stopOpacity=".2"/><stop offset="1" stopColor="#5791ff" stopOpacity="0"/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9871ff" stopOpacity=".12"/><stop offset="1" stopColor="#9871ff" stopOpacity="0"/></linearGradient></defs><path d="M0 147 C38 135 54 145 88 125 S145 131 176 104 S232 123 264 93 S320 102 352 77 S410 93 440 61 S498 78 528 52 S585 67 616 37 S666 53 700 23 V210 H0Z" fill="url(#incomeFill)"/><path d="M0 174 C38 165 54 173 88 157 S145 170 176 151 S232 162 264 139 S320 151 352 131 S410 146 440 118 S498 134 528 106 S585 121 616 99 S666 112 700 89 V210 H0Z" fill="url(#expenseFill)"/><path d="M0 147 C38 135 54 145 88 125 S145 131 176 104 S232 123 264 93 S320 102 352 77 S410 93 440 61 S498 78 528 52 S585 67 616 37 S666 53 700 23" fill="none" stroke="#5791ff" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/><path d="M0 174 C38 165 54 173 88 157 S145 170 176 151 S232 162 264 139 S320 151 352 131 S410 146 440 118 S498 134 528 106 S585 121 616 99 S666 112 700 89" fill="none" stroke="#9b7bff" strokeWidth="2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke"/></svg><div className="chart-x"><span>١٠ أكتوبر</span><span>١١ أكتوبر</span><span>١٢ أكتوبر</span><span>١٣ أكتوبر</span><span>١٤ أكتوبر</span><span>١٥ أكتوبر</span><span>١٦ أكتوبر</span></div></div></div>
            </article>
            <article className="panel cash-panel"><div className="panel-header"><div><h2>توزيع المصروفات</h2><p>حسب فئة الإنفاق</p></div><IconButton label="خيارات المصروفات"><MoreHorizontal size={19}/></IconButton></div><div className="donut-area"><div className="donut"><div className="donut-hole"><span>الإجمالي</span><b>٤٨٫٢ <small>ألف</small></b></div></div></div><div className="category-list"><div><span><i className="cat-dot cat-purple"/> رواتب وأجور</span><b>٤٥٪ <small>ج.م ٢١٬٧١٣</small></b></div><div><span><i className="cat-dot cat-blue"/> تشغيل ومرافق</span><b>٢٨٪ <small>ج.م ١٣٬٥١٠</small></b></div><div><span><i className="cat-dot cat-pink"/> تسويق وإعلان</span><b>١٧٪ <small>ج.م ٨٬٢٠٣</small></b></div><div><span><i className="cat-dot cat-muted"/> أخرى</span><b>١٠٪ <small>ج.م ٤٬٨٢٥</small></b></div></div></article>
          </section>

          <section className="panel transactions-panel"><div className="panel-header transaction-heading"><div><h2>آخر العمليات</h2><p>كل الحركات المالية في مكان واحد</p></div><div className="transaction-tools"><label className="table-search"><Search size={14}/><input aria-label="البحث في العمليات" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في العمليات"/>{query && <button onClick={() => setQuery("")} aria-label="مسح البحث"><X size={12}/></button>}</label><button className="filter-button" onClick={() => setNotice("عرض جميع العمليات")}><span>تصفية</span><ChevronDown size={13}/></button><button className="text-link" onClick={() => setActive("التقارير")}>عرض الكل <ArrowLeft size={13}/></button></div></div><div className="table-scroll"><table><thead><tr><th>العملية</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th><th><span className="sr-only">التفاصيل</span></th></tr></thead><tbody>{filtered.map((tx, i) => <tr key={`${tx.name}-${i}`}><td><div className="tx-person"><div className={`avatar avatar-${tx.color}`}>{tx.initials}</div><span><b>{tx.name}</b><small>{tx.category}</small></span></div></td><td className="tx-date">{tx.date}</td><td className={`tx-amount ${tx.kind === "in" ? "amount-in" : ""}`}><span>{tx.kind === "in" ? "+" : "−"} ج.م {money(tx.amount)}</span><small>{tx.kind === "in" ? "إيراد" : "مصروف"}</small></td><td><span className={`status ${tx.status === "مكتملة" ? "status-done" : "status-pending"}`}><i/>{tx.status}</span></td><td><IconButton label="خيارات العملية"><MoreHorizontal size={18}/></IconButton></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state">لا توجد عمليات مطابقة للبحث</div>}</div><div className="table-footer"><span>عرض <b>{filtered.length}</b> من <b>{txList.length}</b> عمليات</span><button className="table-more" onClick={() => setNotice("أنت تعرض أحدث العمليات حالياً")}>كل العمليات <ArrowLeft size={13}/></button></div></section>

          </> : active === "الإعدادات" ? <section className="erp-workspace"><div className="module-header"><div><div className="module-eyebrow"><Settings2 size={14}/><span>إدارة المتجر</span></div><h1>الإعدادات</h1><p>إعدادات مساحة العمل والبيانات التجريبية</p></div></div><article className="panel settings-card"><div><b>بيانات التجربة</b><span>يمكنك مسح البيانات المحلية والعودة إلى بيانات البداية.</span></div><button className="button button-secondary" onClick={() => { if (window.confirm("سيتم حذف بيانات التجربة المحفوظة في هذا المتصفح وإعادتها لبيانات البداية. هل تريد المتابعة؟")) { localStorage.removeItem("srvs-store-v1"); localStorage.removeItem("srvs-transactions-v1"); window.location.reload(); } }}>إعادة ضبط بيانات التجربة</button><small>البيانات محفوظة في متصفح هذا الجهاز فقط حتى الآن.</small></article></section> : <ErpWorkspace section={active} search={query} transactions={txList} onRecord={addTransaction} onAddExpense={() => { setEntryKind("out"); setShowForm(true); }} notify={announce}/>}

          <footer className="footer"><span>© ٢٠٢٦ SRVS Digital. جميع الحقوق محفوظة.</span><span><ShieldCheck size={13}/> بياناتك محمية ومشفّرة</span><a href="https://srvsdigital.com" target="_blank">صُنع بعناية بواسطة <b>SRVS</b> <span>✦</span></a></footer>
        </div>
      </section>

      {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><form action={submitEntry} className="entry-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><div><h2>{entryKind === "out" ? "تسجيل مصروف" : "إضافة عملية جديدة"}</h2><p>سجّل إيرادًا أو مصروفًا في حساباتك</p></div><IconButton label="إغلاق" onClick={() => setShowForm(false)}><X size={18}/></IconButton></div><label>اسم العملية<input name="name" required placeholder={entryKind === "out" ? "مثال: فاتورة كهرباء" : "مثال: دفعة من عميل"}/></label><label>المبلغ (ج.م)<input name="amount" required type="number" min="1" placeholder="0.00"/></label><label>نوع العملية<select name="kind" defaultValue={entryKind}><option value="in">إيراد</option><option value="out">مصروف</option></select></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>إلغاء</button><button type="submit" className="button button-primary"><Check size={15}/> حفظ العملية</button></div></form></div>}
      {notice && <div role="status" className="toast"><span className="toast-check"><Check size={14}/></span>{notice}<button aria-label="إغلاق" onClick={() => setNotice("")}><X size={14}/></button></div>}
    </main>
  );
}

