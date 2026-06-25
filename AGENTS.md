# ArchLens Dependency — 產品層 AI 指引

本檔是 **ArchLens 系列** 的一員。系列層指引（mission、痛點↔產品對照表、共用 schema、scope 慣例）在上層
[`../AGENTS.md`](../AGENTS.md)，AI session 會自動一併繼承。**先讀那份。**

## 本產品負責（`[product:dependency]`，stage: analyze）

解析 JS/TS/Vue/Python 的 `import` / `require`，建互動依賴圖：耦合（fan-in/out）、循環依賴、前後端跨層呼叫、多跳影響追蹤。輸出 `graph`。

## 不屬於本產品的需求 → 請指向姊妹產品

- 「版本之間結構怎麼變了」（增/刪/移動/改名）→ **diff**（`ArchLens-DiffTeller/`）。本產品看的是「目前的相依」，不是「版本間的變動」。
- 純目錄樹 / 餵 AI 的 context → **web**（`ArchLens-Web/`）。需要樹時應消費 web 產出的 `tree`。
- 文件與程式碼對不上 → **docsgap**（`ArchLens-DocsGapTeller/`）。

## 資料契約

輸入消費系列共用的 `tree`，輸出包進共用信封 `{ "archlens": "1.0", "kind": "graph", ... }`（見系列層 AGENTS.md 的 Layer B）。
