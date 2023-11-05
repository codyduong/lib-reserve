export type TimeString = 'AM' | 'PM';

function calculateTime(
  time: `${number}:${number}${TimeString}` | string,
): number {
  // eslint-disable-next-line prefer-const
  let [hour, minute] = time
    .replace(/[^:\d]/g, '')
    .split(':')
    .map((n) => Number(n));
  const isAM = time.toUpperCase().includes('AM') ? true : false;

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

export default calculateTime;
