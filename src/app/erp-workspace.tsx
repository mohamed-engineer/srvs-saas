"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpLeft, BadgeCheck, Banknote, Boxes, CalendarDays, Check, ChevronDown, CircleAlert, ClipboardList, CreditCard, FileBarChart, FilePlus2, FileText, PackagePlus, Plus, RotateCcw, Search, ShieldCheck, ShoppingCart, Trash2, TrendingUp, Truck, UsersRound, Wallet, X } from "lucide-react";

type Product = { id: string; name: string; category: string; barcode: string; cost: number; price: number; stock: number; min: number };
type Supplier = { id: string; name: string; phone: string; balance: number };
type Customer = { id: string; name: string; phone: string; balance: number };
type Sale = { id: string; date: string; customer: string; payment: string; total: number; status: "مكتملة" | "مرتجعة"; items: { productId: string; name: string; qty: number; price: number }[] };
type Movement = { id: string; date: string; name: string; type: string; qty: number; note: string };
type Staff = { id: string; name: string; role: string; access: string };
type StoreData = { products: Product[]; suppliers: Supplier[]; customers: Customer[]; sales: Sale[]; movements: Movement[]; staff: Staff[]; returns: { id: string; sale: string; amount: number; date: string }[] };
type Transaction = { name: string; category: string; date: string; amount: number; kind: "in" | "out"; status: string; initials: string; color: string };

const seed: StoreData = {
  products: [
    { id: "p1", name: "أرز مصري 1 كجم", category: "بقالة", barcode: "62100000", cost: 28, price: 35, stock: 120, min: 20 },
    { id: "p2", name: "زيت عباد 1 لتر", category: "بقالة", barcode: "62100001", cost: 62, price: 75, stock: 48, min: 12 },
    { id: "p3", name: "سكر 1 كجم", category: "بقالة", barcode: "62100002", cost: 27, price: 32, stock: 4, min: 10 },
    { id: "p4", name: "شاي ليبتون 250 جم", category: "مشروبات", barcode: "62100003", cost: 55, price: 68, stock: 36, min: 8 },
    { id: "p5", name: "مكرونة 400 جم", category: "بقالة", barcode: "62100004", cost: 9, price: 12, stock: 200, min: 30 },
    { id: "p6", name: "جبنة بيضاء 500 جم", category: "ألبان", barcode: "62100005", cost: 45, price: 58, stock: 3, min: 10 },
    { id: "p7", name: "لبن كامل 1 لتر", category: "ألبان", barcode: "62100006", cost: 30, price: 36, stock: 60, min: 12 },
    { id: "p8", name: "بسكويت شوكولاتة", category: "حلويات", barcode: "62100007", cost: 4, price: 5, stock: 150, min: 25 },
  ],
  suppliers: [{ id: "v1", name: "شركة الأمل للتوريدات", phone: "0100 123 4567", balance: 6200 }, { id: "v2", name: "مؤسسة النيل للأغذية", phone: "0112 555 9021", balance: 0 }, { id: "v3", name: "توزيع القاهرة", phone: "0122 345 6710", balance: 1450 }],
  customers: [{ id: "c1", name: "أحمد محمد", phone: "0109 111 2233", balance: 850 }, { id: "c2", name: "منى إبراهيم", phone: "0111 764 1290", balance: 0 }, { id: "c3", name: "محمود علي", phone: "0101 456 9870", balance: 1270 }],
  sales: [
    { id: "1048", date: "اليوم، ١٠:٤٢ ص", customer: "عميل نقدي", payment: "نقدي", total: 631, status: "مكتملة", items: [] },
    { id: "1047", date: "اليوم، ٩:١٥ ص", customer: "أحمد محمد", payment: "نقدي", total: 594, status: "مكتملة", items: [] },
    { id: "1046", date: "أمس، ٤:٣٠ م", customer: "عميل نقدي", payment: "بطاقة", total: 557, status: "مكتملة", items: [] },
    { id: "1045", date: "أمس، ١:٠٥ م", customer: "منى إبراهيم", payment: "نقدي", total: 520, status: "مكتملة", items: [] },
  ],
  movements: [{ id: "m1", date: "اليوم، ١٠:٤٢ ص", name: "أرز مصري 1 كجم", type: "بيع", qty: -2, note: "فاتورة #1048" }, { id: "m2", date: "اليوم، ٩:١٥ ص", name: "زيت عباد 1 لتر", type: "بيع", qty: -1, note: "فاتورة #1047" }],
  staff: [{ id: "u1", name: "عمر خالد", role: "مدير النظام", access: "كامل" }, { id: "u2", name: "أحمد محمد", role: "كاشير", access: "نقطة البيع" }, { id: "u3", name: "سارة علي", role: "مسؤولة مخزن", access: "المخزون والموردون" }],
  returns: [],
};

const format = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
const todayLabel = () => new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short" }).format(new Date());
const id = () => Math.random().toString(36).slice(2, 9);

function Metric({ label, value, hint, icon: Icon, color = "blue" }: { label: string; value: string; hint?: string; icon: typeof Wallet; color?: string }) {
  return <article className="metric-card"><div className="metric-head"><span>{label}</span><span className={`metric-icon ${color}-icon`}><Icon size={17}/></span></div><div className="metric-value">{value}</div>{hint && <div className="module-metric-hint">{hint}</div>}</article>;
}

function SectionHeader({ title, description, action, onAction, icon: Icon = FileBarChart }: { title: string; description: string; action?: string; onAction?: () => void; icon?: typeof FileBarChart }) {
  return <div className="module-header"><div><div className="module-eyebrow"><Icon size={14}/><span>إدارة المتجر</span></div><h1>{title}</h1><p>{description}</p></div>{action && <button className="button button-primary" onClick={onAction}><Plus size={15}/>{action}</button>}</div>;
}

function SearchBox({ value, onChange, placeholder = "ابحث بالاسم أو الباركود" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="module-search"><Search size={14}/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/>{value && <button aria-label="مسح البحث" onClick={() => onChange("")}><X size={12}/></button>}</label>;
}

export default function ErpWorkspace({ section, search, transactions, onRecord, onAddExpense, notify }: { section: string; search: string; transactions: Transaction[]; onRecord: (name: string, category: string, amount: number, kind: "in" | "out") => void; onAddExpense: () => void; notify: (message: string) => void }) {
  const [data, setData] = useState<StoreData>(seed);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [dialog, setDialog] = useState<"product" | "supplier" | "customer" | "purchase" | "staff" | null>(null);
  const [posSearch, setPosSearch] = useState("");
  const [payment, setPayment] = useState("نقدي");
  const [saleCustomer, setSaleCustomer] = useState("عميل نقدي");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("srvs-store-v1");
      if (saved) setData({ ...seed, ...JSON.parse(saved) as Partial<StoreData> });
    } catch { /* Ignore invalid local demo data and start with the sample workspace. */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("srvs-store-v1", JSON.stringify(data)); }, [data, ready]);

  const matching = (text: string) => text.toLocaleLowerCase().includes((search || query).trim().toLocaleLowerCase());
  const filteredProducts = useMemo(() => data.products.filter((product) => matching(`${product.name} ${product.barcode} ${product.category}`)), [data.products, query, search]);
  const cartItems = data.products.filter((product) => cart[product.id]);
  const cartTotal = cartItems.reduce((total, product) => total + product.price * cart[product.id], 0);
  const lowStock = data.products.filter((product) => product.stock <= product.min);
  const income = transactions.filter((item) => item.kind === "in").reduce((total, item) => total + item.amount, 0);
  const expenses = transactions.filter((item) => item.kind === "out").reduce((total, item) => total + item.amount, 0);
  const addToCart = (product: Product) => {
    if ((cart[product.id] || 0) >= product.stock) { notify("الكمية المطلوبة أكبر من المخزون المتاح"); return; }
    setCart((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 }));
  };
  const changeQty = (productId: string, amount: number) => setCart((current) => {
    const next = { ...current, [productId]: (current[productId] || 0) + amount };
    if (next[productId] <= 0) delete next[productId];
    return next;
  });
  const checkout = () => {
    if (!cartItems.length) { notify("أضف صنفًا إلى الفاتورة أولًا"); return; }
    if (payment === "آجل" && saleCustomer === "عميل نقدي") { notify("اختر اسم العميل لتسجيل المديونية"); return; }
    const saleId = String(Math.max(1048, ...data.sales.map((sale) => Number(sale.id) || 0)) + 1);
    const items = cartItems.map((product) => ({ productId: product.id, name: product.name, qty: cart[product.id], price: product.price }));
    setData((current) => ({ ...current, sales: [{ id: saleId, date: `اليوم، ${new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`, customer: saleCustomer, payment, total: cartTotal, status: "مكتملة", items }, ...current.sales], products: current.products.map((product) => ({ ...product, stock: product.stock - (cart[product.id] || 0) })), customers: payment === "آجل" ? current.customers.map((customer) => customer.name === saleCustomer ? { ...customer, balance: customer.balance + cartTotal } : customer) : current.customers, movements: [...items.map((item) => ({ id: id(), date: "الآن", name: item.name, type: "بيع", qty: -item.qty, note: `فاتورة #${saleId}` })), ...current.movements] }));
    onRecord(saleCustomer, `مبيعات فاتورة #${saleId}`, cartTotal, "in");
    setCart({}); notify(`تم حفظ الفاتورة #${saleId} بنجاح`);
  };

  function saveDialog(formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    if (!name) return;
    if (dialog === "product") {
      const price = Number(formData.get("price")); const cost = Number(formData.get("cost")); const stock = Number(formData.get("stock"));
      const product: Product = { id: id(), name, category: String(formData.get("category") || "أخرى"), barcode: String(formData.get("barcode") || ""), cost, price, stock, min: Number(formData.get("min") || 5) };
      setData((current) => ({ ...current, products: [product, ...current.products], movements: [{ id: id(), date: "الآن", name, type: "رصيد افتتاحي", qty: stock, note: "إضافة صنف" }, ...current.movements] }));
    } else if (dialog === "supplier") setData((current) => ({ ...current, suppliers: [{ id: id(), name, phone: String(formData.get("phone") || ""), balance: 0 }, ...current.suppliers] }));
    else if (dialog === "customer") setData((current) => ({ ...current, customers: [{ id: id(), name, phone: String(formData.get("phone") || ""), balance: 0 }, ...current.customers] }));
    else if (dialog === "staff") setData((current) => ({ ...current, staff: [{ id: id(), name, role: String(formData.get("role") || "كاشير"), access: String(formData.get("role") || "كاشير") === "مدير النظام" ? "كامل" : String(formData.get("role") || "كاشير") }, ...current.staff] }));
    else if (dialog === "purchase") {
      const amount = Number(formData.get("amount"));
      const supplier = String(formData.get("supplier") || "مورد جديد");
      const productId = String(formData.get("productId") || ""); const quantity = Number(formData.get("quantity") || 0);
      const product = data.products.find((item) => item.id === productId);
      if (amount > 0) {
        setData((current) => ({ ...current, suppliers: current.suppliers.map((item) => item.name === supplier ? { ...item, balance: item.balance + amount } : item), products: current.products.map((item) => item.id === productId ? { ...item, stock: item.stock + quantity } : item), movements: product && quantity > 0 ? [{ id: id(), date: "الآن", name: product.name, type: "توريد", qty: quantity, note: supplier }, ...current.movements] : current.movements }));
        onRecord(supplier, "فاتورة توريد", amount, "out");
      }
    }
    setDialog(null); notify("تمت إضافة البيانات بنجاح");
  }

  const returnSale = (sale: Sale) => {
    if (sale.status === "مرتجعة") return;
    setData((current) => ({ ...current, sales: current.sales.map((item) => item.id === sale.id ? { ...item, status: "مرتجعة" } : item), products: current.products.map((product) => ({ ...product, stock: product.stock + (sale.items.find((item) => item.productId === product.id)?.qty || 0) })), returns: [{ id: `R-${sale.id}`, sale: sale.id, amount: sale.total, date: "الآن" }, ...current.returns], movements: [...sale.items.map((item) => ({ id: id(), date: "الآن", name: item.name, type: "مرتجع بيع", qty: item.qty, note: `فاتورة #${sale.id}` })), ...current.movements] }));
    onRecord(`مرتجع فاتورة #${sale.id}`, "مرتجع مبيعات", sale.total, "out"); notify("تم تسجيل المرتجع وإعادة الأصناف للمخزون");
  };

  const settleCustomer = (customer: Customer) => {
    if (!customer.balance) { notify("لا يوجد رصيد مستحق على هذا العميل"); return; }
    const amount = customer.balance;
    setData((current) => ({ ...current, customers: current.customers.map((item) => item.id === customer.id ? { ...item, balance: 0 } : item) }));
    onRecord(customer.name, "تحصيل مديونية", amount, "in"); notify("تم تسجيل التحصيل");
  };

  const heading = <>
    {section === "نقطة البيع" && <SectionHeader title="نقطة البيع" description="سجّل المبيعات بسرعة وابحث بالاسم أو الباركود" icon={ShoppingCart}/>}
    {section === "المخزون والأصناف" && <SectionHeader title="المخزون والأصناف" description="تابع كميات الأصناف وتكلفتها وتنبيهات النقص" action="إضافة صنف" onAction={() => setDialog("product")} icon={Boxes}/>}
    {section === "الجرد اليومي" && <SectionHeader title="الجرد اليومي" description="سجل حركة الأصناف وراجع الوارد والصادر" icon={ClipboardList}/>}
    {section === "الموردون" && <SectionHeader title="الموردون وفواتير التوريد" description="إدارة الموردين ومتابعة الفواتير والذمم المستحقة" action="إضافة مورد" onAction={() => setDialog("supplier")} icon={Truck}/>}
    {(section === "المبيعات" || section === "الفواتير") && <SectionHeader title={section === "الفواتير" ? "الفواتير" : "سجل المبيعات"} description="راجع الفواتير وحالة الدفع والمرتجعات" action="فاتورة جديدة" onAction={() => notify("أضف أصنافًا من نقطة البيع لإنشاء فاتورة")} icon={FileText}/>}
    {(section === "الحسابات والميزانية" || section === "المصروفات" || section === "دليل الحسابات") && <SectionHeader title={section === "المصروفات" ? "المصروفات" : "الحسابات والميزانية"} description="تابع حركة النقدية والإيرادات والمصروفات" action="تسجيل مصروف" onAction={onAddExpense} icon={Wallet}/>}
    {(section === "العملاء" || section === "العملاء والديون") && <SectionHeader title="العملاء والديون" description="إدارة بيانات العملاء ومتابعة الأرصدة المستحقة" action="إضافة عميل" onAction={() => setDialog("customer")} icon={UsersRound}/>}
    {section === "المرتجعات" && <SectionHeader title="المرتجعات" description="سجل المرتجعات مع إعادة الكميات إلى المخزون" icon={RotateCcw}/>}
    {section === "إدارة الصلاحيات" && <SectionHeader title="إدارة الصلاحيات" description="حدد دور كل موظف والأقسام المتاحة له" action="إضافة موظف" onAction={() => setDialog("staff")} icon={ShieldCheck}/>}
    {section === "التقارير" && <SectionHeader title="التقارير" description="ملخص أداء المتجر ومؤشرات المبيعات والمخزون" icon={FileBarChart}/>}
  </>;

  return <div className="erp-workspace">
    {heading}
    {section === "نقطة البيع" && <div className="pos-layout"><div className="pos-products"><div className="pos-toolbar"><SearchBox value={posSearch} onChange={setPosSearch} placeholder="ابحث باسم الصنف أو الباركود"/><button className="select-button" onClick={() => setPosSearch("")}>كل التصنيفات <ChevronDown size={13}/></button></div><div className="pos-grid">{data.products.filter((product) => `${product.name} ${product.barcode}`.toLowerCase().includes(posSearch.toLowerCase())).map((product) => <button className="pos-product" key={product.id} onClick={() => addToCart(product)} disabled={product.stock < 1}><span className="pos-product-icon"><Boxes size={17}/></span><b>{product.name}</b><small>المتاح {format(product.stock)}</small><strong>ج.م {format(product.price)}</strong></button>)}</div></div><aside className="pos-cart panel"><div className="cart-heading"><div><h2>الفاتورة الحالية</h2><p>{cartItems.reduce((sum, item) => sum + cart[item.id], 0)} أصناف</p></div><button className="icon-button" onClick={() => setCart({})} aria-label="إفراغ السلة"><Trash2 size={16}/></button></div><label className="field-label">العميل<select value={saleCustomer} onChange={(event) => setSaleCustomer(event.target.value)}><option>عميل نقدي</option>{data.customers.map((customer) => <option key={customer.id}>{customer.name}</option>)}</select></label><div className="cart-lines">{cartItems.map((product) => <div className="cart-line" key={product.id}><div><b>{product.name}</b><small>ج.م {format(product.price)} للقطعة</small></div><div className="qty-control"><button onClick={() => changeQty(product.id, -1)}>−</button><span>{cart[product.id]}</span><button onClick={() => addToCart(product)}>+</button></div></div>)}{!cartItems.length && <div className="empty-state">اختر صنفًا لإضافته إلى الفاتورة</div>}</div><label className="field-label">طريقة الدفع<select value={payment} onChange={(event) => setPayment(event.target.value)}><option>نقدي</option><option>بطاقة</option><option>آجل</option></select></label><div className="cart-total"><span>الإجمالي</span><b>ج.م {format(cartTotal)}</b></div><button className="button button-primary checkout-button" onClick={checkout}><Banknote size={16}/> إتمام البيع</button></aside></div>}

    {section === "المخزون والأصناف" && <><div className="module-metrics"><Metric label="إجمالي الأصناف" value={format(data.products.length)} icon={Boxes}/><Metric label="وحدات المخزون" value={format(data.products.reduce((sum, product) => sum + product.stock, 0))} icon={PackagePlus} color="green"/><Metric label="قيمة المخزون بالتكلفة" value={`ج.م ${format(data.products.reduce((sum, product) => sum + product.cost * product.stock, 0))}`} icon={Wallet} color="purple"/><Metric label="أصناف منخفضة" value={format(lowStock.length)} hint="تحتاج إلى إعادة طلب" icon={CircleAlert} color="amber"/></div><div className="module-toolbar"><SearchBox value={query} onChange={setQuery}/><button className="filter-button" onClick={() => setQuery("")}>كل الأصناف <ChevronDown size={13}/></button></div><div className="panel module-table-panel"><div className="module-table-scroll"><table><thead><tr><th>الصنف</th><th>الباركود</th><th>التصنيف</th><th>التكلفة</th><th>سعر البيع</th><th>المخزون</th><th>الحالة</th></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product.id}><td className="table-primary-cell">{product.name}</td><td>{product.barcode || "—"}</td><td>{product.category}</td><td>ج.م {format(product.cost)}</td><td>ج.م {format(product.price)}</td><td>{format(product.stock)}</td><td><span className={`status ${product.stock <= product.min ? "status-pending" : "status-done"}`}><i/>{product.stock <= product.min ? "منخفض" : "متاح"}</span></td></tr>)}</tbody></table>{!filteredProducts.length && <div className="empty-state">لا توجد أصناف مطابقة للبحث</div>}</div></div></>}

    {section === "الجرد اليومي" && <><div className="module-metrics"><Metric label="حركات اليوم" value={format(data.movements.length)} icon={ClipboardList}/><Metric label="الوارد" value={format(data.movements.filter((item) => item.qty > 0).reduce((sum, item) => sum + item.qty, 0))} icon={ArrowDownLeft} color="green"/><Metric label="الصادر" value={format(Math.abs(data.movements.filter((item) => item.qty < 0).reduce((sum, item) => sum + item.qty, 0)))} icon={ArrowUpLeft} color="purple"/><Metric label="أصناف منخفضة" value={format(lowStock.length)} icon={CircleAlert} color="amber"/></div><div className="module-toolbar"><SearchBox value={query} onChange={setQuery}/><span className="date-chip"><CalendarDays size={14}/>{todayLabel()}</span></div><div className="panel module-table-panel"><div className="module-table-scroll"><table><thead><tr><th>الصنف</th><th>نوع الحركة</th><th>الكمية</th><th>المرجع</th><th>التاريخ</th></tr></thead><tbody>{data.movements.filter((item) => matching(`${item.name} ${item.note} ${item.type}`)).map((item) => <tr key={item.id}><td className="table-primary-cell">{item.name}</td><td>{item.type}</td><td className={item.qty < 0 ? "amount-out" : "amount-in"}>{item.qty > 0 ? "+" : "−"}{format(Math.abs(item.qty))}</td><td>{item.note}</td><td>{item.date}</td></tr>)}</tbody></table>{!data.movements.length && <div className="empty-state">لا توجد حركات مسجلة</div>}</div></div></>}

    {section === "الموردون" && <><div className="module-metrics"><Metric label="الموردون" value={format(data.suppliers.length)} icon={Truck}/><Metric label="فواتير توريد" value={format(data.movements.filter((item) => item.type === "توريد").length)} icon={FileText} color="purple"/><Metric label="إجمالي المستحقات" value={`ج.م ${format(data.suppliers.reduce((sum, supplier) => sum + supplier.balance, 0))}`} icon={Wallet} color="amber"/></div><div className="module-toolbar"><SearchBox value={query} onChange={setQuery}/><button className="button button-secondary" onClick={() => setDialog("purchase")}><FilePlus2 size={15}/> تسجيل فاتورة توريد</button></div><div className="panel module-table-panel"><div className="module-table-scroll"><table><thead><tr><th>المورد</th><th>رقم الهاتف</th><th>الفواتير المستحقة</th><th>الرصيد</th><th>الحالة</th></tr></thead><tbody>{data.suppliers.filter((supplier) => matching(`${supplier.name} ${supplier.phone}`)).map((supplier) => <tr key={supplier.id}><td className="table-primary-cell">{supplier.name}</td><td>{supplier.phone}</td><td>{supplier.balance ? "فاتورة توريد" : "—"}</td><td>ج.م {format(supplier.balance)}</td><td><span className={`status ${supplier.balance ? "status-pending" : "status-done"}`}><i/>{supplier.balance ? "مستحق" : "مسدد"}</span></td></tr>)}</tbody></table>{!data.suppliers.length && <div className="empty-state">أضف أول مورد للبدء</div>}</div></div></>}

    {(section === "المبيعات" || section === "الفواتير") && <><div className="module-metrics"><Metric label="عدد الفواتير" value={format(data.sales.length)} icon={FileText}/><Metric label="إجمالي المبيعات" value={`ج.م ${format(data.sales.filter((sale) => sale.status === "مكتملة").reduce((sum, sale) => sum + sale.total, 0))}`} icon={TrendingUp} color="green"/><Metric label="المرتجعات" value={format(data.returns.length)} icon={RotateCcw} color="purple"/></div><div className="module-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="ابحث برقم الفاتورة أو العميل"/><button className="filter-button" onClick={() => setQuery("")}>كل الفواتير <ChevronDown size={13}/></button></div><div className="panel module-table-panel"><div className="module-table-scroll"><table><thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>طريقة الدفع</th><th>الإجمالي</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{data.sales.filter((sale) => matching(`${sale.id} ${sale.customer}`)).map((sale) => <tr key={sale.id}><td className="table-primary-cell">#{sale.id}</td><td>{sale.date}</td><td>{sale.customer}</td><td>{sale.payment}</td><td>ج.م {format(sale.total)}</td><td><span className={`status ${sale.status === "مكتملة" ? "status-done" : "status-pending"}`}><i/>{sale.status}</span></td><td>{sale.status === "مكتملة" && <button className="row-action" onClick={() => returnSale(sale)}>إرجاع</button>}</td></tr>)}</tbody></table>{!data.sales.length && <div className="empty-state">لا توجد فواتير بعد. ابدأ البيع من نقطة البيع.</div>}</div></div></>}

    {(section === "الحسابات والميزانية" || section === "المصروفات" || section === "دليل الحسابات") && <><div className="module-metrics"><Metric label="إجمالي الإيرادات" value={`ج.م ${format(income)}`} icon={ArrowDownLeft} color="green"/><Metric label="إجمالي المصروفات" value={`ج.م ${format(expenses)}`} icon={ArrowUpLeft} color="purple"/><Metric label="الرصيد الصافي" value={`ج.م ${format(income - expenses)}`} icon={Wallet}/><Metric label="نقدية متاحة" value={`ج.م ${format(income - expenses)}`} icon={CreditCard} color="amber"/></div><div className="module-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="ابحث في القيود المالية"/><span className="date-chip"><CalendarDays size={14}/>أكتوبر ٢٠٢٦</span></div><div className="panel module-table-panel"><div className="module-table-scroll"><table><thead><tr><th>البيان</th><th>التصنيف</th><th>التاريخ</th><th>النوع</th><th>القيمة</th></tr></thead><tbody>{transactions.filter((item) => matching(`${item.name} ${item.category}`) && (section !== "المصروفات" || item.kind === "out")).map((item, index) => <tr key={`${item.name}-${index}`}><td className="table-primary-cell">{item.name}</td><td>{item.category}</td><td>{item.date}</td><td>{item.kind === "in" ? "إيراد" : "مصروف"}</td><td className={item.kind === "in" ? "amount-in" : "amount-out"}>{item.kind === "in" ? "+" : "−"} ج.م {format(item.amount)}</td></tr>)}</tbody></table></div></div><div className="accounting-note"><ShieldCheck size={15}/> نموذج الواجهة يسجل حركة نقدية مبسطة. قبل الإطلاق سنربط الحسابات بقيود محاسبية مزدوجة قابلة للمراجعة.</div></>}

    {(section === "العملاء" || section === "العملاء والديون") && <><div className="module-metrics"><Metric label="العملاء" value={format(data.customers.length)} icon={UsersRound}/><Metric label="إجمالي المديونيات" value={`ج.م ${format(data.customers.reduce((sum, customer) => sum + customer.balance, 0))}`} icon={Wallet} color="amber"/><Metric label="أرصدة مستحقة" value={format(data.customers.filter((customer) => customer.balance > 0).length)} icon={CircleAlert} color="purple"/></div><div className="module-toolbar"><SearchBox value={query} onChange={setQuery}/><button className="filter-button" onClick={() => setQuery("")}>كل العملاء <ChevronDown size={13}/></button></div><div className="panel module-table-panel"><div className="module-table-scroll"><table><thead><tr><th>العميل</th><th>رقم الهاتف</th><th>عدد الفواتير</th><th>الرصيد المستحق</th><th>إجراء</th></tr></thead><tbody>{data.customers.filter((customer) => matching(`${customer.name} ${customer.phone}`)).map((customer) => <tr key={customer.id}><td className="table-primary-cell">{customer.name}</td><td>{customer.phone}</td><td>{data.sales.filter((sale) => sale.customer === customer.name).length}</td><td>ج.م {format(customer.balance)}</td><td>{customer.balance > 0 && <button className="row-action" onClick={() => settleCustomer(customer)}>تسجيل تحصيل</button>}</td></tr>)}</tbody></table></div></div></>}

    {section === "المرتجعات" && <><div className="module-metrics"><Metric label="عدد المرتجعات" value={format(data.returns.length)} icon={RotateCcw}/><Metric label="إجمالي قيمة المرتجعات" value={`ج.م ${format(data.returns.reduce((sum, item) => sum + item.amount, 0))}`} icon={Wallet} color="purple"/></div><div className="panel module-table-panel"><div className="module-table-scroll"><table><thead><tr><th>رقم المرتجع</th><th>الفاتورة الأصلية</th><th>تاريخ الإرجاع</th><th>قيمة المرتجع</th></tr></thead><tbody>{data.returns.map((item) => <tr key={item.id}><td className="table-primary-cell">{item.id}</td><td>#{item.sale}</td><td>{item.date}</td><td>ج.م {format(item.amount)}</td></tr>)}</tbody></table>{!data.returns.length && <div className="empty-state">لم يتم تسجيل مرتجعات بعد. سجل الإرجاع من صفحة المبيعات.</div>}</div></div></>}

    {section === "إدارة الصلاحيات" && <><div className="module-metrics"><Metric label="الموظفون" value={format(data.staff.length)} icon={UsersRound}/><Metric label="الأدوار" value="٣" icon={ShieldCheck} color="purple"/></div><div className="permissions-cards"><article className="panel role-card"><b>مدير النظام</b><span>كل أقسام النظام والإعدادات</span></article><article className="panel role-card"><b>كاشير</b><span>نقطة البيع والفواتير</span></article><article className="panel role-card"><b>مسؤول مخزن</b><span>المخزون والجرد والموردون</span></article></div><div className="panel module-table-panel"><div className="module-table-scroll"><table><thead><tr><th>الموظف</th><th>الدور</th><th>الأقسام المتاحة</th><th>الحالة</th></tr></thead><tbody>{data.staff.map((member) => <tr key={member.id}><td className="table-primary-cell">{member.name}</td><td><select className="inline-select" value={member.role} onChange={(event) => setData((current) => ({ ...current, staff: current.staff.map((item) => item.id === member.id ? { ...item, role: event.target.value, access: event.target.value === "مدير النظام" ? "كامل" : event.target.value } : item) }))}><option>مدير النظام</option><option>كاشير</option><option>مسؤولة مخزن</option></select></td><td>{member.access}</td><td><span className="status status-done"><i/>نشط</span></td></tr>)}</tbody></table></div></div></>}

    {section === "التقارير" && <><div className="module-metrics"><Metric label="مبيعات اليوم" value={`ج.م ${format(data.sales.filter((sale) => sale.status === "مكتملة").reduce((sum, sale) => sum + sale.total, 0))}`} icon={ShoppingCart}/><Metric label="متوسط قيمة الفاتورة" value={`ج.م ${format(data.sales.length ? Math.round(data.sales.reduce((sum, sale) => sum + sale.total, 0) / data.sales.length) : 0)}`} icon={FileBarChart} color="purple"/><Metric label="أصناف تحتاج إعادة طلب" value={format(lowStock.length)} icon={CircleAlert} color="amber"/></div><div className="report-grid"><article className="panel report-panel"><div className="panel-header"><div><h2>الأصناف الأكثر مبيعًا</h2><p>حسب الكمية المسجلة في الفواتير</p></div><BadgeCheck size={17}/></div>{data.products.slice(0, 5).map((product) => <div className="report-row" key={product.id}><span>{product.name}</span><b>{format(data.sales.flatMap((sale) => sale.items).filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.qty, 0))} وحدة</b></div>)}</article><article className="panel report-panel"><div className="panel-header"><div><h2>تنبيهات المخزون</h2><p>الأصناف عند حد إعادة الطلب أو أقل</p></div><CircleAlert size={17}/></div>{lowStock.map((product) => <div className="report-row" key={product.id}><span>{product.name}</span><b className="amount-out">متبقي {format(product.stock)}</b></div>)}{!lowStock.length && <div className="empty-state">كل الأصناف متوفرة بشكل جيد</div>}</article></div><div className="module-toolbar"><button className="button button-secondary" onClick={() => notify("التصدير إلى Excel سيتاح بعد ربط قاعدة البيانات")}><FileBarChart size={15}/> تصدير التقرير</button><button className="text-link" onClick={() => notify("التقرير يعرض بيانات المتجر التجريبية")}>آخر ٣٠ يوم <ChevronDown size={13}/></button></div></>}

    {dialog && <div className="modal-backdrop" onClick={() => setDialog(null)}><form action={saveDialog} className="entry-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>{dialog === "product" ? "إضافة صنف للمخزون" : dialog === "supplier" ? "إضافة مورد" : dialog === "customer" ? "إضافة عميل" : dialog === "purchase" ? "تسجيل فاتورة توريد" : "إضافة موظف"}</h2><p>ستُحفظ البيانات على هذا الجهاز في النسخة التجريبية</p></div><button type="button" className="icon-button" aria-label="إغلاق" onClick={() => setDialog(null)}><X size={18}/></button></div><label>الاسم{dialog === "purchase" ? <select name="supplier" required>{data.suppliers.map((supplier) => <option key={supplier.id}>{supplier.name}</option>)}</select> : <input name="name" required placeholder={dialog === "product" ? "مثال: أرز مصري 1 كجم" : dialog === "supplier" ? "اسم المورد أو الشركة" : dialog === "customer" ? "اسم العميل" : "اسم الموظف"}/>}</label>{(dialog === "supplier" || dialog === "customer") && <label>رقم الهاتف<input name="phone" placeholder="01xxxxxxxxx"/></label>}{dialog === "product" && <><label>الباركود<input name="barcode" placeholder="رقم الباركود"/></label><div className="form-two"><label>التصنيف<input name="category" placeholder="بقالة"/></label><label>حد التنبيه<input name="min" type="number" min="0" defaultValue="5"/></label></div><div className="form-three"><label>التكلفة<input name="cost" type="number" min="0" required/></label><label>سعر البيع<input name="price" type="number" min="0" required/></label><label>الرصيد<input name="stock" type="number" min="0" required/></label></div></>}{dialog === "purchase" && <><label>الصنف المستلم<select name="productId" required>{data.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><div className="form-two"><label>الكمية الواردة<input name="quantity" type="number" min="1" required placeholder="0"/></label><label>قيمة الفاتورة (ج.م)<input name="amount" type="number" min="1" required placeholder="0"/></label></div><div className="accounting-note"><CircleAlert size={14}/> تزيد الكمية في المخزون ويسجل المبلغ كمصروف ومستحق للمورد.</div></>}{dialog === "staff" && <label>الدور<select name="role"><option>كاشير</option><option>مسؤولة مخزن</option><option>مدير النظام</option></select></label>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>إلغاء</button><button type="submit" className="button button-primary"><Check size={15}/> حفظ</button></div></form></div>}
  </div>;
}
