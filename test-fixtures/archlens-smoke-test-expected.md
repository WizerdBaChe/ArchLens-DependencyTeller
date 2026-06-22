# Smoke Test — Expected Results

Fixture: `archlens-smoke-test.zip`  
Project name: 任意（不影響圖結構）

---

## 1. 基本數量

| 項目 | 預期值 |
|---|---|
| 分析檔案數 (fileCount) | **8** |
| Nodes | **8** |
| Edges | **9** |
| Cycles | **0** |
| Warnings | **0** |

---

## 2. 節點清單（8 個）

解壓後頂層資料夾 `smoke-project/` 會被自動去除，路徑應如下：

```
src/App.vue
src/Widget.vue
src/index.ts
src/core/engine.ts
src/core/parser.ts
src/utils/logger.ts
src/utils/format.ts
src/node/runner.mts
```

---

## 3. Edge 清單（9 條，全部為 import 類型）

| from | to |
|---|---|
| `src/App.vue` | `src/index.ts` |
| `src/App.vue` | `src/Widget.vue` |
| `src/Widget.vue` | `src/utils/logger.ts` |
| `src/index.ts` | `src/core/engine.ts` |
| `src/index.ts` | `src/utils/logger.ts` |
| `src/core/engine.ts` | `src/core/parser.ts` |
| `src/core/engine.ts` | `src/utils/logger.ts` |
| `src/core/parser.ts` | `src/utils/format.ts` |
| `src/node/runner.mts` | `src/index.ts` |

---

## 4. 關鍵節點指標

| 節點 | fanin | fanout | isEntry | isLeaf |
|---|---|---|---|---|
| `src/App.vue` | 0 | 2 | ✓ | — |
| `src/node/runner.mts` | 0 | 1 | ✓ | — |
| `src/index.ts` | 2 | 2 | — | — |
| `src/core/engine.ts` | 1 | 2 | — | — |
| `src/core/parser.ts` | 1 | 1 | — | — |
| `src/Widget.vue` | 1 | 1 | — | — |
| `src/utils/logger.ts` | 3 | 0 | — | ✓ |
| `src/utils/format.ts` | 1 | 0 | — | ✓ |

> **最高 fanin：** `src/utils/logger.ts`（3）— 被 index、engine、Widget 三方共用

---

## 5. 邊界涵蓋驗證

下表用於確認各檔案類型的支援是否正常：

| 驗證項目 | 對應 edge | 預期狀態 |
|---|---|---|
| `.vue (lang="ts")` 解析 import | App.vue → index.ts | ✓ resolved |
| `.vue → .vue` edge | App.vue → Widget.vue | ✓ resolved |
| `.vue (無 lang)` 解析 import | Widget.vue → logger.ts | ✓ resolved |
| `.mts` 解析 import | runner.mts → index.ts | ✓ resolved |
| extension-less import 解析 | engine.ts → parser.ts (`"./parser"`) | ✓ resolved |
| 跨目錄 extension-less | engine.ts → logger.ts (`"../utils/logger"`) | ✓ resolved |
| 無 script 區塊不崩潰 | — | N/A（本 fixture 無此案例） |

---

## 6. 異常驗證

- `isCircular = false`：所有節點與 edge 均不循環
- Warnings 陣列應為空（`[]`）
- 無 UNRESOLVED_IMPORT、PARSE_ERROR、DUPLICATE_PATH warning
