# ArchLens Dependency

**互動式依賴關係圖 & 耦合分析工具，適用於 JavaScript / TypeScript 專案。**  
**Interactive dependency graph & coupling analyzer for JavaScript / TypeScript projects.**

所有分析完全在瀏覽器中執行 — 原始碼永遠不會離開你的電腦。  
Everything runs entirely in your browser — your source code never leaves your machine.

---

**語言 / Language:** 繁體中文 | [English](#english-version)

---

## 繁體中文

### 功能介紹

ArchLens 解析你的 JS/TS/Vue 專案中的 `import` 與 `require` 語句，建立互動式依賴圖，讓你能夠：

- **視覺化** 一眼看出哪些檔案依賴哪些檔案
- **找出循環依賴** 在它們成為維護問題之前提早發現
- **量測耦合程度** — 查看每個模組的扇入（有多少檔案依賴它）與扇出（它依賴多少檔案）
- **找出入口點與末端節點** — 理解你的架構形狀
- **匯出** 完整圖表為 JSON，或將節點/邊摘要匯出為 CSV

無需帳號。無需伺服器。無需上傳。100% 瀏覽器端分析。

---

### 使用方式

#### 1 — 上傳 `.zip` 壓縮檔 *(最簡單)*

將專案資料夾打包成 zip，拖曳至放置區（或點擊選取檔案）。  
`node_modules`、`dist`、`build` 會自動略過。

#### 2 — 瀏覽本機資料夾 *(需要 HTTPS / 現代瀏覽器)*

點擊 **瀏覽資料夾**，選擇你的專案根目錄。瀏覽器直接讀取檔案，不會傳送至任何地方。

#### 3 — 貼上檔案內容

切換至 **貼上檔案** 分頁，使用以下區塊格式貼入內容：

```
=== src/app.ts ===
import { Button } from "./components/Button";

=== src/components/Button.tsx ===
export const Button = () => null;
```

---

### 路徑別名

若你的專案使用 TypeScript 路徑別名（例如 `@/` → `src/`），展開 **設定路徑別名**，以下列任一格式貼入設定：

```json
{ "@/*": "src/*" }
```

```
@/* -> src/*
```

---

### 支援的檔案類型

`.ts` · `.tsx` · `.js` · `.jsx` · `.mts` · `.cts` · `.mjs` · `.cjs` · `.vue`

---

### 介面語言

UI 支援**繁體中文（zh-TW）**與**英文（EN-US）**。使用右上角的語言切換按鈕切換。

---

### 匯出格式

圖表生成後，工具列提供兩種匯出選項：

| 格式 | 內容 |
| --- | --- |
| **JSON** | 完整圖表 — 所有節點、邊、循環與警告 |
| **CSV** | 節點/邊摘要表格 — 適合在試算表中進一步分析 |

---

### 圖表說明

| 視覺提示 | 意義 |
| --- | --- |
| **橘黃色節點** | 入口點（沒有其他檔案 import 它） |
| **淡化節點** | 末端節點（未 import 任何其他內部模組） |
| **紅色 / 高亮節點** | 存在於循環依賴中 |
| 節點上的 `←N` | 扇入 — 有 N 個其他檔案 import 此檔案 |
| 節點上的 `N→` | 扇出 — 此檔案 import 了 N 個其他檔案 |

點擊任意節點，可在側邊面板查看其完整的上游（依賴此節點的檔案）與下游（此節點依賴的檔案）清單。

---

### 隱私

所有分析均在你的瀏覽器中執行，使用 [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) 與 [JSZip](https://stuk.github.io/jszip/) 函式庫。任何檔案內容、專案名稱或分析結果均不會傳送至任何伺服器。

---

### 開發者 & 貢獻者

架構說明、建置指南、測試覆蓋率詳情與擴充點，請參閱 [dev_readme.md](dev_readme.md)。

---

## English Version

### What It Does

ArchLens reads the `import` and `require` statements in your JS/TS/Vue project and builds an interactive graph so you can:

- **Visualise** which files depend on which at a glance
- **Spot circular dependencies** before they become a maintainability problem
- **Measure coupling** — see fan-in (how many files depend on this one) and fan-out (how many files this one depends on) for every module
- **Find entry points and leaf nodes** — understand the shape of your architecture
- **Export** the full graph as JSON or a node/edge summary as CSV

No account needed. No server. No upload. 100% browser-side analysis.

---

### How to Use

#### 1 — Upload a `.zip` archive *(easiest)*

Zip your project folder and drag it onto the drop zone (or click to browse).  
`node_modules`, `dist`, and `build` are skipped automatically.

#### 2 — Browse a local folder *(requires HTTPS / modern browser)*

Click **Browse folder** and select your project root. The browser reads the files directly — nothing is sent anywhere.

#### 3 — Paste file content

Copy a few files and paste them in the **Paste files** tab using the block format:

```
=== src/app.ts ===
import { Button } from "./components/Button";

=== src/components/Button.tsx ===
export const Button = () => null;
```

---

### Path Aliases

If your project uses TypeScript path aliases (e.g. `@/` → `src/`), expand **Set path aliases** and paste your config in either of these formats:

```json
{ "@/*": "src/*" }
```

```
@/* -> src/*
```

---

### Supported File Types

`.ts` · `.tsx` · `.js` · `.jsx` · `.mts` · `.cts` · `.mjs` · `.cjs` · `.vue`

---

### Language

The UI supports **Traditional Chinese (繁體中文)** and **English (EN-US)**. Use the language toggle in the top-right corner to switch.

---

### Export

Once the graph is generated, two export options are available in the toolbar:

| Format | Contents |
| --- | --- |
| **JSON** | Full graph — all nodes, edges, cycles, and warnings |
| **CSV** | Node/edge summary table — useful for further analysis in a spreadsheet |

---

### Reading the Graph

| Visual cue | Meaning |
| --- | --- |
| **Amber node** | Entry point (nothing imports it) |
| **Dimmed node** | Leaf (imports nothing else) |
| **Red / highlighted node** | Part of a circular dependency |
| `←N` on a node | Fan-in — N other files import this file |
| `N→` on a node | Fan-out — this file imports N other files |

Click any node to see its full list of upstream (depends on this) and downstream (this depends on) files in the side panel.

---

### Privacy

All analysis happens in your browser using the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) and the [JSZip](https://stuk.github.io/jszip/) library. No file content, project names, or analysis results are ever sent to any server.

---

### For Developers & Contributors

See [dev_readme.md](dev_readme.md) for architecture notes, build instructions, test coverage details, and extension points.
