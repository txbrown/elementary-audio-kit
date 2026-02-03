import { describe, it, expect } from 'vitest';
import {
  euclidean,
  euclideanRotated,
  euclideanFamily,
  EuclideanPresets,
} from './euclidean';
import { patternFromString, rotatePattern, invertPattern, combinePatterns } from './pattern';

describe('euclidean', () => {
  it('generates correct pattern for E(3,8) - tresillo', () => {
    const pattern = euclidean(3, 8);
    expect(pattern).toEqual([true, false, false, true, false, false, true, false]);
  });

  it('generates correct pattern for E(5,8) - cinquillo', () => {
    const pattern = euclidean(5, 8);
    expect(pattern).toEqual([true, false, true, true, false, true, true, false]);
  });

  it('generates correct pattern for E(4,16) - four on floor', () => {
    const pattern = euclidean(4, 16);
    // Should have exactly 4 hits evenly distributed
    expect(pattern.filter(Boolean).length).toBe(4);
    expect(pattern[0]).toBe(true);
    expect(pattern[4]).toBe(true);
    expect(pattern[8]).toBe(true);
    expect(pattern[12]).toBe(true);
  });

  it('handles edge case: hits = 0', () => {
    expect(euclidean(0, 8)).toEqual(Array(8).fill(false));
  });

  it('handles edge case: hits >= steps', () => {
    expect(euclidean(8, 8)).toEqual(Array(8).fill(true));
    expect(euclidean(10, 8)).toEqual(Array(8).fill(true));
  });

  it('handles edge case: steps = 0', () => {
    expect(euclidean(3, 0)).toEqual([]);
  });
});

describe('euclideanRotated', () => {
  it('rotates pattern correctly', () => {
    const original = euclidean(3, 8);
    const rotated = euclideanRotated(3, 8, 1);

    // Rotated by 1 should shift all elements right by 1
    expect(rotated[0]).toBe(original[7]);
    expect(rotated[1]).toBe(original[0]);
  });
});

describe('euclideanFamily', () => {
  it('generates multiple related patterns', () => {
    const family = euclideanFamily(8, [2, 3, 5]);

    expect(family.length).toBe(3);
    expect(family[0].filter(Boolean).length).toBe(2);
    expect(family[1].filter(Boolean).length).toBe(3);
    expect(family[2].filter(Boolean).length).toBe(5);
  });
});

describe('patternFromString', () => {
  it('parses x notation', () => {
    expect(patternFromString('x-x-')).toEqual([true, false, true, false]);
  });

  it('parses X notation (uppercase)', () => {
    expect(patternFromString('X-X-')).toEqual([true, false, true, false]);
  });

  it('parses 1/0 notation', () => {
    expect(patternFromString('1010')).toEqual([true, false, true, false]);
  });
});

describe('rotatePattern', () => {
  it('rotates right with positive steps', () => {
    expect(rotatePattern([1, 2, 3, 4], 1)).toEqual([4, 1, 2, 3]);
  });

  it('rotates left with negative steps', () => {
    expect(rotatePattern([1, 2, 3, 4], -1)).toEqual([2, 3, 4, 1]);
  });

  it('handles rotation larger than length', () => {
    expect(rotatePattern([1, 2, 3, 4], 5)).toEqual([4, 1, 2, 3]); // same as 1
  });

  it('handles empty array', () => {
    expect(rotatePattern([], 3)).toEqual([]);
  });
});

describe('invertPattern', () => {
  it('inverts boolean pattern', () => {
    expect(invertPattern([true, false, true])).toEqual([false, true, false]);
  });
});

describe('combinePatterns', () => {
  it('combines with OR logic', () => {
    const p1 = [true, false, false, false];
    const p2 = [false, false, true, false];
    expect(combinePatterns(p1, p2)).toEqual([true, false, true, false]);
  });

  it('handles different lengths (wraps shorter)', () => {
    const p1 = [true, false];
    const p2 = [false, false, true, true];
    // p1 wraps: [true, false, true, false]
    // combined: [true, false, true, true]
    expect(combinePatterns(p1, p2)).toEqual([true, false, true, true]);
  });
});

describe('EuclideanPresets', () => {
  it('tresillo preset matches E(3,8)', () => {
    const { hits, steps } = EuclideanPresets.tresillo;
    expect(euclidean(hits, steps).filter(Boolean).length).toBe(3);
  });
});
