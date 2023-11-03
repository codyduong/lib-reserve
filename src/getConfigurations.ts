import { Temporal } from '@js-temporal/polyfill';
import {
  parseTimeConfiguration,
  parseTimeSingular,
} from './parseTimeConfiguration';

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
  times?: {
    /**
     * 48 thirty minute segments of the day, indiced at 0. IE 12:00-12:30 is 24
     */
    required?: number[] | `${number}-${number}` | `${number}` | number;
    /**
     * 48 thirty minute segments of the day, indiced at 0. IE 12:00-12:30 is 24
     */
    blacklist?: number[] | `${number}-${number}` | `${number}` | number;
    /**
     * 48 thirty minute segments of the day, indiced at 0. IE 12:00-12:30 is 24
     */
    whitelist?: number[] | `${number}-${number}` | `${number}` | number;
  };
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
    required: number[];
    blacklist: number[];
    whitelist: number[];
  };
  continuity: RunConfiguration['continuity'];
  capacity: RunConfiguration['capacity'];
  blacklist: string[];
  disabled: boolean;
  amount: number;
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
  const { dry, filepath: configuration_location } = options;
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

      runs.push({
        lid,
        urlTime: configuration.urlTime,
        urlBook: configuration.urlBook,
        debug: configuration.debug ?? false,
        disabled: configuration.disabled ?? false,
        ...room,
        url: `${url}&date=${dateString}`,
        times: {
          required:
            parseTimeSingular(room.times?.required) ??
            parseTimeSingular(configuration?.times?.required) ??
            [],
          blacklist:
            parseTimeSingular(room.times?.blacklist) ??
            parseTimeSingular(configuration?.times?.blacklist) ??
            [],
          whitelist:
            parseTimeSingular(room.times?.whitelist) ??
            parseTimeSingular(configuration?.times?.whitelist) ??
            [],
        },
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
      times: {
        required: [],
        blacklist: [],
        whitelist: [],
        ...parseTimeConfiguration(configuration.times),
      },
      continuity: configuration.continuity,
      capacity: configuration.capacity,
      blacklist: configuration.blacklist ?? [],
      disabled: configuration.disabled ?? false,
      amount: configuration.amount ?? 1,
    });
  }

  return [configuration, runs, date];
}

export default getConfiguration;
