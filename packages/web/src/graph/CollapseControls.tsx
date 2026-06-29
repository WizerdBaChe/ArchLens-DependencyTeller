import { useGraphStore, selectCollapsibleGroups } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./CollapseControls.css";

/**
 * Canvas control for hierarchical collapse: fold every multi-file directory into
 * a single aggregate node (overview), or expand them all back to files (detail).
 * Only shown when there is something to collapse, so flat projects stay clean.
 */
export function CollapseControls() {
  const collapsible = useGraphStore(selectCollapsibleGroups);
  const collapsedGroups = useGraphStore((s) => s.collapsedGroups);
  const collapseAllGroups = useGraphStore((s) => s.collapseAllGroups);
  const expandAllGroups = useGraphStore((s) => s.expandAllGroups);
  const edgeStyle = useGraphStore((s) => s.edgeStyle);
  const setEdgeStyle = useGraphStore((s) => s.setEdgeStyle);
  const { t } = useLocale();

  const hasCollapsible = collapsible.size > 0;
  const allCollapsed = collapsedGroups.size >= collapsible.size;
  const isOrthogonal = edgeStyle === "smoothstep";

  return (
    <div className="collapse-controls" role="group" aria-label={t.collapse.ariaLabel}>
      {hasCollapsible && (
        <>
          <button
            type="button"
            className="collapse-controls__btn"
            onClick={collapseAllGroups}
            disabled={allCollapsed}
            title={t.collapse.collapseAllHint}
          >
            {t.collapse.collapseAll}
          </button>
          <button
            type="button"
            className="collapse-controls__btn"
            onClick={expandAllGroups}
            disabled={collapsedGroups.size === 0}
            title={t.collapse.expandAllHint}
          >
            {t.collapse.expandAll}
          </button>
        </>
      )}
      <button
        type="button"
        className="collapse-controls__btn"
        onClick={() => setEdgeStyle(isOrthogonal ? "bezier" : "smoothstep")}
        title={t.edgeStyle.hint}
        aria-pressed={isOrthogonal}
      >
        {t.edgeStyle.label}: {isOrthogonal ? t.edgeStyle.orthogonal : t.edgeStyle.curved}
      </button>
    </div>
  );
}
