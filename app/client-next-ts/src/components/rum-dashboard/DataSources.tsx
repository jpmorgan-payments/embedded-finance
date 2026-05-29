import { ExternalLink } from 'lucide-react';

import { DATA_SOURCES } from '@/hooks/use-rum-data';

export function DataSources() {
  const sources = [
    {
      title: 'Traffic Statistics (Daily)',
      url: DATA_SOURCES.traffic,
      description: 'Daily page views and unique visitors',
    },
    {
      title: 'Clone Statistics (Daily)',
      url: DATA_SOURCES.clones,
      description: 'Daily repository clones and unique cloners',
    },
    {
      title: 'Referrer Statistics',
      url: DATA_SOURCES.referrers,
      description: 'Traffic sources and referrers',
    },
    {
      title: 'Traffic Statistics (Monthly)',
      url: DATA_SOURCES.monthlyTraffic,
      description: 'Monthly aggregated traffic data',
    },
    {
      title: 'Clone Statistics (Monthly)',
      url: DATA_SOURCES.monthlyClones,
      description: 'Monthly aggregated clone data',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        All data is fetched at runtime from GitHub and stored only in UI state
      </p>
      <div className="space-y-3">
        {sources.map((source) => (
          <div
            key={source.url}
            className="flex items-start justify-between rounded-md border p-3"
          >
            <div className="flex-1">
              <h4 className="font-medium">{source.title}</h4>
              <p className="text-sm text-muted-foreground">
                {source.description}
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 break-all text-xs text-primary hover:underline"
              >
                {source.url}
              </a>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
      <div className="rounded-md bg-muted p-3 text-sm">
        <p className="font-medium">Repository:</p>
        <a
          href="https://github.com/jpmorgan-payments/embedded-finance"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          jpmorgan-payments/embedded-finance
        </a>
        <span className="text-muted-foreground"> (metrics branch)</span>
      </div>
    </div>
  );
}
