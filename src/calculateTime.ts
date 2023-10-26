export type TimeString = 'AM' | 'PM';

function calculateTime(time: `${number}:${number}${TimeString}` | string) {
  let time2 = Number(
    time
      .replace(':', '.')
      .replace('30', '5')
      .replace('11.59', '12')
      .replace(/[^.\d]/g, ''),
  );
  return (time2 =
    (time2 >= 12 && time.includes('AM') ? time2 - 12 : time2) * 2 +
    (time.includes('PM') ? 24 : 0));
}

export default calculateTime;
