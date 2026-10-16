#!/usr/bin/env node
/**
 * Regenerates `src/data/repo-evolution.generated.ts` (the /repo-evolution subway map) from git history.
 *
 * Usage (from app/client-next-ts):
 *   yarn data:repo-evolution [--ref <rev>]
 *
 * Needs full history (`git fetch --unshallow` on shallow CI clones). Output is deterministic for a
 * given ref, so re-running without new commits produces no diff. No author names, e-mails or
 * commit subjects (branch names can carry handles) are emitted.
 * Edit ./config.mjs to add lines or stations.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LINES, MILESTONES, REPO_URL } from './config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, '..', '..');
const OUT = resolve(appDir, 'src', 'data', 'repo-evolution.generated.ts');

const argv = process.argv.slice(2);
const refArg = argv.indexOf('--ref');
const REF = refArg >= 0 ? argv[refArg + 1] : 'HEAD';

const run = (cwd, args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
const repoRoot = run(appDir, ['rev-parse', '--show-toplevel']).trim();
const git = (...args) => run(repoRoot, args);

if (git('rev-parse', '--is-shallow-repository').trim() === 'true') {
  console.error(
    'repo-evolution: shallow clone detected; run `git fetch --unshallow` first.'
  );
  process.exit(1);
}

const REC = '\x1e';
const FLD = '\x1f';
const COMMIT_FORMAT = `%H${FLD}%aI${FLD}%s`;

// ---------------------------------------------------------------- helpers

const monthOf = (iso) => iso.slice(0, 7);
const byDate = (a, b) => a.date.localeCompare(b.date);
const lines = (text) => text.split('\n').filter(Boolean);

function monthRange(first, last) {
  const out = [];
  let [y, m] = first.split('-').map(Number);
  const [ly, lm] = last.split('-').map(Number);
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function monthEndIso(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1) - 1000).toISOString();
}

function parseCommit(line) {
  const [sha, date, subject] = line.split(FLD);
  return { sha, date, subject };
}

// ---------------------------------------------------------------- commits & PRs

const commitDates = lines(
  git('log', REF, '--no-merges', '--format=%aI')
).sort();
const commitsInOrder = lines(
  git('log', REF, '--no-merges', `--format=${COMMIT_FORMAT}`)
)
  .map(parseCommit)
  .sort(byDate);
const prDates = lines(git('log', REF, '--merges', `--format=%aI${FLD}%s`))
  .map((line) => line.split(FLD))
  .filter(([, subject]) => /Merge pull request #\d+/.test(subject))
  .map(([date]) => date);

const headCommit = parseCommit(
  git('log', '-1', `--format=${COMMIT_FORMAT}`, REF).trim()
);
const monthKeys = monthRange(monthOf(commitDates[0]), monthOf(headCommit.date));
const monthIndex = (iso) =>
  Math.max(0, Math.min(monthKeys.length - 1, monthKeys.indexOf(monthOf(iso))));

// ---------------------------------------------------------------- library versions

const versions = [];
{
  const seen = new Set();
  const log = git(
    'log',
    REF,
    '--date-order',
    '--reverse',
    '-p',
    '-U0',
    `--format=${REC}${COMMIT_FORMAT}`,
    '--',
    'embedded-components/package.json'
  );
  for (const record of log.split(REC)) {
    if (!record.trim()) continue;
    const commit = parseCommit(record.slice(0, record.indexOf('\n')));
    const v = /^\+\s*"version":\s*"([^"]+)"/m.exec(record)?.[1];
    if (v && !seen.has(v)) {
      seen.add(v);
      versions.push({ version: v, date: commit.date, commit });
    }
  }
  versions.sort(byDate);
}

const headVersion = (() => {
  try {
    return JSON.parse(git('show', `${REF}:embedded-components/package.json`))
      .version;
  } catch {
    return null;
  }
})();

// ---------------------------------------------------------------- months

const months = monthKeys.map((key) => ({
  key,
  commits: 0,
  prs: 0,
  version: null,
}));
for (const date of commitDates) months[monthIndex(date)].commits += 1;
for (const date of prDates) months[monthIndex(date)].prs += 1;
for (const m of months) {
  m.version =
    versions.filter((v) => v.date <= monthEndIso(m.key)).pop()?.version ?? null;
}

// ---------------------------------------------------------------- rules

const oldest = (text) => lines(text).map(parseCommit).sort(byDate)[0] ?? null;

function commitAt(rev) {
  try {
    return parseCommit(
      git('log', '-1', `--format=${COMMIT_FORMAT}`, rev).trim()
    );
  } catch {
    return null;
  }
}

function resolveRule(rule) {
  switch (rule.type) {
    case 'first-commit':
      return lines(git('rev-list', '--max-parents=0', REF))
        .map(commitAt)
        .sort(byDate)[0];
    case 'head':
      return headCommit;
    case 'path':
      return oldest(
        git(
          'log',
          REF,
          '--full-history',
          `--format=${COMMIT_FORMAT}`,
          '--',
          rule.path
        )
      );
    case 'removed':
      return (
        lines(
          git(
            'log',
            REF,
            '--diff-filter=D',
            `--format=${COMMIT_FORMAT}`,
            '--',
            rule.path
          )
        )
          .map(parseCommit)
          .sort(byDate)
          .pop() ?? null
      );
    case 'pickaxe':
      return oldest(
        git(
          'log',
          REF,
          `-S${rule.text}`,
          `--format=${COMMIT_FORMAT}`,
          '--',
          rule.path
        )
      );
    case 'commit-count':
      return commitsInOrder[rule.count - 1] ?? null;
    case 'version':
      return versions.find((x) => x.version === rule.version)?.commit ?? null;
    case 'tag':
      return commitAt(`${rule.tag}^{commit}`);
    case 'pr': {
      const sha = lines(
        git(
          'log',
          REF,
          '--merges',
          '--format=%H',
          `--grep=Merge pull request #${rule.number} `
        )
      ).pop();
      return sha ? commitAt(sha) : null;
    }
    default:
      throw new Error(`Unknown rule ${JSON.stringify(rule)}`);
  }
}

/** Finds an open roadmap item: the matched line, plus its section when it is a heading. */
function resolvePlanned(rule) {
  let text;
  try {
    text = git('show', `${REF}:${rule.path}`).split('\n');
  } catch {
    return { missing: `${rule.path} not found` };
  }
  const index = text.findIndex((l) => l.includes(rule.match));
  if (index < 0)
    return { missing: `"${rule.match}" not found in ${rule.path}` };
  let end = index + 1;
  if (text[index].startsWith('#')) {
    while (end < text.length && !text[end].startsWith('#')) end += 1;
  }
  const scope = text.slice(index, end).join('\n');
  if (!rule.open.some((marker) => scope.includes(marker))) {
    return { done: true, line: index + 1 };
  }
  return { line: index + 1 };
}

// ---------------------------------------------------------------- stations

const lineIds = new Set(LINES.map((l) => l.id));
const history = [];
const planned = [];
for (const m of MILESTONES) {
  if (m.line !== null && !lineIds.has(m.line)) {
    throw new Error(`Milestone ${m.id}: unknown line ${m.line}`);
  }
  const base = {
    id: m.id,
    kind: m.kind,
    line: m.line,
    label: m.label,
    title: m.title,
    blurb: m.blurb,
  };

  if (m.kind === 'planned') {
    const hit = resolvePlanned(m.rule);
    if (hit.missing) {
      console.warn(
        `repo-evolution: planned "${m.id}" skipped: ${hit.missing}.`
      );
      continue;
    }
    if (hit.done) {
      console.warn(
        `repo-evolution: planned "${m.id}" looks done (${m.rule.path}:${hit.line}); ` +
          'skipped — promote it to a history station in config.mjs.'
      );
      continue;
    }
    planned.push({
      ...base,
      date: null,
      month: null,
      sha: null,
      source: { path: m.rule.path, line: hit.line },
    });
    continue;
  }

  const hit = resolveRule(m.rule);
  if (!hit) {
    console.warn(
      `repo-evolution: milestone "${m.id}" not found in history; skipped.`
    );
    continue;
  }
  history.push({
    ...base,
    date: hit.date.slice(0, 10),
    month: monthIndex(hit.date),
    sha: hit.sha.slice(0, 8),
    source: null,
  });
}
history.sort(byDate);
const milestones = [...history, ...planned];

// ---------------------------------------------------------------- lines

const resolvedLines = LINES.map((l) => {
  const firstStation = history.find((m) => m.line === l.id);
  const fromRule = l.start
    ? resolveRule(l.start)?.date.slice(0, 10)
    : undefined;
  const start = [fromRule, firstStation?.date].filter(Boolean).sort()[0];
  if (!start) throw new Error(`Line ${l.id}: no start rule and no stations`);
  return {
    id: l.id,
    label: l.label,
    bullet: l.bullet,
    color: l.color,
    bulletText: l.bulletText ?? '#FFFFFF',
    weight: l.weight,
    blurb: l.blurb,
    branchFrom: l.branchFrom ?? null,
    start,
    month: monthIndex(start),
  };
});
for (const l of resolvedLines) {
  if (!l.branchFrom) continue;
  const parent = resolvedLines.find((p) => p.id === l.branchFrom);
  if (!parent)
    throw new Error(`Line ${l.id}: unknown branchFrom ${l.branchFrom}`);
  if (parent.start > l.start) {
    throw new Error(`Line ${l.id} opens before its parent line ${parent.id}`);
  }
}

// ---------------------------------------------------------------- write

const data = {
  repoUrl: REPO_URL,
  head: {
    sha: headCommit.sha.slice(0, 8),
    date: headCommit.date.slice(0, 10),
    version: headVersion,
  },
  lines: resolvedLines,
  months,
  milestones,
  totals: { commits: commitDates.length, prs: prDates.length },
};

const header = `/**
 * AUTO-GENERATED from git history — do not edit by hand.
 * Regenerate: yarn data:repo-evolution   (config: scripts/repo-evolution/config.mjs)
 */

import type { RepoEvolutionData } from '@/lib/repo-evolution/types';

`;
let source = `${header}export const REPO_EVOLUTION: RepoEvolutionData = ${JSON.stringify(data, null, 2)};\n`;
try {
  // Prettier resolves config plugins relative to the cwd.
  process.chdir(appDir);
  const prettier = await import('prettier');
  const options = (await prettier.resolveConfig(OUT)) ?? {};
  source = await prettier.format(source, { ...options, filepath: OUT });
} catch (error) {
  console.warn(
    `repo-evolution: prettier unavailable (${error.message}); writing unformatted.`
  );
}
writeFileSync(OUT, source);

console.log(
  `repo-evolution: ${data.totals.commits} commits, ${data.totals.prs} PRs, ${monthKeys.length} months, ` +
    `${resolvedLines.length} lines, ${history.length} stations + ${planned.length} planned -> ${relative(appDir, OUT)}`
);
for (const m of milestones) {
  const when = m.date ?? `${m.source.path}:${m.source.line}`;
  console.log(
    `  ${m.kind.padEnd(8)} ${(m.line ?? '—').padEnd(11)} ${m.title.padEnd(36)} ${when} ${m.sha ?? ''}`
  );
}
