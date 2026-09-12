import { DataProvider } from '@/components/providers/DataProvider';
import { DashboardContent } from '@/components/ui/DashboardContent';

export const metadata = {
  title: 'Dashboard | Signal Room',
  description: 'Live system telemetry without the noise.',
};

export default function DashboardPage() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  );
}
