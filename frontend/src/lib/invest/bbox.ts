// PDF point coordinates (origin bottom-left) -> CSS pixels for an overlay.
// x = left, y = top (flipped), w/h = size; all multiplied by the render scale.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function boxToRect(
  bbox: [number, number, number, number],
  pageHeight: number,
  scale: number,
): Rect {
  const [x0, y0, x1, y1] = bbox;
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  return {
    x: clamp(left * scale, 0, Number.MAX_SAFE_INTEGER),
    y: clamp((pageHeight - bottom) * scale, 0, Number.MAX_SAFE_INTEGER),
    w: Math.max(0, (right - left) * scale),
    h: Math.max(0, (bottom - top) * scale),
  };
}

export function scaleFor(pageWidth: number, containerWidth: number): number {
  if (pageWidth <= 0) return 1;
  return Math.max(0.2, Math.min(3, containerWidth / pageWidth));
}
