import { useLocale } from "./LocaleContext";
import type { LocaleCode } from "./LocaleContext";
import "./LanguageSwitcher.css";

const OPTIONS: { code: LocaleCode; label: string }[] = [
  { code: "en-US", label: "EN" },
  { code: "zh-TW", label: "繁中" },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="lang-switcher" role="group" aria-label={t.langSwitcher.ariaLabel}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          className={`lang-switcher__btn${locale === opt.code ? " is-active" : ""}`}
          onClick={() => setLocale(opt.code)}
          aria-pressed={locale === opt.code}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
