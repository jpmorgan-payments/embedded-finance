import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type RumData } from '@/hooks/use-rum-data';

interface ExportButtonProps {
  data: RumData;
}

export function ExportButton({ data }: ExportButtonProps) {
  const exportToCSV = () => {
    // Combine all data into a single CSV
    const rows: string[] = [];

    // Headers
    rows.push('Type,Date,Repository,Metric1,Value1,Metric2,Value2');

    // Traffic data
    for (const item of data.traffic) {
      rows.push(
        `Traffic,${item.date},${item.repository_name},Views,${item.views},Unique Visitors,${item.unique_visitors}`
      );
    }

    // Clone data
    for (const item of data.clones) {
      rows.push(
        `Clones,${item.date},${item.repository_name},Clones,${item.clones},Unique Cloners,${item.unique_cloners}`
      );
    }

    // Referrer data
    for (const item of data.referrers) {
      rows.push(
        `Referrer,${item.date},${item.repository_name},${item.referrer},${item.count},,`
      );
    }

    // Monthly traffic
    for (const item of data.monthlyTraffic) {
      rows.push(
        `Monthly Traffic,${item.month},${item.repository_name},Views,${item.views},Unique Visitors,${item.unique_visitors}`
      );
    }

    // Monthly clones
    for (const item of data.monthlyClones) {
      rows.push(
        `Monthly Clones,${item.month},${item.repository_name},Clones,${item.clones},Unique Cloners,${item.unique_cloners}`
      );
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `rum-data-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={exportToCSV} variant="outline" size="lg">
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
