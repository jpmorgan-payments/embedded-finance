#!/usr/bin/env node

/**
 * prepare-release.mjs
 *
 * Automates version bump + CHANGELOG update for embedded-components.
 *
 * Usage:
 *   node scripts/prepare-release.mjs [patch|minor|major]
 *   yarn release [patch|minor|major]
 *
 * What it does:
 *   1. Determines the new version (defaults to patch bump)
 *   2. Collects conventional commits since the last tag (scoped to embedded-components/)
 *   3. Generates a CHANGELOG entry with grouped changes
 *   4. Bumps version in package.json
 *   5. Stages the changes and creates a release commit
 *
 * After running, just push to main and the tag-release workflow handles tagging.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(ROOT, '..');

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', cwd: REPO_ROOT, ...opts }).trim();
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function getLastReleaseRef() {
  // Strategy 1: Use the most recent git tag
  try {
    const tag = run('git describe --tags --abbrev=0');
    if (tag) return tag;
  } catch {
    // No tags exist
  }

  // Strategy 2: Find the most recent "chore(release):" commit
  try {
    const ref = run(
      `git log -1 --pretty=format:"%H" --grep="^chore(release):" -- embedded-components/`
    );
    if (ref) return ref;
  } catch {
    // No release commits found
  }

  // Strategy 3: Parse the date from the last CHANGELOG entry
  try {
    const changelog = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf-8');
    const dateMatch = changelog.match(
      /## \[\d+\.\d+\.\d+\] - (\d{4}-\d{2}-\d{2})/
    );
    if (dateMatch) {
      const lastReleaseDate = dateMatch[1];
      const ref = run(
        `git log -1 --pretty=format:"%H" --until="${lastReleaseDate}T23:59:59" -- embedded-components/`
      );
      if (ref) return ref;
    }
  } catch {
    // CHANGELOG parsing failed
  }

  // Strategy 4: Use 4 weeks ago as a reasonable window
  return run('git rev-list -1 --before="4 weeks ago" HEAD');
}

function getConventionalCommits(since) {
  const raw = run(
    `git log ${since}..HEAD --pretty=format:"%s" -- embedded-components/`
  );
  if (!raw) return [];
  return raw.split('\n').filter(Boolean);
}

function categorizeCommits(commits) {
  const categories = {
    feat: { label: 'Features', items: [] },
    fix: { label: 'Bug Fixes', items: [] },
    refactor: { label: 'Refactors', items: [] },
    perf: { label: 'Performance', items: [] },
    docs: { label: 'Documentation', items: [] },
    chore: { label: 'Chores', items: [] },
    build: { label: 'Build', items: [] },
    test: { label: 'Tests', items: [] },
  };

  const conventionalRegex = /^(\w+)(?:\(([^)]*)\))?!?:\s*(.+)$/;

  for (const msg of commits) {
    const match = msg.match(conventionalRegex);
    if (match) {
      const [, type, scope, description] = match;
      const key = type.toLowerCase();
      const target = categories[key] || categories.chore;
      const prefix = scope ? `**${scope}:** ` : '';
      target.items.push(`${prefix}${description}`);
    }
  }

  return categories;
}

function generateChangelog(version, categories) {
  const date = new Date().toISOString().split('T')[0];
  let entry = `## [${version}] - ${date}\n\n### Changes\n\n`;

  for (const cat of Object.values(categories)) {
    if (cat.items.length === 0) continue;
    entry += `#### ${cat.label}\n\n`;
    for (const item of cat.items) {
      entry += `- ${item}\n`;
    }
    entry += '\n';
  }

  return entry;
}

// --- Main ---

const bumpType = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('Usage: node scripts/prepare-release.mjs [patch|minor|major]');
  process.exit(1);
}

// Read current version
const pkgPath = resolve(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const currentVersion = pkg.version;
const newVersion = bumpVersion(currentVersion, bumpType);

console.log(`Bumping ${currentVersion} → ${newVersion} (${bumpType})`);

// Collect commits
const lastRef = getLastReleaseRef();
console.log(`Collecting commits since: ${lastRef.slice(0, 10)}...`);
const commits = getConventionalCommits(lastRef);

if (commits.length === 0) {
  console.log(
    'No conventional commits found since last release. Proceeding with empty changelog entry.'
  );
}

// Generate changelog entry
const categories = categorizeCommits(commits);
const changelogEntry = generateChangelog(newVersion, categories);

// Update package.json
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated package.json to ${newVersion}`);

// Update CHANGELOG.md
const changelogPath = resolve(ROOT, 'CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf-8');
const insertPoint = changelog.indexOf('\n## [');
if (insertPoint === -1) {
  // No existing entries, append after header
  const headerEnd = changelog.indexOf('\n\n') + 2;
  const updated =
    changelog.slice(0, headerEnd) + changelogEntry + changelog.slice(headerEnd);
  writeFileSync(changelogPath, updated);
} else {
  const updated =
    changelog.slice(0, insertPoint + 1) +
    changelogEntry +
    changelog.slice(insertPoint + 1);
  writeFileSync(changelogPath, updated);
}
console.log('Updated CHANGELOG.md');

// Stage and commit
run('git add package.json CHANGELOG.md', { cwd: ROOT });
run(`git commit -m "chore(release): v${newVersion}"`, { cwd: ROOT });
console.log(`\nCreated commit: chore(release): v${newVersion}`);
console.log(
  'Push to main and the tag-release workflow will create the git tag automatically.'
);
