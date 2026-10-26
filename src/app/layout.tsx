import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/nathra/lib/i18n";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظرة | منصة الأمان الذكي بالرؤية الحاسوبية",
  description:
    "نظرة — منصة الأمان الذكية التي تحدث ثورة في المراقبة بتحليل الكاميرات اللحظي والذكاء الاصطناعي. كشف التسلل، إدارة الحشود، المصادقة بملامح الوجه، والامتثال لـ PDPL.",
  keywords: ["نظرة", "الأمان الذكي", "الرؤية الحاسوبية", "كاميرات المراقبة", "الذكاء الاصطناعي", "PDPL"],
  icons: {
    icon: "logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${geistMono.variable} font-arabic antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
