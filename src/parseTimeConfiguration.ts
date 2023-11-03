import type { RunConfiguration } from './getConfigurations';

export const parseTimeConfiguration = (
  configurationTime?: RunConfiguration['times'],
):
  | undefined
  | {
      required?: number[];
      blacklist?: number[];
      whitelist?: number[];
    } => {
  if (!configurationTime) {
    return undefined;
  }
  return {
    required: parseTimeSingular(configurationTime.required),
    blacklist: parseTimeSingular(configurationTime.blacklist),
    whitelist: parseTimeSingular(configurationTime.whitelist),
  };
};

export function parseTimeSingular(
  time?: number[] | `${number}-${number}` | `${number}` | number | undefined,
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
