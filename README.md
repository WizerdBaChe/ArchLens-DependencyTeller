# ArchLens Dependency

**互動式依賴關係圖 & 耦合分析工具，適用於 JavaScript / TypeScript / Python 專案。**  
**Interactive dependency graph & coupling analyzer for JavaScript / TypeScript / Python projects.**

所有分析完全在瀏覽器中執行 — 原始碼永遠不會離開你的電腦。  
Everything runs entirely in your browser — your source code never leaves your machine.

---

**語言 / Language:** 繁體中文 | [English](#english-version)

---

## 繁體中文

### 功能介紹

ArchLens 解析你的 JS/TS/Vue 與 Python 專案中的 `import` / `require` 語句，建立互動式依賴圖，讓你能夠：

- **視覺化** 一眼看出哪些檔案依賴哪些檔案
- **找出循環依賴** 在它們成為維護問題之前提早發現
- **量測耦合程度** — 查看每個模組的扇入（有多少檔案依賴它）與扇出（它依賴多少檔案）
- **找出入口點與末端節點** — 理解你的架構形狀
- **區分前後端層級（tier）** — 在同一張圖上看出前端 / 後端 / 共用模組，並可只篩選某一層
- **階層摺疊** — 將整個目錄摺疊成單一節點以總覽全局，需要時再展開查看細節
- **找出跨層級呼叫** — 標示前端 ↔ 後端越界的依賴邊，提早發現該透過 API 卻直接相依的耦合
- **多跳影響追蹤** — 在節點面板切換層數，查看「改這個檔會波及哪些檔案」的傳遞影響
- **匯出** 完整圖表為 JSON、節點/邊摘要為 CSV，或將圖表畫面匯出為 PNG / SVG 圖片

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

`.ts` · `.tsx` · `.js` · `.jsx` · `.mts` · `.cts` · `.mjs` · `.cjs` · `.vue` · `.py` · `.pyi`

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
| **PNG** | 目前圖表的點陣圖片 — 適合貼進文件、PR 或簡報 |
| **SVG** | 目前圖表的向量圖 — 可無限縮放、後續編輯 |

---

### 圖表說明

節點的視覺語言分為兩條彼此獨立的軸：**邊框顏色 = 角色**（入口 / 末端 / 循環），**形狀與底色 = 層級（tier）**。兩者同時呈現而不衝突。

| 視覺提示 | 意義 |
| --- | --- |
| **紫色邊框節點** | 入口點（沒有其他檔案 import 它） |
| **淡化邊框節點** | 末端節點（未 import 任何其他內部模組） |
| **琥珀色 / 高亮節點** | 存在於循環依賴中 |
| **冷色調、全圓角形狀** | 前端（frontend）模組 |
| **紫色調、左側方正形狀** | 後端（backend）模組 |
| **虛線邊框** | 尚未分類（unclassified） |
| 節點上的 `←N` | 扇入 — 有 N 個其他檔案 import 此檔案 |
| 節點上的 `N→` | 扇出 — 此檔案 import 了 N 個其他檔案 |
| **洋紅色虛線邊** | 跨層級依賴 — 前端與後端互相直接相依 |

當專案同時含前後端時，畫面左上會出現 **All / Frontend / Backend 篩選器** 與圖例。前後端互相直接相依的邊會以洋紅色虛線標示，提示此處可能應透過 API 而非直接耦合。

點擊任意節點，可在側邊面板查看其完整的上游（依賴此節點的檔案）與下游（此節點依賴的檔案）清單。面板上方的**層數切換（1 / 2 / 3 / 全部）**可從只看直接鄰居，擴展到追蹤多跳的傳遞影響。

**階層摺疊：** 右上角的「全部摺疊 / 全部展開」可將目錄收合成單一群組節點以總覽全局；群組節點上的 `+` 展開該目錄，展開後的檔案節點上會出現 `−` 將該目錄重新摺疊。

---

### 隱私

所有分析均在你的瀏覽器中執行，使用 [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) 與 [JSZip](https://stuk.github.io/jszip/) 函式庫。任何檔案內容、專案名稱或分析結果均不會傳送至任何伺服器。

---

### 開發者 & 貢獻者

架構說明、建置指南、測試覆蓋率詳情與擴充點，請參閱 [dev_readme.md](dev_readme.md)。

---

## English Version

### What It Does

ArchLens reads the `import` / `require` statements in your JS/TS/Vue and Python project and builds an interactive graph so you can:

- **Visualise** which files depend on which at a glance
- **Spot circular dependencies** before they become a maintainability problem
- **Measure coupling** — see fan-in (how many files depend on this one) and fan-out (how many files this one depends on) for every module
- **Find entry points and leaf nodes** — understand the shape of your architecture
- **Separate architectural tiers** — see frontend / backend / shared modules on one canvas, and filter to a single layer
- **Collapse hierarchically** — fold a whole directory into one node for an overview, then expand it for detail
- **Spot cross-tier calls** — edges crossing the frontend ↔ backend boundary are flagged, surfacing coupling that should go through an API instead
- **Trace multi-hop impact** — toggle the hop depth in the node panel to see "what does changing this file reach" transitively
- **Export** the full graph as JSON, a node/edge summary as CSV, or the graph image as PNG / SVG

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

`.ts` · `.tsx` · `.js` · `.jsx` · `.mts` · `.cts` · `.mjs` · `.cjs` · `.vue` · `.py` · `.pyi`

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
| **PNG** | Raster image of the current graph — drop it into docs, a PR, or slides |
| **SVG** | Vector image of the current graph — scales infinitely and stays editable |

---

### Reading the Graph

Nodes use two independent visual axes: **border colour = role** (entry / leaf / cycle) and **shape + tint = tier**. Both render at once without clashing.

| Visual cue | Meaning |
| --- | --- |
| **Violet border** | Entry point (nothing imports it) |
| **Dimmed border** | Leaf (imports nothing else) |
| **Amber / highlighted node** | Part of a circular dependency |
| **Cool tint, fully rounded shape** | Frontend module |
| **Violet tint, squared-off left edge** | Backend module |
| **Dashed border** | Unclassified |
| `←N` on a node | Fan-in — N other files import this file |
| `N→` on a node | Fan-out — this file imports N other files |
| **Magenta dashed edge** | Cross-tier dependency — frontend and backend depend on each other directly |

When a project spans both layers, an **All / Frontend / Backend filter** and a legend appear in the top-left. Edges where frontend and backend depend on each other directly are drawn magenta/dashed, hinting that the link might belong behind an API rather than a direct coupling.

Click any node to see its full list of upstream (depends on this) and downstream (this depends on) files in the side panel. The **hop selector (1 / 2 / 3 / All)** at the top of the panel expands the view from direct neighbours only to multi-hop transitive impact.

**Hierarchical collapse:** use **Collapse all / Expand all** in the top-right to fold directories into single group nodes for an overview; the `+` on a group node expands that directory, and a `−` on an expanded file node folds the directory back.

---

### Privacy

All analysis happens in your browser using the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) and the [JSZip](https://stuk.github.io/jszip/) library. No file content, project names, or analysis results are ever sent to any server.

---

### For Developers & Contributors

See [dev_readme.md](dev_readme.md) for architecture notes, build instructions, test coverage details, and extension points.
