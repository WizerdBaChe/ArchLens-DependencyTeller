import { useGraphStore } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./SearchBar.css";

export function SearchBar() {
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
  const graph = useGraphStore((s) => s.graph);
  const { t } = useLocale();

  if (!graph) return null;

  return (
    <div className="search-bar">
      <svg className="search-bar__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t.search.placeholder}
        aria-label={t.search.ariaLabel}
      />
      {searchQuery && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => setSearchQuery("")}
          aria-label={t.search.ariaClear}
        >
          ×
        </button>
      )}
    </div>
  );
}
