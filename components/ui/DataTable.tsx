'use client';

import React, { useMemo } from 'react';
import { useTelemetryData } from '@/components/providers/DataProvider';
import { useVirtualization } from '@/hooks/useVirtualization';
import { formatTime } from '@/lib/canvasUtils';

const ROW_HEIGHT = 34;

export function DataTable() {
  const { bufferRef, dataVersion, filters } = useTelemetryData();

  // Get current table items in reverse chronological order (newest first)
  const items = useMemo(() => {
    const raw = bufferRef.current;
    let filtered = raw;
    if (filters.service !== 'All') {
      filtered = filtered.filter((r) => r.service === filters.service);
    }
    if (filters.region !== 'All') {
      filtered = filtered.filter((r) => r.region === filters.region);
    }
    // Reverse for recent-first table inspection
    return [...filtered].reverse();
  }, [bufferRef, dataVersion, filters.service, filters.region]);

  const { containerRef, totalHeight, startIndex, endIndex, offsetY, onScroll } =
    useVirtualization({
      totalItems: items.length,
      itemHeight: ROW_HEIGHT,
      overscan: 6,
    });

  const visibleRows = items.slice(startIndex, endIndex + 1);

  return (
    <div className="bg-telemetry-surface border border-telemetry-border rounded flex flex-col h-[340px]">
      {/* Table Header toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-telemetry-border bg-telemetry-panel/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-telemetry-muted">
            Telemetry Stream Log
          </span>
          <span className="font-mono text-[11px] px-1.5 py-0.2 bg-telemetry-border rounded text-telemetry-text">
            {items.length.toLocaleString()} records (virtualized)
          </span>
        </div>
        <span className="text-[11px] font-mono text-telemetry-dim hidden sm:inline">
          DOM Nodes: {visibleRows.length} rendered
        </span>
      </div>

      {/* Sticky Table Column Headers */}
      <div className="grid grid-cols-8 px-4 py-1.5 bg-telemetry-panel text-[11px] font-mono uppercase tracking-wider text-telemetry-muted border-b border-telemetry-border select-none">
        <div>Timestamp</div>
        <div>Service</div>
        <div>Region</div>
        <div className="text-right">Latency</div>
        <div className="text-right">Requests</div>
        <div className="text-right">Errors</div>
        <div className="text-right">CPU</div>
        <div className="text-right">Memory</div>
      </div>

      {/* Virtualized Scroll Viewport */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="relative flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs"
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-telemetry-muted">
            No matching telemetry records.
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-8 px-4 py-1.5 border-b border-telemetry-border/40 hover:bg-telemetry-panel/40 transition-colors items-center text-telemetry-text"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <div className="text-telemetry-muted">{formatTime(row.timestamp)}</div>
                  <div className="font-semibold text-telemetry-accent truncate pr-2">
                    {row.service}
                  </div>
                  <div className="text-telemetry-muted">{row.region}</div>
                  <div
                    className={`text-right font-medium ${
                      row.latency > 150 ? 'text-rose-400 font-bold' : ''
                    }`}
                  >
                    {row.latency} ms
                  </div>
                  <div className="text-right">{row.requests.toLocaleString()}</div>
                  <div
                    className={`text-right ${
                      row.errors > 0.2 ? 'text-amber-400 font-bold' : 'text-telemetry-muted'
                    }`}
                  >
                    {row.errors.toFixed(3)}%
                  </div>
                  <div
                    className={`text-right ${
                      row.cpu > 80 ? 'text-rose-400 font-bold' : 'text-telemetry-text'
                    }`}
                  >
                    {row.cpu}%
                  </div>
                  <div className="text-right text-telemetry-muted">{row.memory} MB</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
