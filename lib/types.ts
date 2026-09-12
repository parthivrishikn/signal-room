export type ServiceId =
  | 'API Gateway'
  | 'Checkout'
  | 'Search'
  | 'Auth'
  | 'Media'
  | 'Notifications';

export type RegionId =
  | 'Chennai'
  | 'Mumbai'
  | 'Singapore'
  | 'Frankfurt'
  | 'Virginia';

export type MetricType =
  | 'latency'
  | 'requests'
  | 'errors'
  | 'cpu'
  | 'memory'
  | 'throughput';

export interface TelemetryRecord {
  id: string;
  timestamp: number; // Unix epoch ms
  service: ServiceId;
  region: RegionId;
  latency: number; // ms
  requests: number; // req/sec
  errors: number; // error % (0 - 100)
  cpu: number; // cpu % (0 - 100)
  memory: number; // MB
  throughput: number; // MB/sec
}

export type TimeRange = '1m' | '5m' | '1h';

export interface FilterState {
  service: ServiceId | 'All';
  region: RegionId | 'All';
  metric: MetricType;
  timeRange: TimeRange;
}

export interface IncidentEvent {
  id: string;
  timestamp: number;
  service: ServiceId;
  region: RegionId;
  type: 'latency' | 'errors' | 'cpu' | 'traffic';
  severity: 'warning' | 'critical';
  title: string;
  detail: string;
}

export interface PerformanceStats {
  fps: number;
  frameTime: number; // ms
  renderTime: number; // ms
  processingTime: number; // ms
  datasetSize: number;
  visiblePoints: number;
  memoryUsage: string; // formatted string or 'Memory API unavailable'
  status: 'Healthy' | 'Degraded' | 'Heavy';
}

export interface ChartBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
