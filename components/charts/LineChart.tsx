'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTelemetryData } from '@/components/providers/DataProvider';
import { setupCanvasDPI, scaleLinear, formatNumber, formatTime } from '@/lib/canvasUtils';
import { MetricType, TelemetryRecord } from '@/lib/types';
import { ZoomIn, RotateCcw } from 'lucide-react';

interface PrimaryLineChartProps {
  onRenderTime?: (timeMs: number) => void;
}

const METRIC_CONFIG: Record<
  MetricType,
  { label: string; unit: string; color: string; gradient: string }
> = {
  latency: { label: 'REQUEST LATENCY', unit: 'ms', color: '#38bdf8', gradient: 'rgba(56, 189, 248, 0.15)' },
  requests: { label: 'REQUEST THROUGHPUT', unit: 'req/s', color: '#22c55e', gradient: 'rgba(34, 197, 94, 0.15)' },
  errors: { label: 'ERROR RATE', unit: '%', color: '#ef4444', gradient: 'rgba(239, 68, 68, 0.15)' },
  cpu: { label: 'CPU UTILIZATION', unit: '%', color: '#f59e0b', gradient: 'rgba(245, 158, 11, 0.15)' },
  memory: { label: 'MEMORY USAGE', unit: 'MB', color: '#a855f7', gradient: 'rgba(168, 85, 247, 0.15)' },
  throughput: { label: 'NETWORK THROUGHPUT', unit: 'MB/s', color: '#06b6d4', gradient: 'rgba(6, 182, 212, 0.15)' },
};

export function LineChart({ onRenderTime }: PrimaryLineChartProps) {
  const {
    bufferRef,
    filters,
    customTimeWindow,
    setCustomTimeWindow,
    resetTimeWindow,
    dataVersion,
  } = useTelemetryData();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Stats for the top bar
  const [stats, setStats] = useState({ current: 0, min: 0, max: 0, avg: 0 });

  // Mouse hover state for crosshair / tooltip
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    record: TelemetryRecord | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    record: null,
  });

  // Dragging / Panning / Zoom state
  const dragStartRef = useRef<{ x: number; time: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const metricMeta = METRIC_CONFIG[filters.metric] || METRIC_CONFIG.latency;

  // Filter records according to active service and region
  const getFilteredPoints = useCallback(() => {
    const records = bufferRef.current;
    if (records.length === 0) return [];

    let filtered = records;
    if (filters.service !== 'All') {
      filtered = filtered.filter((r) => r.service === filters.service);
    }
    if (filters.region !== 'All') {
      filtered = filtered.filter((r) => r.region === filters.region);
    }
    return filtered;
  }, [filters.service, filters.region]);

  // Main rendering loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        animId = requestAnimationFrame(render);
        return;
      }

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const t0 = performance.now();
      const ctx = setupCanvasDPI(canvas, width, height);
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const points = getFilteredPoints();
      const padding = { top: 30, right: 20, bottom: 35, left: 55 };
      const plotW = width - padding.left - padding.right;
      const plotH = height - padding.top - padding.bottom;

      ctx.clearRect(0, 0, width, height);

      if (points.length < 2) {
        ctx.fillStyle = '#8b949e';
        ctx.font = '12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Awaiting telemetry stream...', width / 2, height / 2);
        animId = requestAnimationFrame(render);
        return;
      }

      // Determine Time Bounds (X Domain)
      let minX: number;
      let maxX: number;
      const now = points[points.length - 1].timestamp;

      if (customTimeWindow) {
        minX = customTimeWindow.start;
        maxX = customTimeWindow.end;
      } else {
        const rangeDurations: Record<string, number> = {
          '1m': 60 * 1000,
          '5m': 5 * 60 * 1000,
          '1h': 60 * 60 * 1000,
        };
        const dur = rangeDurations[filters.timeRange] || 60000;
        maxX = now;
        minX = Math.max(points[0].timestamp, now - dur);
      }

      if (maxX <= minX) maxX = minX + 1000;

      // Slice visible points in range
      const visible = points.filter((p) => p.timestamp >= minX && p.timestamp <= maxX);
      const pointsToDraw = visible.length > 0 ? visible : points.slice(-100);

      // Determine Metric Bounds (Y Domain)
      let minY = Infinity;
      let maxY = -Infinity;
      let sum = 0;

      for (let i = 0; i < pointsToDraw.length; i++) {
        const val = pointsToDraw[i][filters.metric];
        if (val < minY) minY = val;
        if (val > maxY) maxY = val;
        sum += val;
      }

      if (!isFinite(minY) || !isFinite(maxY) || minY === maxY) {
        minY = 0;
        maxY = 100;
      } else {
        // Add 10% breathing room
        const span = maxY - minY;
        minY = Math.max(0, minY - span * 0.1);
        maxY = maxY + span * 0.1;
      }

      // Draw Grid & Axes
      ctx.strokeStyle = '#252830';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#8b949e';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const yTicks = 5;
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

      // X Axis Ticks (Time)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xTicks = 6;
      for (let i = 0; i <= xTicks; i++) {
        const ratio = i / xTicks;
        const x = padding.left + plotW * ratio;
        const timeVal = minX + (maxX - minX) * ratio;

        ctx.beginPath();
        ctx.moveTo(x, height - padding.bottom);
        ctx.lineTo(x, height - padding.bottom + 4);
        ctx.stroke();

        ctx.fillText(formatTime(timeVal), x, height - padding.bottom + 8);
      }

      // Draw Series Path with Clipping to Plot Area
      ctx.save();
      ctx.beginPath();
      ctx.rect(padding.left, padding.top, plotW, plotH);
      ctx.clip();

      // Downsample if point density exceeds 2x pixel width for optimal 60fps
      const maxRenderPoints = Math.max(plotW * 2, 400);
      const step = pointsToDraw.length > maxRenderPoints ? pointsToDraw.length / maxRenderPoints : 1;

      // Draw fill gradient under curve
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, metricMeta.gradient);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      let firstX = 0;
      let lastX = 0;

      for (let i = 0; i < pointsToDraw.length; i += step) {
        const p = pointsToDraw[Math.floor(i)];
        const x = scaleLinear(p.timestamp, minX, maxX, padding.left, width - padding.right);
        const y = scaleLinear(p[filters.metric], minY, maxY, height - padding.bottom, padding.top);

        if (i === 0) {
          firstX = x;
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        lastX = x;
      }

      // Complete path for fill
      ctx.save();
      ctx.lineTo(lastX, height - padding.bottom);
      ctx.lineTo(firstX, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      // Stroke primary line
      ctx.beginPath();
      for (let i = 0; i < pointsToDraw.length; i += step) {
        const p = pointsToDraw[Math.floor(i)];
        const x = scaleLinear(p.timestamp, minX, maxX, padding.left, width - padding.right);
        const y = scaleLinear(p[filters.metric], minY, maxY, height - padding.bottom, padding.top);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = metricMeta.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw subtle current value pulse dot on newest point
      if (pointsToDraw.length > 0) {
        const lastP = pointsToDraw[pointsToDraw.length - 1];
        const lx = scaleLinear(lastP.timestamp, minX, maxX, padding.left, width - padding.right);
        const ly = scaleLinear(lastP[filters.metric], minY, maxY, height - padding.bottom, padding.top);

        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fillStyle = metricMeta.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore(); // restore clipping

      const t1 = performance.now();
      if (onRenderTime) {
        onRenderTime(t1 - t0);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [filters, customTimeWindow, getFilteredPoints, metricMeta, onRenderTime]);

  // Update header stats periodically (based on dataVersion)
  useEffect(() => {
    const points = getFilteredPoints();
    if (points.length === 0) return;
    const vals = points.map((p) => p[filters.metric]);
    const current = vals[vals.length - 1];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

    setStats({
      current: parseFloat(current.toFixed(1)),
      min: parseFloat(min.toFixed(1)),
      max: parseFloat(max.toFixed(1)),
      avg: parseFloat(avg.toFixed(1)),
    });
  }, [dataVersion, filters.metric, getFilteredPoints]);

  // Interactive Crosshair & Tooltip Overlay
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    hoverPosRef.current = { x, y };

    const padding = { top: 30, right: 20, bottom: 35, left: 55 };
    if (x < padding.left || x > rect.width - padding.right || y < padding.top || y > rect.height - padding.bottom) {
      setTooltip((prev) => ({ ...prev, visible: false }));
      return;
    }

    const points = getFilteredPoints();
    if (points.length < 2) return;

    let minX: number;
    let maxX: number;
    const now = points[points.length - 1].timestamp;

    if (customTimeWindow) {
      minX = customTimeWindow.start;
      maxX = customTimeWindow.end;
    } else {
      const rangeDurations: Record<string, number> = {
        '1m': 60 * 1000,
        '5m': 5 * 60 * 1000,
        '1h': 60 * 60 * 1000,
      };
      const dur = rangeDurations[filters.timeRange] || 60000;
      maxX = now;
      minX = Math.max(points[0].timestamp, now - dur);
    }

    // Binary search / find nearest point by timestamp
    const plotW = rect.width - padding.left - padding.right;
    const hoverTime = scaleLinear(x, padding.left, rect.width - padding.right, minX, maxX);

    let closest = points[0];
    let minDiff = Math.abs(points[0].timestamp - hoverTime);
    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].timestamp - hoverTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }

    setTooltip({
      visible: true,
      x,
      y,
      record: closest,
    });
  };

  const handlePointerLeave = () => {
    hoverPosRef.current = null;
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Zoom with wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const points = getFilteredPoints();
    if (points.length < 5) return;

    const now = points[points.length - 1].timestamp;
    const currentStart = customTimeWindow ? customTimeWindow.start : points[0].timestamp;
    const currentEnd = customTimeWindow ? customTimeWindow.end : now;
    const span = currentEnd - currentStart;

    const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
    const newSpan = Math.max(5000, Math.min(3600000, span * zoomFactor));

    setCustomTimeWindow({
      start: currentEnd - newSpan,
      end: currentEnd,
    });
  };

  return (
    <div className="bg-telemetry-surface border border-telemetry-border rounded p-4 flex flex-col h-full">
      {/* Chart Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-telemetry-border">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-telemetry-muted">
            {metricMeta.label}
          </span>
          <span className="text-xl font-mono font-bold text-telemetry-text">
            {stats.current}
            <span className="text-xs font-normal text-telemetry-muted ml-1">{metricMeta.unit}</span>
          </span>
        </div>

        {/* Statistical Summary Pills */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-telemetry-muted">
            MIN: <span className="text-telemetry-text font-semibold">{stats.min}</span>
          </div>
          <div className="text-telemetry-muted">
            MAX: <span className="text-telemetry-text font-semibold">{stats.max}</span>
          </div>
          <div className="text-telemetry-muted">
            AVG: <span className="text-telemetry-text font-semibold">{stats.avg}</span>
          </div>

          {customTimeWindow && (
            <button
              onClick={resetTimeWindow}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-telemetry-panel hover:bg-telemetry-border text-telemetry-accent rounded border border-telemetry-border transition-colors"
            >
              <RotateCcw size={12} />
              Reset Zoom
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
        className="relative flex-1 w-full min-h-[300px] mt-2 cursor-crosshair select-none"
      >
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

        {/* SVG / HTML Interactive Overlay (Crosshair & Tooltip) */}
        {tooltip.visible && tooltip.record && (
          <>
            {/* Vertical crosshair line */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none border-l border-dashed border-sky-400/60"
              style={{ left: `${tooltip.x}px` }}
            />
            {/* Horizontal crosshair line */}
            <div
              className="absolute left-0 right-0 pointer-events-none border-t border-dashed border-sky-400/60"
              style={{ top: `${tooltip.y}px` }}
            />

            {/* Floating Technical Tooltip */}
            <div
              className="absolute pointer-events-none bg-telemetry-panel/95 backdrop-blur-sm border border-telemetry-borderLight p-2.5 rounded shadow-lg text-xs font-mono z-20 min-w-[180px]"
              style={{
                left: `${Math.min(tooltip.x + 15, (containerRef.current?.clientWidth || 300) - 190)}px`,
                top: `${Math.max(10, Math.min(tooltip.y - 40, (containerRef.current?.clientHeight || 200) - 110))}px`,
              }}
            >
              <div className="text-[10px] text-telemetry-muted mb-1 pb-1 border-b border-telemetry-border flex justify-between">
                <span>{formatTime(tooltip.record.timestamp)}</span>
                <span className="text-telemetry-accent font-semibold">{tooltip.record.service}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-telemetry-muted">Value:</span>
                <span className="font-bold text-white">
                  {tooltip.record[filters.metric]} {metricMeta.unit}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-[11px]">
                <span className="text-telemetry-muted">Region:</span>
                <span className="text-telemetry-text">{tooltip.record.region}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-[11px]">
                <span className="text-telemetry-muted">CPU / Mem:</span>
                <span className="text-telemetry-text">
                  {tooltip.record.cpu}% / {tooltip.record.memory}MB
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
