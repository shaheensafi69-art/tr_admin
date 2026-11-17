import type { Metadata } from 'next';
import './globals.css';
import AdminShell from '@/components/layout/AdminShell';

export const metadata: Metadata = {
  title: 'پنل مدیریت رزرواسیون هتل | Hotel Admin Dashboard',
  description: 'سیستم جامع مدیریت رزرواسیون، تایید فیش‌های بانکی، اتاق‌ها و نرخ‌گذاری هتل تابان تهران‌روم.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className="bg-[#030712] text-slate-100 min-h-screen antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
