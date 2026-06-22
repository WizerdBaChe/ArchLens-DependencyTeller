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
      "在該資料夾中找不到支援的 JS/TS/Vue 檔案（.ts、.tsx、.js、.jsx、.mts、.cts、.mjs、.cjs、.vue）。",
    errorNoFilesArchive:
      "在該壓縮檔中找不到支援的 JS/TS/Vue 檔案（.ts、.tsx、.js、.jsx、.mts、.cts、.mjs、.cjs、.vue）。",
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
    ariaLabel: "分析摘要",
  },

  // Side panel
  sidePanel: {
    ariaLabel: "分析詳情",
    tabNode: "節點",
    tabCycles: "循環",
    tabWarnings: "警告",
  },

  // Node detail panel
  nodeDetail: {
    empty: "點擊圖中任意節點，以查看其上游與下游依賴關係。",
    fanIn: "扇入",
    fanOut: "扇出",
    role: "角色",
    roleCircular: "存在於循環中",
    roleEntry: "入口點",
    roleLeaf: "末端節點",
    roleInternal: "內部節點",
    upstream: (count: number) => `上游 — 依賴此節點的檔案（${count}）`,
    downstream: (count: number) => `下游 — 此節點依賴的檔案（${count}）`,
    nothingImports: "沒有其他檔案 import 此檔案。",
    importsNothing: "此檔案未 import 任何內部模組。",
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

  // Search bar
  search: {
    placeholder: "依路徑搜尋檔案…",
    ariaLabel: "依路徑搜尋節點",
    ariaClear: "清除搜尋",
  },

  // Export menu
  exportMenu: {
    exportJson: "匯出 JSON",
    exportCsv: "匯出 CSV",
    titleJson: "將完整圖表匯出為 JSON",
    titleCsv: "將節點／邊摘要匯出為 CSV",
  },

  // Dependency node tooltips
  depNode: {
    titleFanIn: "扇入（被依賴次數）",
    titleFanOut: "扇出（依賴其他模組數）",
  },

  // Language switcher
  langSwitcher: {
    ariaLabel: "切換語言",
  },
};

export default zhTW;
