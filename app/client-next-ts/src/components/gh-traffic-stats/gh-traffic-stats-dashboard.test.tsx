import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addDays } from '@/lib/gh-metrics/derive';
import { REPO_SOURCES } from '@/lib/gh-metrics/sources';

import { GhTrafficStatsDashboard } from './gh-traffic-stats-dashboard';

const [ef, uf, ai] = REPO_SOURCES;

function rows(
  from: string,
  n: number,
  line: (date: string, i: number) => string
) {
  return Array.from({ length: n }, (_, i) => line(addDays(from, i), i)).join(
    '\n'
  );
}

const CSV: Record<string, string> = {
  [ef.files.views]: `repository_name,date,views,unique_visitors/cloners\n${rows(
    '2026-09-07',
    28,
    (d) => `embedded-banking,${d},10,3`
  )}`,
  [ef.files.clones]: `repository_name,date,clones,unique_cloners\n${rows(
    '2026-09-07',
    28,
    (d) => `embedded-banking,${d},4,2`
  )}`,
  [ef.files.referrers]: `repository_name,site,views,unique_visitors/cloners
embedded-banking,github.com,28,21
embedded-banking,secret-host.jpmchase.net,5,1
embedded-banking,confluence.partner.example,4,1`,
  [uf.files.views]: `Date,Total Views,Unique Visitors\n${rows(
    '2026-09-21',
    15,
    (d, i) => `${d} 06:00:00,${i === 14 ? 357 : 40},${i === 14 ? 87 : 10}`
  )}`,
  [uf.files.clones]: `Date,Total Clones,Unique Clones\n${rows(
    '2026-09-21',
    15,
    (d) => `${d} 06:00:00,100,50`
  )}`,
  [uf.files.referrers]: `Date,Referrer,Count,Uniques
2026-10-05 06:00:00,github.com,34,13`,
  [ai.files.views]: `repository_name,date,views,unique_visitors/cloners
jpmorgan-payments/pdp-skills,2026-09-21 06:00:00,881,145
jpmorgan-payments/ai,2026-10-05 06:00:00,1106,239`,
  [ai.files.clones]: `repository_name,date,clones,unique_cloners
jpmorgan-payments/pdp-skills,2026-09-21 06:00:00,341,159
jpmorgan-payments/ai,2026-10-05 06:00:00,194,108`,
  [ai.files.referrers]: `Date,Referrer,Count,Uniques
2026-10-05 06:00:00,developer.payments.jpmorgan.com,84,40`,
};

function mockFetch(failing: string[] = []) {
  return vi.fn(async (url: string) => {
    if (failing.includes(url) || !(url in CSV)) {
      return new Response('not found', {
        status: 404,
        statusText: 'Not Found',
      });
    }
    return new Response(CSV[url], { status: 200 });
  });
}

describe('GhTrafficStatsDashboard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads every repository and shows comparable 14-day totals', async () => {
    vi.stubGlobal('fetch', mockFetch());
    render(<GhTrafficStatsDashboard search={{}} onSearchChange={vi.fn()} />);

    expect(await screen.findByText('Latest 14 days')).toBeInTheDocument();
    const efCard = screen.getByRole('article', { name: 'embedded-finance' });
    expect(within(efCard).getByText('140')).toBeInTheDocument();
    expect(within(efCard).getAllByText('not recorded')).toHaveLength(2);

    const aiCard = screen.getByRole('article', { name: 'ai' });
    expect(within(aiCard).getByText('1,106')).toBeInTheDocument();
    expect(within(aiCard).getByText('239')).toBeInTheDocument();

    expect(
      screen.getByText(
        'ai had the most views in the latest 14 days: 1,106 (unicorn-finance 357, embedded-finance 140).'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Data through Oct 5, 2026')).toBeInTheDocument();
  });

  it('never renders intranet referrer host names', async () => {
    vi.stubGlobal('fetch', mockFetch());
    render(<GhTrafficStatsDashboard search={{}} onSearchChange={vi.fn()} />);

    expect(await screen.findByText('JPMC internal')).toBeInTheDocument();
    expect(screen.getByText('Partner intranets')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('jpmchase');
    expect(document.body.textContent).not.toContain('partner.example');
  });

  it('keeps working when one repository fails to load', async () => {
    vi.stubGlobal('fetch', mockFetch([uf.files.views]));
    render(<GhTrafficStatsDashboard search={{}} onSearchChange={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't load metrics for unicorn-finance."
    );
    const aiCard = screen.getByRole('article', { name: 'ai' });
    expect(within(aiCard).getByText('1,106')).toBeInTheDocument();
  });

  it('reports range, metric and repository changes', async () => {
    vi.stubGlobal('fetch', mockFetch());
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(
      <GhTrafficStatsDashboard search={{}} onSearchChange={onSearchChange} />
    );
    await screen.findByText('Latest 14 days');

    await user.click(screen.getByRole('radio', { name: '12 months' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ range: '12m' });

    await user.click(
      within(
        screen.getByRole('radiogroup', { name: 'Trend metric' })
      ).getByRole('radio', { name: 'Clones' })
    );
    expect(onSearchChange).toHaveBeenLastCalledWith({ metric: 'clones' });

    const aiCard = screen.getByRole('article', { name: 'ai' });
    await user.click(within(aiCard).getByRole('button', { name: /details/i }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ repo: 'ai' });
  });

  it('shows the rename note for a repository recorded under two names', async () => {
    vi.stubGlobal('fetch', mockFetch());
    render(
      <GhTrafficStatsDashboard
        search={{ repo: 'ai' }}
        onSearchChange={vi.fn()}
      />
    );
    expect(
      await screen.findByText(/Recorded as jpmorgan-payments\/pdp-skills/)
    ).toBeInTheDocument();
  });
});
