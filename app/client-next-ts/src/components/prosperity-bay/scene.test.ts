// @ts-nocheck
import { describe, expect, it } from 'vitest';

import SGContent from './content';
import SGScene from './scene';
import SGTimeline from './timeline';

type SceneNode = {
  tag: string;
  attrs: Record<string, string>;
  children: SceneNode[];
  style: Record<string, string>;
  setAttribute: (key: string, value: string) => void;
  querySelector: (selector: string) => SceneNode | undefined;
  getTotalLength: () => number;
  points: () => Array<{ x: number; y: number }>;
  getPointAtLength: (distance: number) => { x: number; y: number };
};

// A deliberately small SVG host checks the actual drawing and all time-dependent actors.
// It is not a browser/layout simulation. Path length uses the scene's real line geometry.
function host() {
  const nodes = new Map<string, SceneNode>();
  const make = (
    tag: string,
    attrs: Record<string, string> = {}
  ): SceneNode => ({
    tag,
    attrs,
    children: [],
    style: {},
    setAttribute(key, value) {
      expect(String(value)).not.toMatch(/NaN|undefined/);
      this.attrs[key] = String(value);
    },
    querySelector(selector) {
      if (selector.startsWith('#')) {
        const [id, child] = selector.slice(1).split('>');
        const node = nodes.get(id);
        return child ? node?.children.find((item) => item.tag === child) : node;
      }
      return this.children.find((item) => item.tag === selector);
    },
    getTotalLength() {
      const points = this.points();
      return points
        .slice(1)
        .reduce(
          (sum, point, index) =>
            sum +
            Math.hypot(point.x - points[index].x, point.y - points[index].y),
          0
        );
    },
    points() {
      return [
        ...(this.attrs.d || '').matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g),
      ].map((match) => ({ x: +match[1], y: +match[2] }));
    },
    getPointAtLength(distance) {
      const points = this.points();
      for (let index = 1; index < points.length; index += 1) {
        const length = Math.hypot(
          points[index].x - points[index - 1].x,
          points[index].y - points[index - 1].y
        );
        if (distance <= length) {
          const fraction = length ? distance / length : 0;
          return {
            x:
              points[index - 1].x +
              (points[index].x - points[index - 1].x) * fraction,
            y:
              points[index - 1].y +
              (points[index].y - points[index - 1].y) * fraction,
          };
        }
        distance -= length;
      }
      return points.at(-1) as { x: number; y: number };
    },
  });
  const svg = make('svg') as SceneNode & {
    insertAdjacentHTML: (position: string, markup: string) => void;
  };
  svg.insertAdjacentHTML = (_position, markup) => {
    expect(markup).not.toMatch(/NaN|undefined/);
    const stack = [svg];
    for (const token of markup.matchAll(/<\/?[\w-]+\b[^>]*>/g)) {
      const raw = token[0];
      if (raw.startsWith('</')) {
        stack.pop();
        continue;
      }
      const tag = raw.match(/^<([\w-]+)/)?.[1] as string;
      const attrs = Object.fromEntries(
        [...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [
          match[1],
          match[2],
        ])
      );
      const node = make(tag, attrs);
      if (attrs.id) {
        expect(nodes.has(attrs.id)).toBe(false);
        nodes.set(attrs.id, node);
      }
      stack.at(-1)?.children.push(node);
      if (!raw.endsWith('/>')) stack.push(node);
    }
  };
  return { scene: SGScene.create(svg), nodes };
}

describe('Prosperity Bay scene', () => {
  it('renders every beat with finite geometry in standard and reduced motion', () => {
    const { scene } = host();
    for (const reduced of [false, true]) {
      for (let chapter = 0; chapter < 6; chapter += 1) {
        for (
          let time = 0;
          time < SGContent.chapters[chapter].duration;
          time += 0.25
        ) {
          scene.draw(SGTimeline.getState(chapter, time), reduced);
        }
      }
    }
  });

  it('keeps checkout walkers clear of the vault, counter, and hosted stall', () => {
    const { scene, nodes } = host();
    const polygons = (node: SceneNode): number[][][] => [
      ...(node.tag === 'polygon'
        ? [
            node.attrs.points
              .split(' ')
              .map((pair) => pair.split(',').map(Number)),
          ]
        : []),
      ...node.children.flatMap(polygons),
    ];
    const overlaps = (first: number[][], second: number[][]) =>
      [first, second].every((shape) =>
        shape.every((point, index) => {
          const next = shape[(index + 1) % shape.length];
          const axis = [point[1] - next[1], next[0] - point[0]];
          const project = (poly: number[][]) =>
            poly.map((vertex) => vertex[0] * axis[0] + vertex[1] * axis[1]);
          const firstProjection = project(first);
          const secondProjection = project(second);
          return (
            Math.min(...firstProjection) < Math.max(...secondProjection) &&
            Math.min(...secondProjection) < Math.max(...firstProjection)
          );
        })
      );
    for (const reduced of [false, true]) {
      for (let frame = 0; frame < 30 * 60; frame += 1) {
        const time = frame / 60;
        scene.draw(SGTimeline.getState(3, time), reduced);
        const walker = nodes.get('checkout-customer');
        if (!walker || walker.style.display === 'none') continue;
        const [x, y] = walker.attrs.transform.match(/-?[\d.]+/g)!.map(Number);
        const body = [
          [x - 10, y - 43],
          [x + 10, y - 43],
          [x + 10, y + 7],
          [x - 10, y + 7],
        ];
        for (const id of ['vault', 'checkout-counter', 'hosted-stall']) {
          const fixture = nodes.get(id);
          if (!fixture || fixture.style.display === 'none') continue;
          for (const face of polygons(fixture)) {
            expect(overlaps(body, face)).toBe(false);
          }
        }
      }
    }
  });

  it('hides businesses before approval and when seeking backward', () => {
    const { scene, nodes } = host();
    scene.draw(SGTimeline.getState(5, 26), false);
    expect(nodes.get('building-florist')?.style.display).toBe('');
    expect(nodes.get('new-shop-vaults')?.style.display).toBe('');
    scene.draw(SGTimeline.getState(1, 17), false);
    expect(nodes.get('building-bakery')?.style.display).toBe('none');
    expect(nodes.get('building-coffee')?.style.display).toBe('none');
    expect(nodes.get('new-shop-vaults')?.style.display).toBe('none');
    expect(nodes.get('city-bell')?.style.display).toBe('none');
    expect(nodes.get('missing-document')?.style.display).toBe('');
    expect(nodes.get('approval-seal')?.style.display).toBe('none');
    scene.draw(SGTimeline.getState(1, 23), false);
    expect(nodes.get('review-lens')?.style.display).toBe('');
    expect(nodes.get('missing-document')?.style.display).toBe('none');
    scene.draw(SGTimeline.getState(1, 31), false);
    expect(nodes.get('building-bakery')?.style.display).toBe('');
    scene.draw(SGTimeline.getState(0, 0), true);
    expect(nodes.get('vault')?.style.display).toBe('none');
    expect(nodes.get('town-visitors')?.style.display).toBe('none');
  });

  it('keeps express and wire vehicles from intersecting at departure', () => {
    const { scene, nodes } = host();
    for (let frame = 360; frame < 480; frame += 1) {
      scene.draw(SGTimeline.getState(4, frame / 60), false);
      const [x, y] = nodes
        .get('express-vehicle')
        ?.attrs.transform.match(/-?[\d.]+/g)!
        .map(Number) as number[];
      const [u, v] = nodes
        .get('wire-courier')
        ?.attrs.transform.match(/-?[\d.]+/g)!
        .map(Number) as number[];
      const hit =
        x - 31 < u + 33 && x + 31 > u - 23 && y - 20 < v + 10 && y + 4 > v - 23;
      expect(hit).toBe(false);
    }
  });
});
