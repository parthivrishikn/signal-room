# Signal Room
> **Live system telemetry, without the noise.**

Signal Room is a high-performance real-time telemetry dashboard built for operations and performance engineering teams. It visualizes high-frequency system telemetry from distributed services across global regions with zero external charting libraries.

---

## Key Features

- **Pure Canvas + SVG Hybrid Engine**:
  - Primary **Line Chart**: Time-series telemetry rendering up to 50,000+ points at 60 FPS. Features time/value axes, grid, current/min/max/average stats, hover crosshair, floating technical tooltip, mouse-wheel zoom, and drag panning.
  - **Bar Chart**: Live cross-service baseline comparison.
  - **Scatter Plot**: Latency vs. CPU correlation analysis.
  - **Heatmap**: Regional load and latency intensity matrix.
  - **Sparklines**: High-frequency inline Canvas trends in metric cards.
  - **Zero Chart Libraries**: Built completely from scratch using standard HTML5 Canvas 2D API and SVG/HTML overlays.
- **Realistic Telemetry Engine**:
  - Simulates 6 core services (*API Gateway, Checkout, Search, Auth, Media, Notifications*) across 5 regions (*Chennai, Mumbai, Singapore, Frankfurt, Virginia*).
  - Correlated metric behavior: Latency surges directly drive CPU load, error spikes, and throughput changes.
- **Incident Trace Timeline**:
  - Automated anomaly detection monitors the stream for threshold breaches and logs incident markers with severity indicators.
  - Clicking any incident automatically pans the primary chart's time window directly to the incident timestamp.
- **Virtualized Telemetry Table**:
  - Custom `useVirtualization` hook renders only the ~25-35 visible DOM rows regardless of whether there are 1,000 or 50,000 points in the buffer, maintaining 60 FPS scrolling and low memory usage.
- **Runtime Performance HUD**:
  - Live measurement of real FPS (via frame deltas), frame duration (budget: 16.6ms), Canvas 2D render time (`performance.now()`), processing duration, buffer size, visible point count, and browser JS heap (`performance.memory`).
  - Dynamic status classifier: **HEALTHY** (≥55 FPS), **DEGRADED** (30–54 FPS), **HEAVY** (<30 FPS).
  - One-click **Stress Test Mode** injecting multi-point bursts to simulate operational spikes.

---

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode, zero errors)
- **Styling**: Tailwind CSS (editorial, technical, understated dark palette)
- **Icons**: Lucide React
- **Rendering**: HTML5 Canvas (high-frequency data) + HTML/SVG (interactive overlays, tooltips)
- **State Architecture**: Decoupled React Context + mutable circular buffer ref

---

## Architectural & Engineering Decisions

1. **Decoupled Data State & Render Loop**:
   Real-time telemetry arrives every 100ms. Triggering a React component re-render on every point would thrash the virtual DOM and trigger garbage collection freezes. Instead, data points are appended to a mutable buffer ref. The Canvas chart runs on an independent `requestAnimationFrame` loop that directly paints new frames, while React state updates for the UI chrome are throttled to ~250ms.

2. **Why Canvas + SVG Over pure SVG/DOM**:
   Rendering 10,000 to 50,000 points as SVG `<circle>` or `<path>` elements bloats the browser's DOM tree, causing layout thrashing and stutter. Canvas allows drawing 50,000 points in sub-2ms render calls. We preserve SVG/HTML only where accessibility, text crispness, and tooltip positioning excel.

3. **High-DPI Retina Scaling**:
   All canvas elements automatically calculate `window.devicePixelRatio` and scale canvas dimensions and 2D contexts, ensuring razor-sharp lines on Retina displays without blurring.

4. **Table Virtualization**:
   Instead of mounting thousands of `<tr>` or `<div>` elements, `useVirtualization` computes `scrollTop`, `viewportHeight`, and `rowHeight` with overscan to render only the visible viewport slice.

---

## Running Locally

### Prerequisites
- Node.js 18+ or 20+
- npm

### Installation & Startup

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open in browser
http://localhost:3000/dashboard
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```
