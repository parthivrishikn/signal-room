'use client';

import React from 'react';
import { useTelemetryData } from '@/components/providers/DataProvider';
import { formatTime } from '@/lib/canvasUtils';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { IncidentEvent } from '@/lib/types';

export function IncidentTimeline() {
  const { incidents, jumpToIncident } = useTelemetryData();

  return (
    <div className="bg-telemetry-surface border border-telemetry-border rounded p-3 flex flex-col h-full">
      <div className="flex items-center justify-between pb-2 border-b border-telemetry-border mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-telemetry-muted">
          <AlertTriangle size={13} className="text-amber-400" />
          <span>Incident Trace</span>
        </div>
        <span className="text-[10px] font-mono text-telemetry-dim">
          {incidents.length} anomalies
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px]">
        {incidents.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs font-mono text-telemetry-dim text-center">
            Monitoring for operational anomalies...
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => jumpToIncident(inc)}
              className="group p-2 rounded bg-telemetry-panel hover:bg-telemetry-border border border-telemetry-border/70 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-telemetry-muted flex items-center gap-1">
                  <Clock size={10} />
                  {formatTime(inc.timestamp)}
                </span>
                <span
                  className={`px-1 rounded text-[9px] font-bold ${
                    inc.severity === 'critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {inc.severity.toUpperCase()}
                </span>
              </div>

              <div className="text-xs font-medium text-telemetry-text mt-1 group-hover:text-telemetry-accent transition-colors">
                {inc.title}
              </div>

              <div className="text-[11px] text-telemetry-muted mt-0.5 line-clamp-1">
                {inc.detail}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-telemetry-dim mt-1 font-mono">
                <span>{inc.region}</span>
                <span>•</span>
                <span className="text-telemetry-accent group-hover:underline flex items-center gap-0.5">
                  Inspect window <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
