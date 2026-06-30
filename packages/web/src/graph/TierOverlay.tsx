import { useGraphStore, selectPresentTiers, type TierFilter } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./TierOverlay.css";

/**
 * Canvas overlay with two parts, shown independently:
 *   1. Tier filter (All / Frontend / Backend) + tier shape/tint swatches —
 *      ONLY when the graph spans both tiers (a single-tier project doesn't need
 *      a filter or tier key).
 *   2. A role legend (border = entry / leaf / cycle) + edge key — ALWAYS shown
 *      when a graph exists, because role colours appear in every project. This
 *      is the key that lets a user decode e.g. a blue "entry" border without
 *      mistaking it for a tier colour.
 */
export function TierOverlay() {
  const graph = useGraphStore((s) => s.graph);
  const tierFilter = useGraphStore((s) => s.tierFilter);
  const setTierFilter = useGraphStore((s) => s.setTierFilter);
  const presentTiers = useGraphStore(selectPresentTiers);
  const { t } = useLocale();

  if (!graph) return null;

  const hasFrontend = presentTiers.has("frontend");
  const hasBackend = presentTiers.has("backend");
  const isMixed = hasFrontend && hasBackend;
  const hasViolations = graph.violations.length > 0;

  const options: Array<{ value: TierFilter; label: string }> = [
    { value: "all", label: t.tierFilter.all },
    { value: "frontend", label: t.tierFilter.frontend },
    { value: "backend", label: t.tierFilter.backend },
  ];

  return (
    <div className="tier-overlay">
      {isMixed && (
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
      )}

      <div className="tier-legend">
        <div className="tier-legend__title">{t.legend.title}</div>

        {/* Tier (shape/tint) key — only meaningful when more than one tier exists. */}
        {isMixed && (
          <>
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
          </>
        )}

        {/* Role (left bar) key — always shown; these colours appear in every graph.
            Only the two notable roles are coloured: entry + circular. Leaf and
            interior files are the uncoloured baseline, so they need no swatch. */}
        <div className="tier-legend__axis tier-legend__axis--muted">{t.legend.borderAxis}</div>
        <ul className="tier-legend__items">
          <li>
            <span className="tier-legend__swatch tier-legend__swatch--role-entry" />
            {t.nodeDetail.roleEntry}
          </li>
          <li>
            <span className="tier-legend__swatch tier-legend__swatch--role-circular" />
            {t.nodeDetail.roleCircular}
          </li>
        </ul>

        {/* Edge key — entries appear only when that edge kind is present. */}
        {(isMixed || hasViolations) && (
          <ul className="tier-legend__items tier-legend__items--edges">
            {isMixed && (
              <li>
                <span className="tier-legend__edge tier-legend__edge--cross-tier" />
                {t.legend.crossTierEdge}
              </li>
            )}
            {hasViolations && (
              <li>
                <span className="tier-legend__edge tier-legend__edge--violation" />
                {t.legend.violationEdge}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
