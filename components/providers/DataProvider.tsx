'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import {
  TelemetryRecord,
  FilterState,
  IncidentEvent,
  MetricType,
  ServiceId,
  RegionId,
  TimeRange,
} from '@/lib/types';
import { generateInitialTelemetry, generateTelemetryPoint } from '@/lib/dataGenerator';

interface DataContextType {
  // Direct mutable buffer ref for high-frequency canvas rendering without React overhead
  bufferRef: React.MutableRefObject<TelemetryRecord[]>;
  // Version counter to trigger re-renders in UI components (table, cards) at a sane throttle
  dataVersion: number;
  totalPoints: number;

  // Stream controls
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  updateRateMs: number;
  setUpdateRateMs: (rate: number) => void;
  bufferCapacity: number;
  setBufferCapacity: (capacity: number) => void;
  stressMode: boolean;
  setStressMode: (stress: boolean) => void;
  resetStream: () => void;

  // Filter state
  filters: FilterState;
  setServiceFilter: (service: ServiceId | 'All') => void;
  setRegionFilter: (region: RegionId | 'All') => void;
  setMetricFilter: (metric: MetricType) => void;
  setTimeRange: (range: TimeRange) => void;

  // Zoom / Pan window
  customTimeWindow: { start: number; end: number } | null;
  setCustomTimeWindow: (window: { start: number; end: number } | null) => void;
  resetTimeWindow: () => void;

  // Incidents
  incidents: IncidentEvent[];
  jumpToIncident: (incident: IncidentEvent) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Buffer capacity (1k, 5k, 10k, 25k, 50k, 100k)
  const [bufferCapacity, setBufferCapacity] = useState<number>(10000);
  const [updateRateMs, setUpdateRateMs] = useState<number>(100);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [stressMode, setStressMode] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    service: 'All',
    region: 'All',
    metric: 'latency',
    timeRange: '1m',
  });

  // Custom Zoom / Pan window
  const [customTimeWindow, setCustomTimeWindow] = useState<{ start: number; end: number } | null>(
    null
  );

  // Incidents list
  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);

  // High performance pre-allocated ring buffer
  const bufferRef = useRef<TelemetryRecord[]>([]);

  // Initialize buffer
  useEffect(() => {
    const initial = generateInitialTelemetry(Math.min(bufferCapacity, 2500));
    bufferRef.current = initial.records;
    setIncidents(initial.incidents.slice(-10));
    setDataVersion((v) => v + 1);
  }, [bufferCapacity]);

  // Real-time generator loop
  useEffect(() => {
    if (!isRunning) return;

    let timer: NodeJS.Timeout;

    const tick = () => {
      const multiplier = stressMode ? 2.5 : 1.0;
      // In stress mode, emit a small batch per tick to test high pressure
      const pointsToEmit = stressMode ? 4 : 1;

      let newIncident: IncidentEvent | undefined = undefined;

      for (let i = 0; i < pointsToEmit; i++) {
        const { record, incident } = generateTelemetryPoint(
          Date.now(),
          undefined,
          undefined,
          multiplier
        );
        bufferRef.current.push(record);
        if (incident) newIncident = incident;
      }

      // Slide window if capacity exceeded
      if (bufferRef.current.length > bufferCapacity) {
        const overflow = bufferRef.current.length - bufferCapacity;
        bufferRef.current.splice(0, overflow);
      }

      if (newIncident) {
        setIncidents((prev) => [newIncident!, ...prev].slice(0, 20));
      }

      timer = setTimeout(tick, updateRateMs);
    };

    timer = setTimeout(tick, updateRateMs);
    return () => clearTimeout(timer);
  }, [isRunning, updateRateMs, bufferCapacity, stressMode]);

  // Throttle notification to React UI components (table, sparklines, counters) to ~200ms
  // This keeps the React DOM quiet while the Canvas renders at 60 FPS!
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setDataVersion((v) => v + 1);
    }, 250);
    return () => clearInterval(interval);
  }, [isRunning]);

  const setServiceFilter = useCallback((service: ServiceId | 'All') => {
    setFilters((f) => ({ ...f, service }));
  }, []);

  const setRegionFilter = useCallback((region: RegionId | 'All') => {
    setFilters((f) => ({ ...f, region }));
  }, []);

  const setMetricFilter = useCallback((metric: MetricType) => {
    setFilters((f) => ({ ...f, metric }));
  }, []);

  const setTimeRange = useCallback((timeRange: TimeRange) => {
    setFilters((f) => ({ ...f, timeRange }));
    setCustomTimeWindow(null); // Clear custom zoom on range switch
  }, []);

  const resetTimeWindow = useCallback(() => {
    setCustomTimeWindow(null);
  }, []);

  const resetStream = useCallback(() => {
    const initial = generateInitialTelemetry(Math.min(bufferCapacity, 1500));
    bufferRef.current = initial.records;
    setIncidents(initial.incidents);
    setCustomTimeWindow(null);
    setDataVersion((v) => v + 1);
  }, [bufferCapacity]);

  const jumpToIncident = useCallback((incident: IncidentEvent) => {
    // Center chart 15s before and 15s after incident timestamp
    setCustomTimeWindow({
      start: incident.timestamp - 15000,
      end: incident.timestamp + 15000,
    });
  }, []);

  return (
    <DataContext.Provider
      value={{
        bufferRef,
        dataVersion,
        totalPoints: bufferRef.current.length,
        isRunning,
        setIsRunning,
        updateRateMs,
        setUpdateRateMs,
        bufferCapacity,
        setBufferCapacity,
        stressMode,
        setStressMode,
        resetStream,
        filters,
        setServiceFilter,
        setRegionFilter,
        setMetricFilter,
        setTimeRange,
        customTimeWindow,
        setCustomTimeWindow,
        resetTimeWindow,
        incidents,
        jumpToIncident,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useTelemetryData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useTelemetryData must be used within a DataProvider');
  }
  return ctx;
}
