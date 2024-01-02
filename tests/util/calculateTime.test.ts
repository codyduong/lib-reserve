import { describe, expect, test } from 'bun:test';
import { calculateTime } from '../../src/util';

describe('calculateTime', () => {
  test('0-48 12HR format', () => {
    const TIMES = [
      '12:00AM',
      '12:30AM',
      '1:00AM',
      '1:30AM',
      '2:00AM',
      '2:30AM',
      '3:00AM',
      '3:30AM',
      '4:00AM',
      '4:30AM',
      '5:00AM',
      '5:30AM',
      '6:00AM',
      '6:30AM',
      '7:00AM',
      '7:30AM',
      '8:00AM',
      '8:30AM',
      '9:00AM',
      '9:30AM',
      '10:00AM',
      '10:30AM',
      '11:00AM',
      '11:30AM',
      '12:00PM',
      '12:30PM',
      '1:00PM',
      '1:30PM',
      '2:00PM',
      '2:30PM',
      '3:00PM',
      '3:30PM',
      '4:00PM',
      '4:30PM',
      '5:00PM',
      '5:30PM',
      '6:00PM',
      '6:30PM',
      '7:00PM',
      '7:30PM',
      '8:00PM',
      '8:30PM',
      '9:00PM',
      '9:30PM',
      '10:00PM',
      '10:30PM',
      '11:00PM',
      '11:59PM',
    ];

    const mapped = TIMES.map((time) => calculateTime(time));

    expect(mapped).toBeArray();
    expect(mapped).toBeArrayOfSize(48);
    expect(mapped).toStrictEqual(Array.from(Array(48).keys()));
  });

  test('no AM', () => {
    let error: TypeError = null!;
    try {
      calculateTime('00:00');
    } catch (e) {
      error = e as TypeError;
    } finally {
      expect(error).toBeInstanceOf(TypeError);
    }
  });

  test('no PM', () => {
    let error: TypeError = null!;
    try {
      calculateTime('13:00');
    } catch (e) {
      error = e as TypeError;
    } finally {
      expect(error).toBeInstanceOf(TypeError);
    }
  });

  test('invalid hour number', () => {
    let error: TypeError = null!;
    try {
      calculateTime('foobar:00AM');
    } catch (e) {
      error = e as TypeError;
    } finally {
      expect(error).toBeInstanceOf(TypeError);
    }
  });

  test('invalid minute number', () => {
    let error: TypeError = null!;
    try {
      calculateTime('12:foobarAM');
    } catch (e) {
      error = e as TypeError;
    } finally {
      expect(error).toBeInstanceOf(TypeError);
    }
  });

  test('hour out of bounds', () => {
    let error: TypeError = null!;
    try {
      calculateTime('13:00AM');
    } catch (e) {
      error = e as TypeError;
    } finally {
      expect(error).toBeInstanceOf(TypeError);
    }
  });

  test('minute out of bounds', () => {
    let error: TypeError = null!;
    try {
      calculateTime('00:23AM');
    } catch (e) {
      error = e as TypeError;
    } finally {
      expect(error).toBeInstanceOf(TypeError);
    }
  });
});
