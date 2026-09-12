export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-telemetry-bg text-telemetry-muted font-mono text-sm">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-telemetry-accent animate-ping" />
        <span>INITIALIZING TELEMETRY STREAM...</span>
      </div>
    </div>
  );
}
