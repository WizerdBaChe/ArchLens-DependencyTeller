import { useGraphStore } from "./store/useGraphStore";
import { InputPanel } from "./input/InputPanel";
import { GraphView } from "./graph/GraphView";
import { SidePanel } from "./panels/SidePanel";
import { SummaryCards } from "./panels/SummaryCards";
import { SearchBar } from "./search/SearchBar";
import { ExportMenu } from "./export/ExportMenu";
import "./App.css";

function Logo() {
  return (
    <div className="app-logo">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="6.5" stroke="var(--color-accent-cyan)" strokeWidth="1.6" />
        <line x1="13.6" y1="13.6" x2="19" y2="19" stroke="var(--color-accent-cyan)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="9" r="2.4" fill="var(--color-accent-amber)" />
      </svg>
      <span>
        ArchLens <strong>Dependency</strong>
      </span>
    </div>
  );
}

export default function App() {
  const status = useGraphStore((s) => s.status);
  const projectName = useGraphStore((s) => s.projectName);
  const reset = useGraphStore((s) => s.reset);
  const hasGraph = status === "ready";

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button className="app-logo-button" onClick={reset} title="Start a new analysis">
          <Logo />
        </button>

        {hasGraph && (
          <>
            <span className="app-project-name">{projectName}</span>
            <SearchBar />
            <div className="app-topbar__spacer" />
            <SummaryCards />
            <ExportMenu />
            <button className="app-new-analysis" onClick={reset}>
              New analysis
            </button>
          </>
        )}
      </header>

      <main className={`app-body ${hasGraph ? "" : "app-body--no-side"}`}>
        {hasGraph ? (
          <>
            <GraphView />
            <SidePanel />
          </>
        ) : (
          <div className="scroll-region">
            <InputPanel />
          </div>
        )}
      </main>
    </div>
  );
}
