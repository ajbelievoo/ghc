"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { TRANSLATIONS, Language } from "@/lib/i18n";

interface I18nContext {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContext>({ lang: "en", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("lang") as Language : null;
    if (saved && TRANSLATIONS[saved]) setLangState(saved);
    else {
      const browser = navigator.language.split("-")[0] as Language;
      if (TRANSLATIONS[browser]) setLangState(browser);
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
