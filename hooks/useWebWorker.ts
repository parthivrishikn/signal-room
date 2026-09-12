'use client';

import { useEffect, useRef, useCallback } from 'react';
import { WorkerRequest, WorkerResponse } from '@/workers/dataProcessor.worker';
import { MetricType, TelemetryRecord } from '@/lib/types';

export function useWebWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacks = useRef<Map<string, (res: WorkerResponse) => void>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Standard Next.js Web Worker instantiation
      const worker = new Worker(
        new URL('../workers/dataProcessor.worker.ts', import.meta.url)
      );

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id } = e.data;
        const cb = pendingCallbacks.current.get(id);
        if (cb) {
          cb(e.data);
          pendingCallbacks.current.delete(id);
        }
      };

      worker.onerror = (err) => {
        console.warn('Web Worker error, continuing on main thread:', err);
      };

      workerRef.current = worker;
    } catch (err) {
      console.warn('Web Worker initialization failed, fallback active:', err);
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const runLTTB = useCallback(
    (records: TelemetryRecord[], targetPoints: number, metric: MetricType): Promise<TelemetryRecord[]> => {
      return new Promise((resolve) => {
        const id = `req-${Date.now()}-${Math.random()}`;

        if (!workerRef.current) {
          // Main-thread fallback if worker not available
          resolve(records.slice(-targetPoints));
          return;
        }

        pendingCallbacks.current.set(id, (res) => {
          resolve(res.data);
        });

        const req: WorkerRequest = {
          id,
          type: 'downsample_lttb',
          payload: { records, targetPoints, metric },
        };

        workerRef.current.postMessage(req);
      });
    },
    []
  );

  return { runLTTB, isWorkerReady: !!workerRef.current };
}
