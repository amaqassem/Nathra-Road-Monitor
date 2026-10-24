import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

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
  title: "طريق | منصة مراقبة جودة الطرق بالمملكة العربية السعودية",
  description:
    "منصة وطنية ذكية لمراقبة جودة الطرق ورصفتها في المملكة العربية السعودية — تحليل لحظي، بلاغات المواطنين، فحوصات ميدانية، وذكاء اصطناعي.",
  keywords: [
    "جودة الطرق",
    "السعودية",
    "مراقبة الطرق",
    "صيانة الطرق",
    "الرصف",
    "المملكة العربية السعودية",
  ],
  authors: [{ name: "منصة طريق" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
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
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
