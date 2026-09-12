/**
 * Canvas rendering utilities for Signal Room
 * Designed for high-frequency, high-DPI rendering without external chart libraries.
 */

export interface CanvasDimensions {
  width: number;
  height: number;
  dpr: number;
}

/**
 * Configure canvas for crisp rendering on high-DPI (Retina) screens.
 */
export function setupCanvasDPI(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(dpr, dpr);
  return ctx;
}

/**
 * Map value from input domain [dMin, dMax] to output range [rMin, rMax]
 */
export function scaleLinear(
  val: number,
  dMin: number,
  dMax: number,
  rMin: number,
  rMax: number
): number {
  if (dMax === dMin) return (rMin + rMax) / 2;
  return rMin + ((val - dMin) / (dMax - dMin)) * (rMax - rMin);
}

/**
 * Format timestamp into technical HH:MM:SS
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Format numbers cleanly (e.g., 4200 -> 4.2k, 120 -> 120)
 */
export function formatNumber(val: number): string {
  if (Math.abs(val) >= 1000000) {
    return (val / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(val) >= 1000) {
    return (val / 1000).toFixed(1) + 'k';
  }
  return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/**
 * Draw chart background grid and ticks
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
  minY: number,
  maxY: number,
  yTicks: number = 4
) {
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  ctx.save();
  ctx.strokeStyle = '#252830';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#8b949e';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Horizontal grid lines & Y labels
  for (let i = 0; i <= yTicks; i++) {
    const ratio = i / yTicks;
    const y = padding.top + plotH * (1 - ratio);
    const val = minY + (maxY - minY) * ratio;

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillText(formatNumber(val), padding.left - 8, y);
  }

  ctx.restore();
}

/**
 * Fast downsampling: Pick step to keep rendered points within pixel resolution
 */
export function samplePoints<T>(
  data: T[],
  maxPoints: number
): T[] {
  if (data.length <= maxPoints) return data;
  const step = data.length / maxPoints;
  const sampled: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(data[Math.floor(i * step)]);
  }
  return sampled;
}
