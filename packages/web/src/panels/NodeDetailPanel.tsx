import { useGraphStore, selectSelectedNode, selectImpactTrace } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./NodeDetailPanel.css";

export function NodeDetailPanel() {
  const node = useGraphStore(selectSelectedNode);
  const trace = useGraphStore(selectImpactTrace);
  const selectNode = useGraphStore((s) => s.selectNode);
  const { t } = useLocale();

  if (!node || !trace) {
    return (
      <div className="node-detail node-detail--empty">
        <p>{t.nodeDetail.empty}</p>
      </div>
    );
  }

  const roleLabel = node.metrics.isCircular
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

      <section className="node-detail__section">
        <h4>{t.nodeDetail.upstream(trace.upstream.length)}</h4>
        {trace.upstream.length === 0 ? (
          <p className="node-detail__empty-list">{t.nodeDetail.nothingImports}</p>
        ) : (
          <ul>
            {trace.upstream.map((id) => (
              <li key={id}>
                <button type="button" onClick={() => selectNode(id)}>{id}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="node-detail__section">
        <h4>{t.nodeDetail.downstream(trace.downstream.length)}</h4>
        {trace.downstream.length === 0 ? (
          <p className="node-detail__empty-list">{t.nodeDetail.importsNothing}</p>
        ) : (
          <ul>
            {trace.downstream.map((id) => (
              <li key={id}>
                <button type="button" onClick={() => selectNode(id)}>{id}</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
