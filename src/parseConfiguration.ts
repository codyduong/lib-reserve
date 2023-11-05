import type { Run, RunConfiguration } from './getConfigurations';

export const parseTimeConfiguration = (
  configurationTime?: RunConfiguration['times'],
): undefined | Run['times'] => {
  if (!configurationTime) {
    return undefined;
  }
  if (Array.isArray(configurationTime)) {
    return configurationTime.map((time) => ({
      when: time.when,
      required: parseTimeSingular(time.required) ?? [],
      blacklist: parseTimeSingular(time.blacklist) ?? [],
      whitelist: parseTimeSingular(time.whitelist) ?? [],
    }));
  }

  return [
    {
      when: '24hr',
      required: parseTimeSingular(configurationTime.required) ?? [],
      blacklist: parseTimeSingular(configurationTime.blacklist) ?? [],
      whitelist: parseTimeSingular(configurationTime.whitelist) ?? [],
    },
  ];
};

export function parseTimeSingular(time?: undefined): undefined;
export function parseTimeSingular(
  time: number[] | `${number}-${number}` | `${number}` | number | '24hr',
): number[];
export function parseTimeSingular(
  time?:
    | number[]
    | `${number}-${number}`
    | `${number}`
    | number
    | undefined
    | '24hr',
): number[] | undefined;
export function parseTimeSingular(
  time?:
    | number[]
    | `${number}-${number}`
    | `${number}`
    | number
    | undefined
    | '24hr',
): number[] | undefined {
  if (time === undefined) {
    return undefined;
  }
  if (Array.isArray(time)) {
    return time;
  }
  if (typeof time === 'number') {
    return [time];
  }
  if (time === '24hr') {
    const result = [];
    for (let i = 0; i <= 47; i++) {
      result.push(i);
    }
    return result;
  }
  if (time.includes('-')) {
    const [start, end] = time.split('-').map((t) => Number(t));
    if (start > end) {
      return [];
    }
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }
  return [Number(time)];
}
