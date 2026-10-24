'use client'

import { ShieldCheck, Mail, Phone, Globe } from "lucide-react"

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-saudi text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="font-bold text-base">طَريق</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              منصة وطنية ذكية لمراقبة جودة الطرق ورصفتها في المملكة العربية
              السعودية. تجمع بيانات الفحوصات الميدانية والمستشعرات الذكية
              وبلاغات المواطنين والتحليل بالذكاء الاصطناعي لضمان طرق آمنة ومستدامة.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">روابط سريعة</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>لوحة التحكم</li>
              <li>خريطة الطرق</li>
              <li>البلاغات</li>
              <li>التحليل الذكي</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">تواصل معنا</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> 940
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> care@roads.gov.sa
              </li>
              <li className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> www.roads.gov.sa
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} منصة طَريق — جميع الحقوق محفوظة
          </p>
          <p className="text-[11px] text-muted-foreground">
            صُمّم بكل فخر في المملكة العربية السعودية 🇸🇦
          </p>
        </div>
      </div>
    </footer>
  )
}
