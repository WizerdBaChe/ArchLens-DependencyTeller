import { useState } from "react";

/**
 * 主題切換器（Phase 4 / @archlens/tokens）。
 * 切換掛在 <html> 的 .al-theme-* class，共用 token 與本地 graph-domain 顏色一起換色。
 *
 * 系列慣例：**預設＝Blueprint，且不持久化**——切換只在當次 session 生效，不寫
 * localStorage；重新載入即重置回 Blueprint（隱私優先）。index.html 已靜態掛
 * al-theme-blueprint。Light 已自系列移除（配色難收斂到乾淨舒適）。
 */

const THEMES = [
  { id: "blueprint", label: "Blueprint" },
  { id: "hacker", label: "Hacker" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const CLASSES = THEMES.map((t) => `al-theme-${t.id}`);

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("blueprint");

  const apply = (next: ThemeId) => {
    const el = document.documentElement;
    el.classList.remove(...CLASSES);
    el.classList.add(`al-theme-${next}`);
    setTheme(next);
  };

  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`theme-switch__btn${theme === t.id ? " is-active" : ""}`}
          aria-pressed={theme === t.id}
          onClick={() => apply(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
