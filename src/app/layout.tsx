import type { Metadata, Viewport } from 'next';
import './globals.css';
import AdminShell from '@/components/layout/AdminShell';
import PwaRegister from '@/components/pwa/PwaRegister';

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: 'پنل مدیریت رزرواسیون تهران‌روم | TehranRoom Admin',
  description: 'مرکز جامع مدیریت رزرواسیون هتل‌ها، تایید فیش‌های واریزی مسافران و گزارش‌های مالی پلتفرم تهران‌روم.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'مدیریت تهران‌روم',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
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
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="application-name" content="مدیریت تهران‌روم" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#030712] text-slate-100 min-h-screen antialiased">
        <PwaRegister />
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
