export interface Locale {
  app: {
    logoTitle: string;
    newAnalysis: string;
  };
  input: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tabZip: string;
    tabFolder: string;
    tabPaste: string;
    fieldProjectName: string;
    projectNamePlaceholder: string;
    dropzoneZipIdle: string;
    dropzoneZipHint: string;
    dropzoneFolderIdle: string;
    dropzoneFolderHint: string;
    dropzoneFolderReading: string;
    dropzoneFolderChange: string;
    fieldFileBlocks: string;
    aliasToggleShow: string;
    aliasToggleHide: string;
    fieldAliasLabel: string;
    submitAnalyze: string;
    submitAnalyzing: string;
    errorZipOnly: string;
    errorNoFilesFolder: string;
    errorNoFilesArchive: string;
    errorHttpsRequired: string;
    errorFolderRead: string;
    errorChooseZip: string;
    errorSelectFolder: string;
    errorNoMarkers: string;
    errorNoPasteBlocks: string;
    noticeFilesFound: (count: number, skipped: number, truncated: boolean) => string;
    noticeAnalyzing: (count: number, skipped: number, truncated: boolean) => string;
  };
  summary: {
    modules: string;
    dependencies: string;
    cycles: string;
    warnings: string;
    titleCycles: string;
    titleWarnings: string;
    hotspots: string;
    titleHotspots: string;
    violations: string;
    titleViolations: string;
    ariaLabel: string;
  };
  sidePanel: {
    ariaLabel: string;
    tabNode: string;
    tabCycles: string;
    tabWarnings: string;
    tabHotspots: string;
    tabViolations: string;
  };
  nodeDetail: {
    empty: string;
    fanIn: string;
    fanOut: string;
    role: string;
    roleIsolated: string;
    roleCircular: string;
    roleEntry: string;
    roleLeaf: string;
    roleInternal: string;
    tier: string;
    tierFrontend: string;
    tierBackend: string;
    tierShared: string;
    tierUnknown: string;
    tierReasonFramework: (evidence: string) => string;
    tierReasonExtension: string;
    tierReasonUserOverride: string;
    tierReasonUnknown: string;
    upstream: (count: number) => string;
    downstream: (count: number) => string;
    nothingImports: string;
    importsNothing: string;
    depthLabel: string;
    depthAll: string;
    depthAria: string;
    hop: (depth: number) => string;
  };
  cycleList: {
    empty: string;
    cycleLabel: (index: number) => string;
  };
  warningList: {
    empty: string;
    codes: Record<string, string>;
  };
  hotspots: {
    fanInTitle: string;
    fanOutTitle: string;
    empty: string;
    isolatedCount: (n: number) => string;
    isolatedTitle: string;
  };
  violations: {
    empty: string;
    rule: (from: string, to: string) => string;
  };
  search: {
    placeholder: string;
    ariaLabel: string;
    ariaClear: string;
  };
  exportMenu: {
    exportLabel: string;
    exportAria: string;
    exportJson: string;
    exportCsv: string;
    exportPng: string;
    exportSvg: string;
    titleJson: string;
    titleCsv: string;
    titlePng: string;
    titleSvg: string;
    exportBriefing: string;
    titleBriefing: string;
  };
  depNode: {
    titleFanIn: string;
    titleFanOut: string;
  };
  tierFilter: {
    label: string;
    all: string;
    frontend: string;
    backend: string;
    ariaLabel: string;
  };
  legend: {
    title: string;
    shapeAxis: string;
    borderAxis: string;
    tierFrontend: string;
    tierBackend: string;
    tierShared: string;
    tierUnknown: string;
    crossTierEdge: string;
    violationEdge: string;
  };
  langSwitcher: {
    ariaLabel: string;
  };
  edgeStyle: {
    label: string;
    curved: string;
    orthogonal: string;
    hint: string;
  };
  collapse: {
    collapseAll: string;
    expandAll: string;
    collapseAllHint: string;
    expandAllHint: string;
    bodyHint: string;
    expandAria: string;
    collapseGroupAria: string;
    collapseGroupHint: (group: string) => string;
    ariaLabel: string;
    memberCount: (count: number) => string;
  };
}

const enUS: Locale = {
  app: {
    logoTitle: "Start a new analysis",
    newAnalysis: "New analysis",
  },
  input: {
    eyebrow: "Dependency & coupling analysis",
    title: "See the structure your file tree hides.",
    subtitle:
      "Upload a project archive or paste a few files. ArchLens parses imports entirely in your browser — nothing is uploaded to a server.",
    tabZip: "Upload .zip",
    tabFolder: "Browse folder",
    tabPaste: "Paste files",
    fieldProjectName: "Project name",
    projectNamePlaceholder: "my-project",
    dropzoneZipIdle: "Drop a project .zip here, or click to browse",
    dropzoneZipHint: "node_modules / dist / build are skipped automatically",
    dropzoneFolderIdle: "Click to browse and select a project folder",
    dropzoneFolderHint: "node_modules / dist / build / .git are skipped automatically",
    dropzoneFolderReading: "Reading folder…",
    dropzoneFolderChange: "Click to choose a different folder",
    fieldFileBlocks: "File blocks",
    aliasToggleShow: "Set path aliases (optional)",
    aliasToggleHide: "Hide path aliases (optional)",
    fieldAliasLabel: 'Alias config — JSON (tsconfig "paths"-style) or "key -> target" lines',
    submitAnalyze: "Analyze project",
    submitAnalyzing: "Analyzing…",
    errorZipOnly: "Only .zip files are supported in this mode.",
    errorNoFilesFolder:
      "No supported source files were found in that folder (.ts, .tsx, .js, .jsx, .mts, .cts, .mjs, .cjs, .vue, .py, .pyi).",
    errorNoFilesArchive:
      "No supported source files were found inside that archive (.ts, .tsx, .js, .jsx, .mts, .cts, .mjs, .cjs, .vue, .py, .pyi).",
    errorHttpsRequired:
      "Folder access requires HTTPS. Use the deployed app or run the dev server with HTTPS (npm run dev).",
    errorFolderRead: "Could not read the folder: ",
    errorChooseZip: "Choose or drop a .zip file first.",
    errorSelectFolder: "Select a folder first.",
    errorNoMarkers:
      'No "=== path ===" markers found — use the format shown in the placeholder.',
    errorNoPasteBlocks: "Paste at least one file block before analyzing.",
    noticeFilesFound: (count, skipped, truncated) =>
      `Found ${count} file(s).${skipped > 0 ? ` ${skipped} oversized file(s) skipped.` : ""}${truncated ? " File count limit reached — analysis covers the first files found." : ""}`,
    noticeAnalyzing: (count, skipped, truncated) =>
      `Analyzing ${count} files.${skipped > 0 ? ` ${skipped} oversized file(s) skipped.` : ""}${truncated ? " File count limit reached — analysis covers the first files found." : ""}`,
  },
  summary: {
    modules: "modules",
    dependencies: "dependencies",
    cycles: "cycles",
    warnings: "warnings",
    titleCycles: "View circular dependencies",
    titleWarnings: "View warnings",
    hotspots: "hotspots",
    titleHotspots: "View structural hotspots (load-bearing modules)",
    violations: "violations",
    titleViolations: "View contract violations",
    ariaLabel: "Analysis summary",
  },
  sidePanel: {
    ariaLabel: "Analysis details",
    tabNode: "Node",
    tabCycles: "Cycles",
    tabWarnings: "Warnings",
    tabHotspots: "Hotspots",
    tabViolations: "Violations",
  },
  nodeDetail: {
    empty: "Click any node in the graph to see its upstream and downstream dependencies.",
    fanIn: "Fan-in",
    fanOut: "Fan-out",
    role: "Role",
    roleIsolated: "Isolated",
    roleCircular: "In a cycle",
    roleEntry: "Entry point",
    roleLeaf: "Leaf",
    roleInternal: "Internal",
    tier: "Layer",
    tierFrontend: "Frontend",
    tierBackend: "Backend",
    tierShared: "Shared",
    tierUnknown: "Unclassified",
    tierReasonFramework: (evidence) => `detected import ${evidence}`,
    tierReasonExtension: "by file extension",
    tierReasonUserOverride: "set manually",
    tierReasonUnknown: "no signal — classify manually",
    upstream: (count) => `Upstream — depends on this (${count})`,
    downstream: (count) => `Downstream — this depends on (${count})`,
    nothingImports: "Nothing imports this file.",
    importsNothing: "This file imports nothing internal.",
    depthLabel: "Hops",
    depthAll: "All",
    depthAria: "Impact trace depth (hops)",
    hop: (depth) => ` · ${depth} hop${depth === 1 ? "" : "s"}`,
  },
  cycleList: {
    empty: "No circular dependencies detected. ✓",
    cycleLabel: (index) => `Cycle ${index + 1}`,
  },
  warningList: {
    empty: "No warnings. Every import resolved cleanly. ✓",
    codes: {
      UNRESOLVED_IMPORT: "Unresolved import",
      PARSE_ERROR: "Parse error",
      EMPTY_FILE_SET: "Empty input",
      DUPLICATE_PATH: "Duplicate path",
    },
  },
  hotspots: {
    fanInTitle: "Most depended-on (fan-in)",
    fanOutTitle: "Most dependencies (fan-out)",
    empty: "No nodes to rank.",
    isolatedCount: (n) => `Isolated files: ${n}`,
    isolatedTitle: "Isolated files",
  },
  violations: {
    empty: "No contract loaded, or no violations. ✓",
    rule: (from, to) => `${from} → ${to} not allowed`,
  },
  search: {
    placeholder: "Search files by path…",
    ariaLabel: "Search nodes by path",
    ariaClear: "Clear search",
  },
  exportMenu: {
    exportLabel: "Export",
    exportAria: "Export menu",
    exportJson: "Export JSON",
    exportCsv: "Export CSV",
    exportPng: "Export PNG",
    exportSvg: "Export SVG",
    titleJson: "Export full graph as JSON",
    titleCsv: "Export node/edge summary as CSV",
    titlePng: "Export the graph image as PNG",
    titleSvg: "Export the graph image as SVG (vector)",
    exportBriefing: "Export AI briefing (Markdown)",
    titleBriefing: "Compact contract + violations + hotspots for AI",
  },
  depNode: {
    titleFanIn: "Fan-in (depended on by)",
    titleFanOut: "Fan-out (depends on)",
  },
  tierFilter: {
    label: "Layer",
    all: "All",
    frontend: "Frontend",
    backend: "Backend",
    ariaLabel: "Filter by architectural layer",
  },
  legend: {
    title: "Legend",
    shapeAxis: "Shape / tint = layer",
    borderAxis: "Left bar = role (entry / cycle; leaf is plain)",
    tierFrontend: "Frontend",
    tierBackend: "Backend",
    tierShared: "Shared",
    tierUnknown: "Unclassified (dashed)",
    crossTierEdge: "Cross-tier edge (frontend ↔ backend)",
    violationEdge: "Contract violation (forbidden import)",
  },
  langSwitcher: {
    ariaLabel: "Switch language",
  },
  edgeStyle: {
    label: "Edges",
    curved: "Curved",
    orthogonal: "Orthogonal",
    hint: "Toggle edge routing: curved bezier or orthogonal right-angles",
  },
  collapse: {
    collapseAll: "Collapse all",
    expandAll: "Expand all",
    collapseAllHint: "Fold every directory into a single node (overview)",
    expandAllHint: "Expand every directory back into individual files",
    bodyHint: "Click to highlight this directory's dependencies",
    expandAria: "Expand directory",
    collapseGroupAria: "Collapse this directory",
    collapseGroupHint: (group) => `Collapse ${group} into a single node`,
    ariaLabel: "Collapse directories",
    memberCount: (count) => `${count} files`,
  },
};

export default enUS;
