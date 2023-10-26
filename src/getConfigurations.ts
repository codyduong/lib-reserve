export type RunConfiguration = {
  /**
   * @default https://calendar.lib.ku.edu/r/accessible/availability?lid=17465&zone=0&gid=36998&capacity=2&space=0
   * @TJS-format uri3
   */
  url?: string;
  debug?: boolean;
  dryRun?: boolean;
  /**
   * 48 thirty minute segments of the day, indiced at 0. IE 12:00-12:30 is 24
   * @items.type integer
   * @items.minimum 0
   * @items.maximum 47
   */
  requiredTimes?: number[];
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
};

export type ConfigurationBase = {
  /**
   * @default https://calendar.lib.ku.edu/ajax/space/times
   * @TJS-format uri
   */
  urlTime: string;
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
} & RunConfiguration;

export type Runs = {
  lid: string;
  debug: boolean;
  dryRun: boolean;
  url: string;
  urlTime: string;
  urlBook: string;
  requiredTimes: number[];
  continuity: RunConfiguration['continuity'];
  capacity: RunConfiguration['capacity'];
}[];

async function getConfiguration(
  configuration_location: string | URL,
): Promise<[ConfigurationBase, Runs]> {
  const configuration = JSON.parse(
    await Bun.file(configuration_location, { type: 'application/json' }).text(),
  ) as ConfigurationBase;

  // Catch any configuration errors, either expect the url specified at the base or in every room configuration
  if (!configuration.url && !configuration.rooms?.every((room) => room.url)) {
    throw TypeError(
      'Expected configuration to either contain a url for the base configuraton or for each unique room run configuration',
    );
  }

  const runs: Runs = [];

  if (configuration.rooms && configuration.rooms.length > 0) {
    configuration.rooms.forEach((room) => {
      const url = room.url ?? configuration.url!;

      const lid = new URLSearchParams(configuration.url).get(
        url.split('=')[0],
      )!;

      runs.push({
        lid,
        urlTime: configuration.urlTime,
        urlBook: configuration.urlBook,
        debug: configuration.debug ?? false,
        dryRun: configuration.dryRun ?? false,
        ...room,
        url: `${url}&date=2023-11-02`,
        requiredTimes: room.requiredTimes ?? configuration.requiredTimes ?? [],
        continuity: {
          ...configuration.continuity,
          ...room.continuity,
        },
        capacity: {
          ...configuration.capacity,
          ...room.capacity,
        },
      });
    });
  } else {
    const lid = new URLSearchParams(configuration.url).get(
      configuration.url!.split('=')[0],
    )!;

    runs.push({
      lid,
      url: `${configuration.url}&date=2023-11-02`,
      urlTime: configuration.urlTime,
      urlBook: configuration.urlBook,
      debug: configuration.debug ?? false,
      dryRun: configuration.dryRun ?? false,
      requiredTimes: configuration.requiredTimes ?? [],
      continuity: configuration.continuity,
      capacity: configuration.capacity,
    });
  }

  return [configuration, runs];
}

export default getConfiguration;
