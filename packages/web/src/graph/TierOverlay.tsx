import { useGraphStore, selectPresentTiers, type TierFilter } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./TierOverlay.css";

/**
 * Canvas overlay carrying the two pieces that make a mixed frontend/backend
 * graph readable on a single canvas (instead of separate windows):
 *   1. A tier filter (All / Frontend / Backend) — the three "states".
 *   2. A legend explaining the orthogonal visual axes (shape = tier, border = role).
 *
 * Only renders when the graph actually spans more than one tier, so pure
 * frontend (or pure backend) projects are not cluttered with controls they
 * don't need — keeping the "backwards compatible, no new noise" guarantee.
 */
export function TierOverlay() {
  const tierFilter = useGraphStore((s) => s.tierFilter);
  const setTierFilter = useGraphStore((s) => s.setTierFilter);
  const presentTiers = useGraphStore(selectPresentTiers);
  const { t } = useLocale();

  const hasFrontend = presentTiers.has("frontend");
  const hasBackend = presentTiers.has("backend");
  const isMixed = hasFrontend && hasBackend;

  // Single-tier projects don't need any of this — behave exactly as before.
  if (!isMixed) return null;

  const options: Array<{ value: TierFilter; label: string }> = [
    { value: "all", label: t.tierFilter.all },
    { value: "frontend", label: t.tierFilter.frontend },
    { value: "backend", label: t.tierFilter.backend },
  ];

  return (
    <div className="tier-overlay">
      <div className="tier-filter" role="group" aria-label={t.tierFilter.ariaLabel}>
        <span className="tier-filter__label">{t.tierFilter.label}</span>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`tier-filter__btn ${tierFilter === opt.value ? "is-active" : ""}`}
            onClick={() => setTierFilter(opt.value)}
            aria-pressed={tierFilter === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="tier-legend">
        <div className="tier-legend__title">{t.legend.title}</div>
        <div className="tier-legend__axis">{t.legend.shapeAxis}</div>
        <ul className="tier-legend__items">
          <li>
            <span className="tier-legend__swatch tier-legend__swatch--frontend" />
            {t.legend.tierFrontend}
          </li>
          <li>
            <span className="tier-legend__swatch tier-legend__swatch--backend" />
            {t.legend.tierBackend}
          </li>
          {presentTiers.has("shared") && (
            <li>
              <span className="tier-legend__swatch tier-legend__swatch--shared" />
              {t.legend.tierShared}
            </li>
          )}
          {presentTiers.has("unknown") && (
            <li>
              <span className="tier-legend__swatch tier-legend__swatch--unknown" />
              {t.legend.tierUnknown}
            </li>
          )}
        </ul>
        <div className="tier-legend__axis tier-legend__axis--muted">{t.legend.borderAxis}</div>
        <ul className="tier-legend__items">
          <li>
            <span className="tier-legend__edge tier-legend__edge--cross-tier" />
            {t.legend.crossTierEdge}
          </li>
        </ul>
      </div>
    </div>
  );
}
