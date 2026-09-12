import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Room | Live System Telemetry',
  description: 'High-performance real-time telemetry dashboard without external charting libraries',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-telemetry-bg text-telemetry-text min-h-screen flex flex-col selection:bg-telemetry-accent selection:text-black">
        {children}
      </body>
    </html>
  );
}
