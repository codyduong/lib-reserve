import { Temporal } from '@js-temporal/polyfill';
import {
  parseTimeConfiguration,
  parseTimeSingular,
} from './parseConfiguration';

export type TimesValue = {
  /**
   * 48 thirty minute segments of the day, indiced at 0. IE 12:00-12:30 is 24
   * @TJS-examples ["24-48", "24", 24, [24, 25, 26]]
   */
  required?: number[] | `${number}-${number}` | `${number}` | number;
  /**
   * 48 thirty minute segments of the day, indiced at 0. IE 12:00-12:30 is 24
   * @TJS-examples ["24-48", "24", 24, [24, 25, 26]]
   */
  blacklist?: number[] | `${number}-${number}` | `${number}` | number;
  /**
   * 48 thirty minute segments of the day, indiced at 0. IE 12:00-12:30 is 24
   * @TJS-examples ["24-48", "24", 24, [24, 25, 26]]
   */
  whitelist?: number[] | `${number}-${number}` | `${number}` | number;
};

export type TimeCustom = {
  /**
   * 48 thirty minute segments of the day, indiced at 0. IE 12:00-12:30 is 24.
   * Or a custom indicator string ("24hr")
   * @TJS-examples ["24-48", "24", 24, [24, 25, 26]]
   * @default "24hr"
   */
  when?: '24hr' | 'else' | `${number}-${number}`;
  $comment?: string;
} & TimesValue;

export type RunConfiguration = {
  $comment?: string;
  /**
   * @default https://calendar.lib.ku.edu/r/accessible/availability?lid=17465&zone=0&gid=36998&capacity=2&space=0
   * @TJS-format uri3
   */
  url?: string;
  debug?: boolean;
  dryRun?: boolean;
  disabled?: boolean;
  blacklist?: string[];
  /**
   * @minimum 0
   * @default 1
   */
  amount?: number;
  continuity?: {
    base?: number;
    /**
     * @minimum 0
     * @default 8
     * @TJS-format integer
     */
    multiplerMax?: number;
    /**
     * @minimum 0
     * @default 0
     */
    min?: number;
    /**
     * @minimum 0
     * @default 0
     */
    max?: number;
  };
  capacity?: {
    base?: number;
    /**
     * @minimum 0
     * @default 0
     * @TJS-format integer
     */
    min?: number;
    /**
     * @minimum 0
     * @default 0
     * @TJS-format integer
     */
    max?: number;
  };
  times?: TimesValue | TimeCustom[];
  /**
   * ISO 8601 day number. 1 is Monday, and Sunday 7.
   * @default "1-7"
   */
  runOn?: `${number}-${number}` | number[] | number;
};

export type ConfigurationBase = {
  /**
   * @default ./schema.json
   */
  $schema: string;
  /**
   * @default https://calendar.lib.ku.edu/ajax/space/times
   * @TJS-format uri
   */
  urlTime: string;
  /**
   * @default https://calendar.lib.ku.edu/ajax/space/session/end
   * @TJS-format uri
   */
  urlEnd: string;
  /**
   * @default https://calendar.lib.ku.edu/ajax/space/book
   * @TJS-format uri
   */
  urlBook: string;
  /**
   * @default https://calendar.lib.ku.edu/widget/hours/grid?iid=647&format=json&weeks=2&systemTime=1&lid=19335
   * @TJS-format uri
   */
  urlHours: string;
  urlHoursInstruction: {
    /**
     * This is the lid for the location we want the hours of. Take note that this lid is different than that of the url lid
     * @default 19335
     * @TJS-format integer
     */
    lid: 19335;
  };
  urlHoursHeader: {
    /**
     * @default https://lib.ku.edu/
     * @TJS-format uri
     */
    referer: string;
  };
  users: {
    fname: string;
    lname: string;
    /**
     * Must end in respective .edu ending, ie. ku.edu for ku libraries
     * @TJS-format email
     */
    email: string;
  }[];
  rooms?: RunConfiguration[];
  /**
   * @TJS-format uri
   */
  webhook?: string | null;
  ping?: string[] | null;
  /**
   * Days to reserve in the future
   * @default 7
   * @minimum 0
   */
  days?: number | null;
} & RunConfiguration;

export type Run = {
  lid: string;
  debug: boolean;
  dryRun: boolean;
  url: string;
  urlTime: string;
  urlBook: string;
  times: {
    when: TimeCustom['when'];
    required: number[];
    blacklist: number[];
    whitelist: number[];
  }[];
  continuity: RunConfiguration['continuity'];
  capacity: RunConfiguration['capacity'];
  blacklist: string[];
  disabled: boolean;
  amount: number;
  runOn: number[];
};

export type Runs = Run[];

export type Configurations = [ConfigurationBase, Runs, Temporal.PlainDate];

async function getConfiguration(
  options: {
    dry: boolean;
    filepath: string | URL;
  },
  override?: ConfigurationBase,
): Promise<Configurations> {
  const { dry, filepath: configuration_location = './configuration.json' } =
    options;

  const configurationBase = JSON.parse(
    await Bun.file(configuration_location, { type: 'application/json' }).text(),
  ) as ConfigurationBase;

  const configuration = {
    // Note the shallow merge
    ...configurationBase,
    ...override,
  };

  // Catch any configuration errors, either expect the url specified at the base or in every room configuration
  if (!configuration.url && !configuration.rooms?.every((room) => room.url)) {
    throw TypeError(
      'Expected configuration to either contain a url for the base configuraton or for each unique room run configuration',
    );
  }

  const { days = 7 } = configuration;
  const date = Temporal.Now.zonedDateTimeISO('America/Chicago')
    .toPlainDate()
    .add(Temporal.Duration.from(`P${days}D`));
  const dateString = date.toString();

  const runs: Runs = [];
  const rooms = override?.rooms ?? configuration.rooms;

  if (rooms && rooms.length > 0) {
    rooms.forEach((room) => {
      const url = room.url ?? configuration.url!;

      const lid = new URLSearchParams(configuration.url).get(
        url.split('=')[0],
      )!;

      const roomTimes = parseTimeConfiguration(room.times) ?? [];
      const configTimes = parseTimeConfiguration(configuration.times) ?? [];

      // merge together if 'when' key is the same
      const mergedTimes = [...roomTimes, ...configTimes]
        .reduce<
          {
            when: TimeCustom['when'];
            required: undefined | number[];
            whitelist: undefined | number[];
            blacklist: undefined | number[];
          }[]
        >(
          (prev, time) => {
            const prevIndex = prev.findIndex((item) => item.when == time.when);
            const dupl = [...prev];
            if (prevIndex != -1) {
              dupl[prevIndex] = {
                when: prev[prevIndex]?.when,
                required: prev[prevIndex]?.required ?? time.required,
                whitelist: prev[prevIndex]?.whitelist ?? time.whitelist,
                blacklist: prev[prevIndex]?.blacklist ?? time.blacklist,
              };

              return [
                ...dupl.slice(0, prevIndex + 1),
                ...dupl
                  .slice(prevIndex + 1)
                  .filter(({ when }) => when !== dupl[prevIndex]?.when),
              ];
            }

            return [...dupl, time];
          },
          [
            {
              when: '24hr',
              required: undefined,
              whitelist: undefined,
              blacklist: undefined,
            },
          ],
        )
        .map(({ when, required, whitelist, blacklist }) => ({
          when: when,
          required: required ?? [],
          whitelist: whitelist ?? [],
          blacklist: blacklist ?? [],
        }));

      runs.push({
        // Configuration pushdown
        lid,
        urlTime: configuration.urlTime,
        urlBook: configuration.urlBook,
        // Merged
        debug: room?.debug ?? configuration.debug ?? false,
        disabled: room?.disabled ?? configuration.disabled ?? false,
        url: `${url}&date=${dateString}`,
        times: mergedTimes,
        continuity: {
          ...configuration.continuity,
          ...room.continuity,
        },
        capacity: {
          ...configuration.capacity,
          ...room.capacity,
        },
        blacklist: room.blacklist ?? configuration.blacklist ?? [],
        amount: room.amount ?? configuration.amount ?? 1,
        dryRun: dry ?? room.dryRun ?? configuration.dryRun ?? false,
        runOn:
          parseTimeSingular(room.runOn) ??
          parseTimeSingular(configuration.runOn) ??
          parseTimeSingular(`1-7`),
      });
    });
  } else {
    const lid = new URLSearchParams(configuration.url).get(
      configuration.url!.split('=')[0],
    )!;

    runs.push({
      lid,
      url: `${configuration.url}&date=${dateString}`,
      urlTime: configuration.urlTime,
      urlBook: configuration.urlBook,
      debug: configuration.debug ?? false,
      dryRun: dry ?? configuration.dryRun ?? false,
      times: [
        {
          when: '24hr',
          required: [],
          blacklist: [],
          whitelist: [],
          ...parseTimeConfiguration(configuration.times),
        },
      ],
      continuity: configuration.continuity,
      capacity: configuration.capacity,
      blacklist: configuration.blacklist ?? [],
      disabled: configuration.disabled ?? false,
      amount: configuration.amount ?? 1,
      runOn: parseTimeSingular(configuration.runOn) ?? parseTimeSingular('1-7'),
    });
  }

  return [configuration, runs, date];
}

export default getConfiguration;
