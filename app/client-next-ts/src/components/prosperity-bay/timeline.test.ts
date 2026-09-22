// @ts-nocheck
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import SGContent from './content';
import { PROSPERITY_BAY_MARKUP } from './markup';
import SGTimeline from './timeline';

const { chapters, sources, metaphor } = SGContent;
const { getState, advance, total, orders, payouts, totalCents, money } =
  SGTimeline;

describe('Prosperity Bay timeline', () => {
  it('uses six complete chapters for an exact three-minute loop', () => {
    expect(chapters).toHaveLength(6);
    expect(total).toBe(180);
    expect(advance(0, 0, 180)).toEqual({ chapter: 0, time: 0 });
    expect(advance(0, 0, 20)).toEqual({ chapter: 1, time: 0 });
    expect(advance(5, 34.5, 1)).toEqual({ chapter: 0, time: 0.5 });
    expect(advance(0, 0, 540)).toEqual({ chapter: 0, time: 0 });
    for (const chapter of chapters) {
      expect(chapter.steps[0].at).toBe(0);
      chapter.steps.forEach((step: { at: number }, index: number) => {
        expect(step.at).toBeLessThan(chapter.duration);
        if (index) expect(step.at).toBeGreaterThan(chapter.steps[index - 1].at);
        expect(
          step.narration && step.label && step.summary && step.detail
        ).toBeTruthy();
        step.refs.forEach((ref: string) => expect(sources[ref]).toBeTruthy());
      });
    }
  });

  it('recovers through REVIEW_IN_PROGRESS before approval and construction', () => {
    const states = [0, 5, 11, 17, 23, 29].map(
      (time) => getState(1, time).onboardingStatus
    );
    expect(states).toEqual([
      'NEW',
      'NEW',
      'REVIEW_IN_PROGRESS',
      'INFORMATION_REQUESTED',
      'REVIEW_IN_PROGRESS',
      'APPROVED',
    ]);
    for (let time = 0; time < 30.5; time += 0.25) {
      expect(getState(1, time).bakery).toBe(false);
    }
    expect(getState(1, 30.5).bakery).toBe(true);
    for (let time = 0; time < 35; time += 1) {
      expect(getState(1, time).account).toBe(false);
    }
  });

  it('keeps additional businesses out of earlier chapters, including jumps', () => {
    const ids = ['florist', 'coffee', 'books', 'gym'];
    for (let chapter = 0; chapter < 5; chapter += 1) {
      for (let time = 0; time < chapters[chapter].duration; time += 0.25) {
        for (const id of ids) {
          expect(getState(chapter, time).businesses[id]).toBe(false);
        }
      }
    }
    for (const id of ids) expect(getState(5, 5).businesses[id]).toBe(false);
    for (const id of ids) expect(getState(5, 10).businesses[id]).toBe(true);
    expect(getState(5, 11).newAccounts).toBe(false);
    expect(getState(5, 12).newAccounts).toBe(true);
    getState(5, 32);
    expect(getState(0, 0).bakery).toBe(false);
    expect(getState(1, 17).bakery).toBe(false);
  });

  it('keeps checkout, account funding, and payouts distinct and reconciled', () => {
    expect(getState(2, 24).balance).toBe(0);
    expect(getState(3, 20).checkoutTotal).toBe(8500);
    expect(getState(3, 20).balance).toBe(0);
    expect(getState(3, 32).balance).toBe(0);
    expect(getState(3, 33).balance).toBe(8500);
    expect(getState(4, 0).balance).toBe(8500);
    expect(getState(4, 6).balance).toBe(0);
    expect(getState(4, 6).inTransitCents).toBe(850000);
    expect(getState(4, 8).receivedCents).toBe(200000);
    expect(getState(4, 8).inTransitCents).toBe(650000);
    expect(getState(4, 22).receivedCents).toBe(550000);
    expect(getState(4, 22).inTransitCents).toBe(300000);
    expect(getState(4, 24).receivedCents).toBe(850000);
    expect(getState(4, 24).inTransitCents).toBe(0);
    expect(getState(3, 0).homebank).toBe(false);
    expect(getState(4, 0).homebank).toBe(true);
  });

  it('conserves every cent through the loop, event boundaries, and backward seeks', () => {
    expect(totalCents).toBe(850000);
    expect(
      payouts.reduce(
        (sum: number, payout: { cents: number }) => sum + payout.cents,
        0
      )
    ).toBe(totalCents);
    const check = (chapter: number, time: number) => {
      const state = getState(chapter, time);
      for (const key of [
        'checkoutCents',
        'fundedCents',
        'balanceCents',
        'debitedCents',
        'inTransitCents',
        'receivedCents',
      ]) {
        expect(Number.isSafeInteger(state[key]) && state[key] >= 0).toBe(true);
      }
      expect(state.fundedCents).toBe(
        state.balanceCents + state.inTransitCents + state.receivedCents
      );
      expect(state.debitedCents).toBe(
        state.inTransitCents + state.receivedCents
      );
      expect(state.fundedCents).toBeLessThanOrEqual(state.checkoutCents);
      expect(state.receivedCents).toBe(
        state.transfers
          .filter(
            (transfer: { status: string }) => transfer.status === 'received'
          )
          .reduce(
            (sum: number, transfer: { cents: number }) => sum + transfer.cents,
            0
          )
      );
      return state;
    };
    for (let chapter = 0; chapter < 6; chapter += 1) {
      for (let frame = 0; frame < chapters[chapter].duration * 60; frame += 1) {
        check(chapter, frame / 60);
      }
    }
    for (const chapter of [5, 4, 3, 2, 1, 0, 4, 3, 5, 0]) {
      for (let time = chapters[chapter].duration; time >= 0; time -= 0.25) {
        check(chapter, time);
      }
    }
    for (const order of orders) {
      expect(
        check(3, order.at).checkoutCents -
          check(3, order.at - 0.001).checkoutCents
      ).toBe(order.cents);
    }
    for (const payout of payouts) {
      expect(
        check(4, payout.arrive).receivedCents -
          check(4, payout.arrive - 0.001).receivedCents
      ).toBe(payout.cents);
    }
    expect(check(3, 32.999).fundedCents).toBe(0);
    expect(check(3, 33).fundedCents).toBe(totalCents);
    expect(check(4, 5.999).balanceCents).toBe(totalCents);
    expect(check(4, 6).balanceCents).toBe(0);
    expect(check(3, 29).checkoutCents).toBe(850000);
    expect(check(0, 0).receivedCents).toBe(0);
    expect(money(totalCents)).toBe('$8,500');
  });

  it('focuses cameras on the action and resets to the wide town', () => {
    expect(getState(1, 18).focus).toBe('hall');
    expect(getState(1, 31).focus).toBe('bakery');
    expect(getState(3, 18).focus).toBe('bakery');
    expect(getState(5, 18).focus).toBe('wide');
    expect(getState(5, 34.9).dusk).toBeGreaterThan(0.99);
    expect(getState(0, 0).dusk).toBe(1);
  });

  it('keeps every controller target in markup and official portal sources', () => {
    const app = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), 'app.ts'),
      'utf8'
    );
    const ids = [...PROSPERITY_BAY_MARKUP.matchAll(/\bid="([^"]+)"/g)].map(
      (match) => match[1]
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const match of app.matchAll(/\$\('([^']+)'\)/g)) {
      expect(ids).toContain(match[1]);
    }
    for (const source of Object.values(sources) as Array<{ url: string }>) {
      expect(new URL(source.url).hostname).toBe(
        'developer.payments.jpmorgan.com'
      );
    }
    expect(metaphor.length).toBeGreaterThanOrEqual(12);
  });
});
