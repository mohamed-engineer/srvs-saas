import type { Metadata } from "next";
import "./globals.css";
import "./marketing.css";
import "./saas.css";

export const metadata: Metadata = {
  title: "SRVS Accounting | نظام محاسبي لنشاطك",
  description: "نقطة بيع ومخزون وحسابات وتقارير في مساحة عمل واحدة من SRVS Digital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
