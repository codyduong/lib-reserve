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

type Stringable = string | number | bigint | boolean | null | undefined;

type Join<A, Sep extends string = ''> = A extends [infer First, ...infer Rest]
  ? Rest extends []
    ? `${First & Stringable}`
    : `${First & Stringable}${Sep}${Join<Rest, Sep>}`
  : '';

type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

export type TimeConfigurationRange = `${number}-${number}`;

export type TimeConfigurationValueBase =
  | TimeConfigurationRange
  | `${number}`
  | number;

export type TimeConfigurationValue =
  | TimeConfigurationValueBase
  | Join<Tuple<TimeConfigurationValueBase, 2>, ` `>
  | Join<Tuple<TimeConfigurationValueBase, 3>, ` `>
  | `${Join<Tuple<TimeConfigurationValueBase, 3>, ` `>} ${string}`
  | number[]
  | '24hr';

export function parseTimeSingular(time?: undefined): undefined;
export function parseTimeSingular(time: TimeConfigurationValue): number[];
export function parseTimeSingular(
  time?: TimeConfigurationValue | undefined,
): number[] | undefined;
export function parseTimeSingular(
  time?: TimeConfigurationValue | undefined,
): number[] | undefined {
  if (time === undefined) {
    return undefined;
  }
  if (Array.isArray(time)) {
    return time.reduce<number[]>((accumulator, currentValue) => {
      if (!accumulator.includes(currentValue)) {
        accumulator.push(currentValue);
      }
      return accumulator;
    }, []);
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
  const times = time
    .split(' ')
    .map((t) => {
      if (t.includes('-')) {
        const [start, end] = t.split('-').map((t) => Number(t));
        if (start > end) {
          return [];
        }
        const result = [];
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
        return result;
      }
      const numberTime = Number(t);
      if (!Number.isNaN(numberTime)) {
        return numberTime;
      }
      throw new Error(`Unparseable time: ${t}`);
    })
    .flat()
    .reduce<number[]>((accumulator, currentValue) => {
      if (!accumulator.includes(currentValue)) {
        accumulator.push(currentValue);
      }
      return accumulator;
    }, []);

  return times;
}
