'use client'

import { Eye, Mail, Phone, Globe, ShieldCheck } from "lucide-react"
import { useI18n } from "./lib/i18n"

export function AppFooter() {
  const { t, lang } = useI18n()
  return (
    <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-1 ring-amber-500/30">
                <Eye className="h-5 w-5 text-amber-500" />
              </div>
              <span className="font-bold text-base">{t("app.name")} <span class="text-amber-500">| NATHRA</span></span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              {t("footer.desc")}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">{t("footer.quickLinks")}</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>{t("nav.overview")}</li>
              <li>{t("nav.cameras")}</li>
              <li>{t("nav.incidents")}</li>
              <li>{t("nav.vision")}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">{t("footer.contact")}</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> 940</li>
              <li className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> care@nathra.sa</li>
              <li className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> www.nathra.sa</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} {t("app.name")} — {t("footer.rights")}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>{t("footer.pdpl")}</span>
            <span class="opacity-30">·</span>
            <span>🇸🇦</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
