import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#07090e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "BeautySync Pro — CRM Conversacional IA",
  description: "Sistema Inteligente de Gestión de Citas y Mensajería WhatsApp con IA para Barberías y Salones de Belleza",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BeautySync",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} bg-[#07090e] text-white antialiased selection:bg-amber-400 selection:text-slate-950`}>
        {children}
      </body>
    </html>
  );
}

