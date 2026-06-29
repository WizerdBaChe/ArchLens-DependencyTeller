import { useGraphStore, selectHotspots } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./HotspotsPanel.css";

export function HotspotsPanel() {
  const hotspots = useGraphStore(selectHotspots);
  const selectNode = useGraphStore((s) => s.selectNode);
  const { t } = useLocale();

  const hasData = hotspots.byFanIn.length > 0 || hotspots.byFanOut.length > 0;

  if (!hasData) {
    return (
      <div className="hotspots-panel hotspots-panel--empty">
        <p>{t.hotspots.empty}</p>
      </div>
    );
  }

  return (
    <div className="hotspots-panel">
      <section className="hotspots-panel__section">
        <h4 className="hotspots-panel__title">{t.hotspots.fanInTitle}</h4>
        <ol className="hotspots-panel__list">
          {hotspots.byFanIn.map((entry) => (
            <li key={entry.id} className="hotspots-panel__item">
              <button
                type="button"
                className="hotspots-panel__node-btn"
                onClick={() => selectNode(entry.id)}
              >
                <span className="hotspots-panel__node-path">{entry.id}</span>
                <span className="hotspots-panel__count">{entry.fanin}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="hotspots-panel__section">
        <h4 className="hotspots-panel__title">{t.hotspots.fanOutTitle}</h4>
        <ol className="hotspots-panel__list">
          {hotspots.byFanOut.map((entry) => (
            <li key={entry.id} className="hotspots-panel__item">
              <button
                type="button"
                className="hotspots-panel__node-btn"
                onClick={() => selectNode(entry.id)}
              >
                <span className="hotspots-panel__node-path">{entry.id}</span>
                <span className="hotspots-panel__count">{entry.fanout}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {hotspots.isolated.length > 0 && (
        <section className="hotspots-panel__section">
          <h4 className="hotspots-panel__title">
            {t.hotspots.isolatedTitle}
            <span className="hotspots-panel__count hotspots-panel__count--inline">
              {t.hotspots.isolatedCount(hotspots.isolated.length)}
            </span>
          </h4>
          <ol className="hotspots-panel__list">
            {hotspots.isolated.map((id) => (
              <li key={id} className="hotspots-panel__item hotspots-panel__item--isolated">
                <button
                  type="button"
                  className="hotspots-panel__node-btn"
                  onClick={() => selectNode(id)}
                >
                  <span className="hotspots-panel__node-path">{id}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
