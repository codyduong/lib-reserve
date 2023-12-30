import { describe, expect, test } from 'bun:test';
import { parseTimeSingular } from '../src/parseConfiguration';

describe('parseTimeSingular', () => {
  test('24hr', () => {
    const hrs = parseTimeSingular('24hr');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(48);
    expect(hrs).toStrictEqual(Array.from({ length: 48 }, (_, index) => index));
  });

  test('simple range #1', () => {
    const hrs = parseTimeSingular('12-23');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(12);
    expect(hrs).toStrictEqual(
      Array.from({ length: 12 }, (_, index) => index + 12),
    );
  });

  test('simple range #2', () => {
    const hrs = parseTimeSingular('24-33');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(10);
    expect(hrs).toStrictEqual([24, 25, 26, 27, 28, 29, 30, 31, 32, 33]);
  });

  test('overlapping ranges', () => {
    const hrs = parseTimeSingular('4-9 7-12');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(9);
    expect(hrs).toStrictEqual(
      Array.from({ length: 9 }, (_, index) => index + 4),
    );
  });

  test('split ranges #1', () => {
    const hrs = parseTimeSingular('3-5 16-23');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(11);
    expect(hrs).toStrictEqual([3, 4, 5, 16, 17, 18, 19, 20, 21, 22, 23]);
  });

  test('split ranges #2', () => {
    const hrs = parseTimeSingular('0-7 12-35');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(32);
    expect(hrs).toStrictEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ]);
  });

  test('split ranges #3', () => {
    const hrs = parseTimeSingular('0-7 12-33');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(30);
    expect(hrs).toStrictEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
    ]);
  });

  test('range start greater than range end', () => {
    const hrs = parseTimeSingular('47-0');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(0);
    expect(hrs).toStrictEqual([]);
  });

  test('ranges and numbers', () => {
    const hrs = parseTimeSingular('0-7 12-33 36 39');
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(32);
    expect(hrs).toStrictEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 36, 39,
    ]);
  });

  test('undefined', () => {
    const hrs = parseTimeSingular(undefined);
    expect(hrs).toBeUndefined();
  });

  test('simple number', () => {
    const hrs = parseTimeSingular(1);
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(1);
    expect(hrs).toStrictEqual([1]);
  });

  test('remove duplicates', () => {
    const hrs = parseTimeSingular([
      1, 1, 1, 1, 2, 3, 4, 5, 5, 6, 7, 7, 10, 11, 11, 12, 12,
    ]);
    expect(hrs).toBeArray();
    expect(hrs).toBeArrayOfSize(10);
    expect(hrs).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 10, 11, 12]);
  });
});
