import { useGraphStore, selectSelectedNode, selectImpactTrace } from "../store/useGraphStore";
import "./NodeDetailPanel.css";

export function NodeDetailPanel() {
  const node = useGraphStore(selectSelectedNode);
  const trace = useGraphStore(selectImpactTrace);
  const selectNode = useGraphStore((s) => s.selectNode);

  if (!node || !trace) {
    return (
      <div className="node-detail node-detail--empty">
        <p>Click any node in the graph to see its upstream and downstream dependencies.</p>
      </div>
    );
  }

  return (
    <div className="node-detail">
      <div className="node-detail__header">
        <p className="node-detail__group">{node.group || "/"}</p>
        <h3 className="node-detail__title">{node.label}</h3>
        <p className="node-detail__path">{node.id}</p>
      </div>

      <dl className="node-detail__metrics">
        <div>
          <dt>Fan-in</dt>
          <dd>{node.metrics.fanin}</dd>
        </div>
        <div>
          <dt>Fan-out</dt>
          <dd>{node.metrics.fanout}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>
            {node.metrics.isCircular ? "In a cycle" : node.metrics.isEntry ? "Entry point" : node.metrics.isLeaf ? "Leaf" : "Internal"}
          </dd>
        </div>
      </dl>

      <section className="node-detail__section">
        <h4>Upstream — depends on this ({trace.upstream.length})</h4>
        {trace.upstream.length === 0 ? (
          <p className="node-detail__empty-list">Nothing imports this file.</p>
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
        <h4>Downstream — this depends on ({trace.downstream.length})</h4>
        {trace.downstream.length === 0 ? (
          <p className="node-detail__empty-list">This file imports nothing internal.</p>
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
