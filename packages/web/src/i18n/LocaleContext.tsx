import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Locale } from "./locales/en-US";
import enUS from "./locales/en-US";
import zhTW from "./locales/zh-TW";

export type LocaleCode = "en-US" | "zh-TW";

const LOCALES: Record<LocaleCode, Locale> = {
  "en-US": enUS,
  "zh-TW": zhTW,
};

const STORAGE_KEY = "archlens_locale";

function getSavedLocale(): LocaleCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en-US" || saved === "zh-TW") return saved;
  } catch {}
  return "zh-TW";
}

interface LocaleCtx {
  locale: LocaleCode;
  t: Locale;
  setLocale: (code: LocaleCode) => void;
}

const LocaleContext = createContext<LocaleCtx>({
  locale: "zh-TW",
  t: zhTW,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(getSavedLocale);

  const setLocale = (code: LocaleCode) => {
    setLocaleState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
  };

  return (
    <LocaleContext.Provider value={{ locale, t: LOCALES[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
