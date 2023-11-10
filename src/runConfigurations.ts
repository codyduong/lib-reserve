import { ConfigurationBase, Runs } from './getConfigurations';
import { JSDOM } from 'jsdom';
import getScore from './getScore';
import reserveTimes, { RoomsToReserve } from './reserveTimes';
import Webhook from './webhook';
import Cleanup from './cleanup';
import { Temporal } from '@js-temporal/polyfill';
import calculateTime from './calculateTime';
import groupRooms from './groupRooms';

async function runConfigurations(
  webhook: Webhook,
  cleanup: Cleanup,
  base: ConfigurationBase,
  runs: Runs,
  ..._args: unknown[]
): Promise<void> {
  // get library hours
  const { days = 7 } = base;
  const date = Temporal.Now.zonedDateTimeISO('America/Chicago')
    .toPlainDate()
    .add(Temporal.Duration.from(`P${days}D`));

  const libraryHoursResponse = await fetch(base.urlHours, {
    method: 'GET',
    headers: {
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.7',
      'Cache-Control': 'no-cache',
      Referer: base.urlHoursHeader.referer,
    },
  });

  type WeekDay = {
    date: string; // YYYY-MM-DD
    times: {
      status: '24hours' | 'closed';
      hours?: {
        from: string;
        to: string;
      }[];
      rendered?: string;
      note?: string;
    };
  };

  const libraryHoursJson = (await libraryHoursResponse.json()) as
    | {
        locations: LibraryHourLocation[];
      }
    | {
        [index: `loc_${number}`]: LibraryHourLocation;
      };

  type LibraryHourLocation = {
    lid: number;
    weeks: {
      Sunday: WeekDay;
      Monday: WeekDay;
      Tuesday: WeekDay;
      Wednesday: WeekDay;
      Thursday: WeekDay;
      Friday: WeekDay;
      Saturday: WeekDay;
    }[]; // YYYY-MM-DD
  };

  const allHours = (
    'locations' in libraryHoursJson
      ? (libraryHoursJson.locations as LibraryHourLocation[]).find(
          (location) => {
            console.log(location.lid, base.urlHoursInstruction.lid);
            return location.lid == base.urlHoursInstruction.lid;
          },
        )
      : (libraryHoursJson[
          `loc_${base.urlHoursInstruction.lid}`
        ] as LibraryHourLocation)
  )?.weeks.reduce<Record<string, WeekDay>>((prev, curr) => {
    const temp = { ...prev };

    Object.values(curr).forEach((weekday) => {
      temp[weekday.date] = weekday;
    });

    return temp;
  }, {});

  let libraryHours: '24hr' | `${number}-${number}` | 'closed' = '24hr';
  let libraryRendered = undefined;

  // today in reference to the day we are reserving, not today "today"
  const todaysHours = allHours?.[date.toString()];
  if (todaysHours) {
    console.log(todaysHours.times);
    libraryRendered =
      todaysHours.times.rendered?.split('\n')[1].trim() ??
      todaysHours.times.note;
    if (todaysHours.times.status === '24hours') {
      libraryHours = '24hr';
    }
    if (todaysHours.times.status === 'closed') {
      libraryHours = 'closed';
    }
    if (todaysHours.times.hours && todaysHours.times.hours.length > 1) {
      throw new Error('This is the worst edgecase ever');
    }
    const start =
      todaysHours.times.hours && calculateTime(todaysHours.times.hours[0].from);
    const end =
      todaysHours.times.hours &&
      calculateTime(todaysHours.times.hours[0].to) - 1;
    if (start !== undefined && end !== undefined) {
      libraryHours = `${start}-${end}`;
    }
  }

  if (libraryHours === 'closed') {
    webhook.log(`No reservations made, library is closed: ${libraryRendered}`);
    return;
  }

  for (const run of runs) {
    const { url } = run;

    if (run.disabled) {
      webhook.log(`Run skipped: Disabled`);
      continue;
    }

    if (!run.runOn.includes(date.dayOfWeek)) {
      webhook.log(
        `Run skipped: Received ${date.dayOfWeek} but expected ${run.runOn[0]}-${
          run.runOn[run.runOn.length - 1]
        }`,
      );
      continue;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html',
        'Accept-Language': 'en-US,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    const dom = new JSDOM(await response.text());

    const document = dom.window._document as Document;

    // double check we are on a Springshare system
    const isSpringshare =
      document
        .getElementById('s-lc-public-footer-brand')
        ?.getElementsByTagName('a')[0]
        .textContent?.trim() === 'Springshare';

    if (!isSpringshare) {
      throw new Error(`Not a Springshare Reservation System`);
    }

    const checkboxes = document.getElementById(
      's-lc-eq-checkboxes',
    ) as HTMLDivElement;

    const alerts = checkboxes.getElementsByClassName('alert');

    if (alerts.length > 0) {
      const alert = alerts[0];
      if (alert.textContent?.includes('no available timeslots')) {
        webhook.ping();
        throw new Error(
          'No available timeslots available? Is the library closed or did we query a date out of reservation range?',
        );
      }
    }

    const rooms = checkboxes.children as HTMLCollectionOf<HTMLDivElement>;

    // reservations are required to be adjacent, otherwise reserve in multiple attempts
    // index is time (0-48),
    const roomsToReserve: RoomsToReserve = [];
    const zeroRooms: Record<number, string[]> = [];

    webhook.log(`SCORING`);

    for (const room of rooms) {
      if (!room.className.includes('panel')) {
        continue;
      }

      const capacity = Number(
        room
          .getElementsByTagName('span')[0]
          .textContent?.replace(/(\n|\D)*/gm, ''),
      );

      if (Number.isNaN(capacity)) {
        throw Error('Failed to get room capacity');
      }

      const fieldset = room.getElementsByTagName('fieldset')[0];
      const description =
        room.getElementsByClassName('panel-body')[0].textContent;
      const name = fieldset
        .getElementsByTagName('legend')[0]
        .textContent!.trim();

      const [score, times] = getScore(
        fieldset,
        capacity,
        description ?? '',
        webhook,
        run,
        libraryHours,
      );

      if (score <= 0) {
        const trimmedName = name.replace(/^[^\d]*/g, '');
        zeroRooms[score] = zeroRooms[score]
          ? [...zeroRooms[score], trimmedName]
          : [trimmedName];
      }

      let indexToInsertAt = roomsToReserve.findIndex(
        (room) => room.score < score,
      );

      if (indexToInsertAt === -1) {
        indexToInsertAt = roomsToReserve.length;
      }

      roomsToReserve.splice(indexToInsertAt, 0, {
        name,
        score,
        times,
      });
    }

    Object.entries(zeroRooms).map(([score, room]) => {
      webhook.log(`${room.join(',')}:${score}`);
    });

    webhook.log('\n');

    const lid = new URLSearchParams(run.url).get(run.url.split('=')[0])!;

    await reserveTimes(groupRooms(roomsToReserve), base.users, lid, {
      debug: run.debug,
      url: url,
      urlTime: run.urlTime,
      urlBook: run.urlBook,
      dryRun: run.dryRun,
      webhook,
      cleanup,
      amount: run.amount,
      nameOverride: run.nameOverride,
    });
  }
}

export default runConfigurations;
