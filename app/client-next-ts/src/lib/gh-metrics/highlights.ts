import { inRange, workweekSplit, yearOverYear, type Gap } from './derive';
import { formatChange, formatNumber, formatSpan } from './format';
import type { RepoView } from './repo-view';

export interface Highlight {
  id: string;
  tone: 'up' | 'down' | 'info' | 'warning';
  text: string;
}

const MIN_BASE_VIEWS = 20;
const MIN_GAP_DAYS = 7;

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function overlaps(a: Gap, b: Gap) {
  return a.from <= b.to && b.from <= a.to;
}

/** A few short, verifiable statements; every number comes straight from the data. */
export function buildHighlights(repos: RepoView[]): Highlight[] {
  const out: Highlight[] = [];
  const withViews = repos.filter((r) => r.latestViews);

  if (withViews.length >= 2) {
    const [top, ...rest] = [...withViews].sort(
      (a, b) => b.latestViews!.current - a.latestViews!.current
    );
    out.push({
      id: 'top-repo',
      tone: 'info',
      text: `${top.source.label} had the most views in the latest 14 days: ${formatNumber(top.latestViews!.current)} (${rest
        .map((r) => `${r.source.label} ${formatNumber(r.latestViews!.current)}`)
        .join(', ')}).`,
    });
  }

  const mover = withViews
    .filter((r) => {
      const { change, previous } = r.latestViews!;
      return (
        change !== null &&
        (previous ?? 0) >= MIN_BASE_VIEWS &&
        (change >= 0.5 || change <= -1 / 3)
      );
    })
    .sort(
      (a, b) =>
        Math.abs(Math.log1p(b.latestViews!.change!)) -
        Math.abs(Math.log1p(a.latestViews!.change!))
    )[0];
  if (mover) {
    const { current, previous, change } = mover.latestViews!;
    out.push({
      id: 'mover',
      tone: change! > 0 ? 'up' : 'down',
      text: `${mover.source.label}: ${formatNumber(previous!)} → ${formatNumber(current)} views versus the previous 14 days (${formatChange(change!)}).`,
    });
  }

  for (const repo of repos) {
    if (!repo.daily) continue;
    const yoy = yearOverYear(repo.daily);
    if (yoy) {
      const change = yoy.current / yoy.previous - 1;
      out.push({
        id: `yoy-${repo.source.id}`,
        tone: change >= 0 ? 'up' : 'down',
        text: `${repo.source.label}: ${formatNumber(yoy.current)} views in the last ${yoy.days} days vs ${formatNumber(yoy.previous)} in the same weeks of ${yoy.previousEnd.slice(0, 4)} (${formatChange(change)}).`,
      });
    }
    const split = workweekSplit(inRange(repo.daily, '12m', repo.lastDate));
    if (split && split.weekdayMedian >= 3 * Math.max(split.weekendMedian, 1)) {
      out.push({
        id: `workweek-${repo.source.id}`,
        tone: 'info',
        text: `${repo.source.label} is visited on workdays: a typical weekday brings ${formatNumber(split.weekdayMedian)} views, a typical weekend day ${formatNumber(split.weekendMedian)}.`,
      });
    }
  }

  const longest = repos
    .flatMap((r) => r.gaps.map((gap) => ({ repo: r, gap })))
    .filter(({ gap }) => gap.days >= MIN_GAP_DAYS)
    .sort((a, b) => b.gap.days - a.gap.days)[0];
  if (longest) {
    const { repo, gap } = longest;
    const others = repos
      .filter(
        (r) =>
          r !== repo &&
          r.gaps.some((g) => g.days >= MIN_GAP_DAYS && overlaps(g, gap))
      )
      .map((r) => r.source.label);
    const alsoAffected = others.length
      ? `; ${listJoin(others)} ${others.length === 1 ? 'has' : 'have'} a gap in the same period`
      : '';
    out.push({
      id: 'gap',
      tone: 'warning',
      text: `${repo.source.label} has no data for ${formatSpan(gap.from, gap.to)} (${gap.days} days)${alsoAffected}. Charts leave missing days blank instead of showing zero.`,
    });
  }

  return out;
}
