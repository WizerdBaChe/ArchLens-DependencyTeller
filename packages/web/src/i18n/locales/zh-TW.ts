import type { Locale } from "./en-US";

const zhTW: Locale = {
  // App shell
  app: {
    logoTitle: "開始新的分析",
    newAnalysis: "新分析",
  },

  // Input panel
  input: {
    eyebrow: "依賴關係與耦合分析",
    title: "看見隱藏在檔案結構背後的架構。",
    subtitle:
      "上傳專案壓縮檔或貼上幾個檔案。ArchLens 完全在瀏覽器中解析 import，不會上傳任何原始碼至伺服器。",
    tabZip: "上傳 .zip",
    tabFolder: "瀏覽資料夾",
    tabPaste: "貼上檔案",
    fieldProjectName: "專案名稱",
    projectNamePlaceholder: "my-project",

    dropzoneZipIdle: "將 .zip 拖曳至此，或點擊以瀏覽",
    dropzoneZipHint: "node_modules / dist / build 會自動略過",

    dropzoneFolderIdle: "點擊以瀏覽並選取專案資料夾",
    dropzoneFolderHint: "node_modules / dist / build / .git 會自動略過",
    dropzoneFolderReading: "讀取資料夾中…",
    dropzoneFolderChange: "點擊以選取其他資料夾",

    fieldFileBlocks: "檔案區塊",
    aliasToggleShow: "設定路徑別名（選填）",
    aliasToggleHide: "隱藏路徑別名（選填）",
    fieldAliasLabel: '別名設定 — JSON（tsconfig "paths" 格式）或「key -> target」行格式',

    submitAnalyze: "開始分析",
    submitAnalyzing: "分析中…",

    // Validation / notices
    errorZipOnly: "此模式僅支援 .zip 檔案。",
    errorNoFilesFolder:
      "在該資料夾中找不到支援的原始碼檔案（.ts、.tsx、.js、.jsx、.mts、.cts、.mjs、.cjs、.vue、.py、.pyi）。",
    errorNoFilesArchive:
      "在該壓縮檔中找不到支援的原始碼檔案（.ts、.tsx、.js、.jsx、.mts、.cts、.mjs、.cjs、.vue、.py、.pyi）。",
    errorHttpsRequired:
      "存取資料夾需要 HTTPS。請使用已部署的應用程式，或以 HTTPS 模式啟動開發伺服器（npm run dev）。",
    errorFolderRead: "無法讀取資料夾：",
    errorChooseZip: "請先選擇或拖曳一個 .zip 檔案。",
    errorSelectFolder: "請先選取資料夾。",
    errorNoMarkers:
      '找不到「=== path ===」標記 — 請使用預置內容所示的格式。',
    errorNoPasteBlocks: "請先貼上至少一個檔案區塊再進行分析。",
    noticeFilesFound: (count: number, skipped: number, truncated: boolean) =>
      `已找到 ${count} 個檔案。${skipped > 0 ? `${skipped} 個超大檔案已略過。` : ""}${truncated ? "已達檔案數量上限 — 分析將涵蓋最先找到的檔案。" : ""}`,
    noticeAnalyzing: (count: number, skipped: number, truncated: boolean) =>
      `正在分析 ${count} 個檔案。${skipped > 0 ? `${skipped} 個超大檔案已略過。` : ""}${truncated ? "已達檔案數量上限 — 分析將涵蓋最先找到的檔案。" : ""}`,
  },

  // Summary cards
  summary: {
    modules: "模組",
    dependencies: "依賴",
    cycles: "循環",
    warnings: "警告",
    titleCycles: "查看循環依賴",
    titleWarnings: "查看警告",
    hotspots: "熱點",
    titleHotspots: "檢視結構熱點（承重模組）",
    violations: "違規",
    titleViolations: "檢視架構合約違規",
    ariaLabel: "分析摘要",
  },

  // Side panel
  sidePanel: {
    ariaLabel: "分析詳情",
    tabNode: "節點",
    tabCycles: "循環",
    tabWarnings: "警告",
    tabHotspots: "熱點",
    tabViolations: "違規",
  },

  // Node detail panel
  nodeDetail: {
    empty: "點擊圖中任意節點，以查看其上游與下游依賴關係。",
    fanIn: "扇入",
    fanOut: "扇出",
    role: "角色",
    roleIsolated: "孤立",
    roleCircular: "存在於循環中",
    roleEntry: "入口點",
    roleLeaf: "末端節點",
    roleInternal: "內部節點",
    tier: "層級",
    tierFrontend: "前端",
    tierBackend: "後端",
    tierShared: "共用",
    tierUnknown: "未分類",
    tierReasonFramework: (evidence: string) => `偵測到 import ${evidence}`,
    tierReasonExtension: "依副檔名判定",
    tierReasonUserOverride: "手動指定",
    tierReasonUnknown: "無判定依據 — 可手動分類",
    upstream: (count: number) => `上游 — 依賴此節點的檔案（${count}）`,
    downstream: (count: number) => `下游 — 此節點依賴的檔案（${count}）`,
    nothingImports: "沒有其他檔案 import 此檔案。",
    importsNothing: "此檔案未 import 任何內部模組。",
    depthLabel: "層數",
    depthAll: "全部",
    depthAria: "影響追蹤深度（層數）",
    hop: (depth: number) => ` · 第 ${depth} 層`,
  },

  // Cycle list panel
  cycleList: {
    empty: "未偵測到循環依賴。✓",
    cycleLabel: (index: number) => `循環 ${index + 1}`,
  },

  // Warning list panel
  warningList: {
    empty: "無警告。所有 import 均已正確解析。✓",
    codes: {
      UNRESOLVED_IMPORT: "無法解析的 import",
      PARSE_ERROR: "解析錯誤",
      EMPTY_FILE_SET: "空白輸入",
      DUPLICATE_PATH: "重複路徑",
    },
  },

  // Hotspots panel
  hotspots: {
    fanInTitle: "最被依賴（扇入）",
    fanOutTitle: "最依賴他人（扇出）",
    empty: "無可排名的節點。",
    isolatedCount: (n: number) => `孤立檔：${n}`,
    isolatedTitle: "孤立檔",
  },

  // Violations panel
  violations: {
    empty: "未載入合約，或無違規。✓",
    rule: (from: string, to: string) => `不允許 ${from} → ${to}`,
  },

  // Search bar
  search: {
    placeholder: "依路徑搜尋檔案…",
    ariaLabel: "依路徑搜尋節點",
    ariaClear: "清除搜尋",
  },

  // Export menu
  exportMenu: {
    exportLabel: "匯出",
    exportAria: "匯出選單",
    exportJson: "匯出 JSON",
    exportCsv: "匯出 CSV",
    exportPng: "匯出 PNG",
    exportSvg: "匯出 SVG",
    titleJson: "將完整圖表匯出為 JSON",
    titleCsv: "將節點／邊摘要匯出為 CSV",
    titlePng: "將圖表畫面匯出為 PNG 圖片",
    titleSvg: "將圖表畫面匯出為 SVG 向量圖",
  },

  // Dependency node tooltips
  depNode: {
    titleFanIn: "扇入（被依賴次數）",
    titleFanOut: "扇出（依賴其他模組數）",
  },

  // Tier filter toolbar
  tierFilter: {
    label: "層級",
    all: "全部",
    frontend: "前端",
    backend: "後端",
    ariaLabel: "依架構層級篩選",
  },

  // Graph legend
  legend: {
    title: "圖例",
    shapeAxis: "形狀／底色 = 層級",
    borderAxis: "邊框 = 角色（入口／末端／循環）",
    tierFrontend: "前端",
    tierBackend: "後端",
    tierShared: "共用",
    tierUnknown: "未分類（虛線）",
    crossTierEdge: "跨層級邊（前端 ↔ 後端）",
  },

  // Language switcher
  langSwitcher: {
    ariaLabel: "切換語言",
  },
  collapse: {
    collapseAll: "全部摺疊",
    expandAll: "全部展開",
    collapseAllHint: "將每個目錄摺疊成單一節點（總覽）",
    expandAllHint: "將每個目錄展開回個別檔案",
    bodyHint: "點選以高亮此目錄的依賴關係",
    expandAria: "展開目錄",
    collapseGroupAria: "摺疊此目錄",
    collapseGroupHint: (group) => `將 ${group} 摺疊成單一節點`,
    ariaLabel: "摺疊目錄",
    memberCount: (count) => `${count} 個檔案`,
  },
};

export default zhTW;
