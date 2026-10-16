import atlasMarkdown from '@ef-docs/UX_ATLAS.md?raw';
import { describe, expect, it } from 'vitest';

import {
  allAtlasResources,
  ATLAS_STAGES,
  countAnswered,
  parseAnswers,
  PROFILE_QUESTIONS,
  resolveFocus,
  selectAtlas,
  serializeAnswers,
  SHOWCASE_ORIGIN,
  toAppHref,
  toMarkdown,
  type Answers,
} from './atlas';

const allNo: Answers = Object.fromEntries(
  PROFILE_QUESTIONS.map((q) => [q.id, 'no'])
);

describe('atlas data', () => {
  it('keeps every URL in sync with UX_ATLAS.md', () => {
    const missing = [...new Set(allAtlasResources().map((r) => r.url))].filter(
      (url) => !atlasMarkdown.includes(url)
    );
    expect(missing).toEqual([]);
  });

  it('uses unique stage and question IDs', () => {
    const ids = [
      ...ATLAS_STAGES.map((s) => s.id),
      ...PROFILE_QUESTIONS.map((q) => q.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every module something to build and something to read', () => {
    for (const q of PROFILE_QUESTIONS) {
      if (q.type !== 'module') continue;
      expect(q.build.length, q.id).toBeGreaterThan(0);
      expect(q.resources.length, q.id).toBeGreaterThan(0);
    }
  });

  it('gates stages only with gate questions that point back at them', () => {
    for (const stage of ATLAS_STAGES) {
      if (!stage.gate) continue;
      const gate = PROFILE_QUESTIONS.find((q) => q.id === stage.gate);
      expect(gate?.type).toBe('gate');
      expect(gate?.stageId).toBe(stage.id);
    }
  });
});

describe('parseAnswers / serializeAnswers', () => {
  it('round-trips answers through the URL shape', () => {
    const answers: Answers = { a: 'yes', c: 'yes', d: 'unsure', g: 'no' };
    const search = serializeAnswers(answers);
    expect(search).toEqual({ yes: 'a,c', unsure: 'd', no: 'g' });
    expect(parseAnswers(search)).toEqual(answers);
  });

  it('ignores unknown IDs and keeps the first answer for duplicates', () => {
    expect(parseAnswers({ yes: 'A, z, b', no: 'b,h', unsure: '' })).toEqual({
      a: 'yes',
      b: 'yes',
      h: 'no',
    });
  });

  it('counts answered questions', () => {
    expect(countAnswered({})).toBe(0);
    expect(countAnswered({ a: 'no', b: 'unsure' })).toBe(2);
  });
});

describe('selectAtlas', () => {
  it('shows only baseline work when every answer is no', () => {
    const selection = selectAtlas(allNo);
    expect(selection.every((s) => s.modules.length === 0)).toBe(true);
    expect(selection.filter((s) => !s.inScope).map((s) => s.stage.id)).toEqual([
      'link-account',
      'after-approval',
    ]);
  });

  it('adds a module for yes and for not sure, but not for no', () => {
    const collect = selectAtlas({ a: 'yes', b: 'unsure', c: 'no' }).find(
      (s) => s.stage.id === 'collect'
    );
    expect(collect?.modules.map((m) => [m.module.id, m.answer])).toEqual([
      ['a', 'yes'],
      ['b', 'unsure'],
    ]);
  });

  it('keeps gated stages in scope until answered no', () => {
    const linkStage = (answers: Answers) =>
      selectAtlas(answers).find((s) => s.stage.id === 'link-account');
    expect(linkStage({})?.inScope).toBe(true);
    expect(linkStage({ g: 'unsure' })?.inScope).toBe(true);
    expect(linkStage({ g: 'no' })?.inScope).toBe(false);
  });
});

describe('toMarkdown', () => {
  it('lists the profile, included modules, and in-scope stages', () => {
    const md = toMarkdown(
      { a: 'yes', d: 'unsure', b: 'no', h: 'no' },
      { shareUrl: 'https://example.test/ux-atlas?yes=a' }
    );

    expect(md).toContain('Interactive version: https://example.test/ux-atlas');
    expect(md).toContain('**A. Do you onboard sole proprietorships?** Yes.');
    expect(md).toContain(
      'Not sure. Confirm with your J.P. Morgan representative.'
    );
    expect(md).toContain('**E. Do you onboard nonprofits');
    expect(md).toContain('Not answered.');
    expect(md).toContain('### A. Sole proprietorships');
    expect(md).toContain('### D. Indirect ownership (not sure yet)');
    expect(md).not.toContain('### B. Publicly traded companies');
    expect(md).toContain('## Stage 4: Link a bank account');
    expect(md).toContain('Decide first:');
    expect(md).not.toContain('## Stage 5: After approval');
    expect(md).toMatch(/- Guide: \[Get started\]\(https:\/\/developer\./);
  });
});

describe('resolveFocus', () => {
  it('resolves stages and modules, and falls back to Stage 0', () => {
    expect(resolveFocus('collect')).toMatchObject({
      type: 'stage',
      stage: { id: 'collect' },
    });
    expect(resolveFocus('C')).toMatchObject({
      type: 'module',
      module: { id: 'c' },
    });
    expect(resolveFocus('g')).toMatchObject({
      type: 'stage',
      stage: { id: 'link-account' },
    });
    expect(resolveFocus('nope')).toMatchObject({
      type: 'stage',
      stage: { id: 'prepare' },
    });
    expect(resolveFocus(undefined)).toMatchObject({ stage: { id: 'prepare' } });
  });
});

describe('toAppHref', () => {
  it('turns showcase links into in-app paths and leaves others alone', () => {
    expect(toAppHref(`${SHOWCASE_ORIGIN}/webhook-explorer`)).toBe(
      '/webhook-explorer'
    );
    expect(toAppHref('https://developer.payments.jpmorgan.com/docs')).toBe(
      'https://developer.payments.jpmorgan.com/docs'
    );
  });
});
