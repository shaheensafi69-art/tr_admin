import type { Metadata } from 'next';
import './globals.css';
import AdminShell from '@/components/layout/AdminShell';

export const metadata: Metadata = {
  title: 'پنل مدیریت رزرواسیون تهران‌روم | TehranRoom Admin',
  description: 'مرکز جامع مدیریت رزرواسیون هتل‌ها، تایید فیش‌های واریزی مسافران و گزارش‌های مالی پلتفرم تهران‌روم.',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
