'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { dictionaries, type Lang, type TranslationKey } from "./translations"

interface I18nContextValue {
  lang: Lang
  dir: "rtl" | "ltr"
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = "nathra-lang"

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar"
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
    return saved === "ar" || saved === "en" ? saved : "ar"
  })

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => {
      return dictionaries[lang][key] ?? dictionaries.ar[key] ?? String(key)
    },
    [lang]
  )

  const dir = lang === "ar" ? "rtl" : "ltr"

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
