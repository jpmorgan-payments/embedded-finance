import { useCallback, useState } from 'react';

import {
  parseCloneStats,
  parseMonthlyCloneStats,
  parseMonthlyTrafficStats,
  parseReferrerStats,
  parseTrafficStats,
  type CloneData,
  type MonthlyCloneData,
  type MonthlyTrafficData,
  type ReferrerData,
  type TrafficData,
} from '@/lib/csv-parser';

/**
 * Data source URLs for GitHub CSV files
 */
export const DATA_SOURCES = {
  traffic:
    'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/metrics/metrics/traffic-stats-sorted.csv',
  clones:
    'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/metrics/metrics/clone-stats-sorted.csv',
  referrers:
    'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/metrics/metrics/referrer-stats-sorted.csv',
  monthlyTraffic:
    'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/metrics/metrics/monthly_scripts/data/monthly_traffic_stats.csv',
  monthlyClones:
    'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/metrics/metrics/monthly_scripts/data/monthly_clone_stats.csv',
} as const;

/**
 * All loaded RUM data
 */
export interface RumData {
  traffic: TrafficData[];
  clones: CloneData[];
  referrers: ReferrerData[];
  monthlyTraffic: MonthlyTrafficData[];
  monthlyClones: MonthlyCloneData[];
}

/**
 * Loading state for data fetching
 */
export interface RumDataState {
  data: RumData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch CSV file from URL
 */
async function fetchCSV(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Hook for fetching and managing RUM data from GitHub CSV files
 */
export function useRumData() {
  const [state, setState] = useState<RumDataState>({
    data: null,
    loading: false,
    error: null,
  });

  const loadData = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      // Fetch all CSV files in parallel
      const [
        trafficCSV,
        clonesCSV,
        referrersCSV,
        monthlyTrafficCSV,
        monthlyClonesCSV,
      ] = await Promise.all([
        fetchCSV(DATA_SOURCES.traffic),
        fetchCSV(DATA_SOURCES.clones),
        fetchCSV(DATA_SOURCES.referrers),
        fetchCSV(DATA_SOURCES.monthlyTraffic),
        fetchCSV(DATA_SOURCES.monthlyClones),
      ]);

      // Parse all CSV files
      const trafficResult = parseTrafficStats(trafficCSV);
      const clonesResult = parseCloneStats(clonesCSV);
      const referrersResult = parseReferrerStats(referrersCSV);
      const monthlyTrafficResult = parseMonthlyTrafficStats(monthlyTrafficCSV);
      const monthlyClonesResult = parseMonthlyCloneStats(monthlyClonesCSV);

      // Collect any parsing errors
      const errors: string[] = [];
      if (trafficResult.errors.length > 0) {
        errors.push(`Traffic stats: ${trafficResult.errors.length} errors`);
      }
      if (clonesResult.errors.length > 0) {
        errors.push(`Clone stats: ${clonesResult.errors.length} errors`);
      }
      if (referrersResult.errors.length > 0) {
        errors.push(`Referrer stats: ${referrersResult.errors.length} errors`);
      }
      if (monthlyTrafficResult.errors.length > 0) {
        errors.push(
          `Monthly traffic: ${monthlyTrafficResult.errors.length} errors`
        );
      }
      if (monthlyClonesResult.errors.length > 0) {
        errors.push(
          `Monthly clones: ${monthlyClonesResult.errors.length} errors`
        );
      }

      const data: RumData = {
        traffic: trafficResult.data,
        clones: clonesResult.data,
        referrers: referrersResult.data,
        monthlyTraffic: monthlyTrafficResult.data,
        monthlyClones: monthlyClonesResult.data,
      };

      setState({
        data,
        loading: false,
        error: errors.length > 0 ? errors.join('; ') : null,
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      });
    }
  }, []);

  return {
    ...state,
    loadData,
  };
}
