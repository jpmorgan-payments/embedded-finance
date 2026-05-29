import Papa from 'papaparse';

/**
 * Traffic statistics data structure
 */
export interface TrafficData {
  repository_name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  views: number;
  unique_visitors: number;
}

/**
 * Clone statistics data structure
 */
export interface CloneData {
  repository_name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  clones: number;
  unique_cloners: number;
}

/**
 * Referrer statistics data structure
 */
export interface ReferrerData {
  repository_name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  referrer: string;
  count: number;
}

/**
 * Monthly aggregated traffic data
 */
export interface MonthlyTrafficData {
  repository_name: string;
  month: string; // YYYY-MM format
  views: number;
  unique_visitors: number;
}

/**
 * Monthly aggregated clone data
 */
export interface MonthlyCloneData {
  repository_name: string;
  month: string; // YYYY-MM format
  clones: number;
  unique_cloners: number;
}

/**
 * Union type for all parsed data
 */
export type ParsedData =
  | TrafficData
  | CloneData
  | ReferrerData
  | MonthlyTrafficData
  | MonthlyCloneData;

/**
 * Result of CSV parsing operation
 */
export interface ParseResult<T extends ParsedData> {
  data: T[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

/**
 * Parse CSV text into typed data structure
 */
export function parseCSV<T extends ParsedData>(
  csvText: string,
  transformFn: (row: Record<string, string>) => T | null
): ParseResult<T> {
  const result: ParseResult<T> = {
    data: [],
    errors: [],
    meta: {} as Papa.ParseMeta,
  };

  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
    complete: (results) => {
      result.meta = results.meta;
      result.errors = results.errors;

      for (const row of results.data as Record<string, string>[]) {
        try {
          const transformed = transformFn(row);
          if (transformed !== null) {
            result.data.push(transformed);
          }
        } catch (error) {
          result.errors.push({
            type: 'Quotes',
            code: 'InvalidData',
            message: `Failed to transform row: ${error instanceof Error ? error.message : String(error)}`,
            row: results.data.indexOf(row),
          } as unknown as Papa.ParseError);
        }
      }
    },
  });

  return result;
}

/**
 * Transform traffic stats CSV row to TrafficData
 */
export function transformTrafficData(
  row: Record<string, string>
): TrafficData | null {
  const date = row.date?.trim();
  const views = parseInt(row.views?.trim() || '0', 10);
  const uniqueVisitors = parseInt(
    row['unique_visitors/cloners']?.trim() ||
      row.unique_visitors?.trim() ||
      '0',
    10
  );

  if (!date || isNaN(views) || isNaN(uniqueVisitors)) {
    return null;
  }

  return {
    repository_name: row.repository_name?.trim() || 'unknown',
    date,
    views,
    unique_visitors: uniqueVisitors,
  };
}

/**
 * Transform clone stats CSV row to CloneData
 */
export function transformCloneData(
  row: Record<string, string>
): CloneData | null {
  const date = row.date?.trim();
  const clones = parseInt(row.clones?.trim() || '0', 10);
  const uniqueCloners = parseInt(row.unique_cloners?.trim() || '0', 10);

  if (!date || isNaN(clones) || isNaN(uniqueCloners)) {
    return null;
  }

  return {
    repository_name: row.repository_name?.trim() || 'unknown',
    date,
    clones,
    unique_cloners: uniqueCloners,
  };
}

/**
 * Transform referrer stats CSV row to ReferrerData
 */
export function transformReferrerData(
  row: Record<string, string>
): ReferrerData | null {
  // Referrer CSV structure: repository_name,site,views,unique_visitors/cloners
  // Note: This CSV doesn't have a date column, so we'll use a placeholder date
  const date = row.date?.trim() || '1970-01-01'; // Placeholder date since referrer CSV has no dates
  const referrer =
    row.site?.trim() ||
    row.referrer?.trim() ||
    row.referrer_url?.trim() ||
    row.referrer_url_path?.trim() ||
    row.source?.trim() ||
    '';
  const count = parseInt(
    row.views?.trim() ||
      row.count?.trim() ||
      row.uniques?.trim() ||
      row['unique_visitors/cloners']?.trim() ||
      '0',
    10
  );

  // Require referrer and valid count
  if (!referrer || isNaN(count) || count === 0) {
    return null;
  }

  return {
    repository_name: row.repository_name?.trim() || 'unknown',
    date,
    referrer,
    count,
  };
}

/**
 * Transform monthly traffic stats CSV row to MonthlyTrafficData
 */
export function transformMonthlyTrafficData(
  row: Record<string, string>
): MonthlyTrafficData | null {
  const month = row.month?.trim() || row.date?.trim();
  const views = parseInt(row.views?.trim() || '0', 10);
  const uniqueVisitors = parseInt(
    row.unique_visitors?.trim() ||
      row['unique_visitors/cloners']?.trim() ||
      '0',
    10
  );

  if (!month || isNaN(views) || isNaN(uniqueVisitors)) {
    return null;
  }

  return {
    repository_name: row.repository_name?.trim() || 'unknown',
    month,
    views,
    unique_visitors: uniqueVisitors,
  };
}

/**
 * Transform monthly clone stats CSV row to MonthlyCloneData
 */
export function transformMonthlyCloneData(
  row: Record<string, string>
): MonthlyCloneData | null {
  const month = row.month?.trim() || row.date?.trim();
  const clones = parseInt(row.clones?.trim() || '0', 10);
  const uniqueCloners = parseInt(row.unique_cloners?.trim() || '0', 10);

  if (!month || isNaN(clones) || isNaN(uniqueCloners)) {
    return null;
  }

  return {
    repository_name: row.repository_name?.trim() || 'unknown',
    month,
    clones,
    unique_cloners: uniqueCloners,
  };
}

/**
 * Parse traffic stats CSV
 */
export function parseTrafficStats(csvText: string): ParseResult<TrafficData> {
  return parseCSV(csvText, transformTrafficData);
}

/**
 * Parse clone stats CSV
 */
export function parseCloneStats(csvText: string): ParseResult<CloneData> {
  return parseCSV(csvText, transformCloneData);
}

/**
 * Parse referrer stats CSV
 */
export function parseReferrerStats(csvText: string): ParseResult<ReferrerData> {
  return parseCSV(csvText, transformReferrerData);
}

/**
 * Parse monthly traffic stats CSV
 */
export function parseMonthlyTrafficStats(
  csvText: string
): ParseResult<MonthlyTrafficData> {
  return parseCSV(csvText, transformMonthlyTrafficData);
}

/**
 * Parse monthly clone stats CSV
 */
export function parseMonthlyCloneStats(
  csvText: string
): ParseResult<MonthlyCloneData> {
  return parseCSV(csvText, transformMonthlyCloneData);
}
