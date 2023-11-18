export type TimeString = 'AM' | 'PM';

const VALID_MINUTES = [0, 30, 59];

export function calculateTime(
  time: `${number}:${number}${TimeString}` | string,
): number {
  if (
    !time.toUpperCase().includes('AM') &&
    !time.toUpperCase().includes('PM')
  ) {
    console.log(time);
    console.log(!time.toUpperCase().includes('AM'));
    console.log(!time.toUpperCase().includes('PM'));
    throw TypeError(
      'Expected AM or PM in the time string, 24hr strings are not supported',
    );
  }

  // eslint-disable-next-line prefer-const
  let [hour, minute] = time
    .replace(/[^:\d]/g, '')
    .split(':')
    .map((n) => (n !== '' ? Number(n) : NaN));
  const isAM = time.toUpperCase().includes('AM') ? true : false;

  if (Number.isNaN(hour)) {
    throw TypeError('Failed to parse hour');
  }
  if (Number.isNaN(minute)) {
    throw TypeError('Failed to parse minutes');
  }
  if (hour > 12) {
    throw TypeError(
      'Hour out of bounds, expected value between 0-12 inclusive',
    );
  }
  if (!VALID_MINUTES.includes(minute)) {
    throw TypeError('Minute out of bounds, expected one of [0, 30, 59]');
  }

  // just have a special case for 11:59
  if (time == '11:59PM') {
    return 47;
  }

  if (hour == 12) {
    hour -= 12;
  }

  if (!isAM) {
    hour += 12;
  }

  const finalTime = hour * 2 + Math.floor(minute / 30);

  return finalTime;
}
