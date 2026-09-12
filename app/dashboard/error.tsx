'use client';

import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-telemetry-bg text-telemetry-text p-6 font-mono">
      <div className="bg-telemetry-surface border border-rose-900/60 p-6 rounded max-w-md w-full">
        <div className="flex items-center gap-2 text-rose-400 font-bold mb-3">
          <AlertTriangle size={18} />
          <span>TELEMETRY SUBSYSTEM FAILURE</span>
        </div>
        <p className="text-xs text-telemetry-muted mb-4 font-sans">
          {error.message || 'An unexpected rendering anomaly occurred in the signal processor.'}
        </p>
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-telemetry-panel hover:bg-telemetry-border text-telemetry-accent rounded border border-telemetry-border transition-colors text-xs font-mono font-bold"
        >
          <RotateCcw size={14} />
          REINITIALIZE DASHBOARD
        </button>
      </div>
    </div>
  );
}
