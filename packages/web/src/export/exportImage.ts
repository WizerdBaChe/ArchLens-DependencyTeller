import { toPng, toSvg } from "html-to-image";
import { sanitizeFileName, triggerDownload } from "./exportJson";

/**
 * Image export of the rendered graph. WYSIWYG: it rasterises/serialises the
 * live ReactFlow DOM (the `.react-flow__viewport` element), so node shapes,
 * tier tints, role borders, highlights and cross-tier edges all carry over
 * exactly as on screen. Like every other export here it is 100% client-side —
 * `html-to-image` touches no network, keeping the "nothing leaves your machine"
 * guarantee intact.
 */

/** Pixel padding added around the graph bounds so nothing is clipped at the edge. */
const PADDING = 24;

/**
 * The element ReactFlow transforms when you pan/zoom. Capturing it (rather than
 * the clipped pane) yields the *whole* graph at its natural size regardless of
 * current zoom. Returns null if the graph isn't mounted.
 */
function getViewport(container: HTMLElement | null): HTMLElement | null {
  return (container ?? document).querySelector<HTMLElement>(".react-flow__viewport");
}

/**
 * The untransformed bounding box of all rendered nodes, in the viewport's own
 * coordinate space. ReactFlow positions nodes with a CSS transform on each
 * `.react-flow__node`; we read those to size the output so it frames the graph
 * tightly instead of capturing the panned/zoomed window.
 */
function measureGraphBounds(viewport: HTMLElement): {
  width: number;
  height: number;
} | null {
  const nodes = viewport.querySelectorAll<HTMLElement>(".react-flow__node");
  if (nodes.length === 0) return null;

  let maxX = 0;
  let maxY = 0;
  for (const node of nodes) {
    // transform: translate(Xpx, Ypx) — read the node's own position.
    const match = /translate\(\s*([-\d.]+)px,\s*([-\d.]+)px\s*\)/.exec(node.style.transform);
    const x = match ? parseFloat(match[1]!) : node.offsetLeft;
    const y = match ? parseFloat(match[2]!) : node.offsetTop;
    maxX = Math.max(maxX, x + node.offsetWidth);
    maxY = Math.max(maxY, y + node.offsetHeight);
  }
  return { width: Math.ceil(maxX) + PADDING, height: Math.ceil(maxY) + PADDING };
}

/**
 * Options handed to html-to-image so the captured image ignores the live
 * pan/zoom transform and is framed to the full graph. The background matches
 * the app surface so the export isn't transparent on light viewers.
 */
function captureOptions(viewport: HTMLElement) {
  const bounds = measureGraphBounds(viewport);
  const surface =
    getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim() ||
    "#0a1020";
  return {
    backgroundColor: surface,
    // Override the live transform so the capture starts at the graph origin
    // at 1:1 zoom — the output frames the whole graph, not the current window.
    style: { transform: "translate(0px, 0px) scale(1)" },
    ...(bounds ?? {}),
  };
}

export async function downloadGraphAsPng(projectName: string, container?: HTMLElement | null): Promise<void> {
  const viewport = getViewport(container ?? null);
  if (!viewport) return;
  const dataUrl = await toPng(viewport, { ...captureOptions(viewport), pixelRatio: 2 });
  const blob = await (await fetch(dataUrl)).blob();
  triggerDownload(blob, `${sanitizeFileName(projectName)}-dependency-graph.png`);
}

export async function downloadGraphAsSvg(projectName: string, container?: HTMLElement | null): Promise<void> {
  const viewport = getViewport(container ?? null);
  if (!viewport) return;
  const dataUrl = await toSvg(viewport, captureOptions(viewport));
  const blob = await (await fetch(dataUrl)).blob();
  triggerDownload(blob, `${sanitizeFileName(projectName)}-dependency-graph.svg`);
}
