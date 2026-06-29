import { useMemo, useState } from "react";
import {
  useGraphStore,
  selectSelectedNode,
  selectImpactTrace,
  reachableImpact,
} from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./NodeDetailPanel.css";

/** Hop-depth options for the impact trace. 1 = direct neighbours only (default). */
const DEPTH_OPTIONS = [1, 2, 3] as const;
/** A large cap standing in for "all reachable" without an unbounded walk. */
const DEPTH_ALL = 99;

export function NodeDetailPanel() {
  const node = useGraphStore(selectSelectedNode);
  const trace = useGraphStore(selectImpactTrace);
  const edges = useGraphStore((s) => s.graph?.edges ?? null);
  const selectNode = useGraphStore((s) => s.selectNode);
  const { t } = useLocale();

  // Impact trace depth. 1 (direct only) keeps the original behaviour; higher
  // values reveal transitive impact. Resets implicitly as the panel re-renders
  // per selection because depth is keyed below to the selected node.
  const [depth, setDepth] = useState<number>(1);
  const selectedId = node?.id ?? null;

  const upstreamReach = useMemo(
    () => (edges && selectedId ? reachableImpact(edges, selectedId, "upstream", depth) : []),
    [edges, selectedId, depth]
  );
  const downstreamReach = useMemo(
    () => (edges && selectedId ? reachableImpact(edges, selectedId, "downstream", depth) : []),
    [edges, selectedId, depth]
  );

  if (!node || !trace) {
    return (
      <div className="node-detail node-detail--empty">
        <p>{t.nodeDetail.empty}</p>
      </div>
    );
  }

  const roleLabel = node.metrics.isIsolated
    ? t.nodeDetail.roleIsolated
    : node.metrics.isCircular
    ? t.nodeDetail.roleCircular
    : node.metrics.isEntry
    ? t.nodeDetail.roleEntry
    : node.metrics.isLeaf
    ? t.nodeDetail.roleLeaf
    : t.nodeDetail.roleInternal;

  const tierLabel = {
    frontend: t.nodeDetail.tierFrontend,
    backend: t.nodeDetail.tierBackend,
    shared: t.nodeDetail.tierShared,
    unknown: t.nodeDetail.tierUnknown,
  }[node.tier];

  const tierReasonText =
    node.tierReason === "framework-import"
      ? t.nodeDetail.tierReasonFramework(node.tierEvidence ?? "")
      : node.tierReason === "extension-default"
      ? t.nodeDetail.tierReasonExtension
      : node.tierReason === "user-override"
      ? t.nodeDetail.tierReasonUserOverride
      : t.nodeDetail.tierReasonUnknown;

  return (
    <div className="node-detail">
      <div className="node-detail__header">
        <p className="node-detail__group">{node.group || "/"}</p>
        <h3 className="node-detail__title">{node.label}</h3>
        <p className="node-detail__path">{node.id}</p>
      </div>

      <dl className="node-detail__metrics">
        <div>
          <dt>{t.nodeDetail.fanIn}</dt>
          <dd>{node.metrics.fanin}</dd>
        </div>
        <div>
          <dt>{t.nodeDetail.fanOut}</dt>
          <dd>{node.metrics.fanout}</dd>
        </div>
        <div>
          <dt>{t.nodeDetail.role}</dt>
          <dd>{roleLabel}</dd>
        </div>
      </dl>

      {/* Tier (architectural layer) + why it was inferred — keeps the inference
          transparent. Reserved spot for a future manual-override control. */}
      <div className={`node-detail__tier node-detail__tier--${node.tier}`}>
        <span className="node-detail__tier-badge">{t.nodeDetail.tier}: {tierLabel}</span>
        <span className="node-detail__tier-reason">{tierReasonText}</span>
      </div>

      {/* Impact trace depth. 1 = direct neighbours (default); higher values walk
          transitively so "what does changing this file reach" is answerable. */}
      <div className="node-detail__depth" role="group" aria-label={t.nodeDetail.depthAria}>
        <span className="node-detail__depth-label">{t.nodeDetail.depthLabel}</span>
        {DEPTH_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            className={`node-detail__depth-btn ${depth === d ? "is-active" : ""}`}
            onClick={() => setDepth(d)}
            aria-pressed={depth === d}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className={`node-detail__depth-btn ${depth === DEPTH_ALL ? "is-active" : ""}`}
          onClick={() => setDepth(DEPTH_ALL)}
          aria-pressed={depth === DEPTH_ALL}
        >
          {t.nodeDetail.depthAll}
        </button>
      </div>

      <section className="node-detail__section">
        <h4>{t.nodeDetail.upstream(upstreamReach.length)}</h4>
        {upstreamReach.length === 0 ? (
          <p className="node-detail__empty-list">{t.nodeDetail.nothingImports}</p>
        ) : (
          <ul>
            {upstreamReach.map(({ id, depth: hop }) => (
              <li key={id}>
                <button type="button" onClick={() => selectNode(id)}>
                  {id}
                  {depth !== 1 && <span className="node-detail__hop">{t.nodeDetail.hop(hop)}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="node-detail__section">
        <h4>{t.nodeDetail.downstream(downstreamReach.length)}</h4>
        {downstreamReach.length === 0 ? (
          <p className="node-detail__empty-list">{t.nodeDetail.importsNothing}</p>
        ) : (
          <ul>
            {downstreamReach.map(({ id, depth: hop }) => (
              <li key={id}>
                <button type="button" onClick={() => selectNode(id)}>
                  {id}
                  {depth !== 1 && <span className="node-detail__hop">{t.nodeDetail.hop(hop)}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
