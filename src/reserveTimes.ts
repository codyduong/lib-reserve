import { JSDOM } from 'jsdom';
import { ReservationSlot } from './getScore';
import { ConfigurationBase } from './getConfigurations';
import Webhook from './webhook';
import { Temporal } from '@js-temporal/polyfill';
import Cleanup from './cleanup';
import { displaySlots } from './displaySlots';
import popRandom from './popRandom';

export type RoomsToReserve = {
  name: string;
  score: number;
  times: ReservationSlot[];
}[];

export type ReserveTimesConfiguration = {
  debug: boolean | undefined;
  dryRun: boolean | undefined;
  url: string;
  urlTime: string;
  urlBook: string;
  webhook: Webhook;
  cleanup: Cleanup;
  amount: number;
  nameOverride: ([fname: string, lname: string] | string)[] | undefined;
};

// naively assume sorted
async function reserveTimes(
  rooms: RoomsToReserve,
  users: ConfigurationBase['users'],
  lid: string,
  configuration: ReserveTimesConfiguration,
): Promise<void> {
  const {
    url,
    urlTime,
    urlBook,
    debug: _debug,
    dryRun,
    webhook,
    cleanup,
    amount: maxToReserve,
    nameOverride,
  } = configuration;

  webhook.log(dryRun ? 'STARTING **DRY** RUN' : 'STARTING RUN');

  let numberReserved = 0;
  let [fname, lname]: [string | undefined, string | undefined] = [
    undefined,
    undefined,
  ];

  if (nameOverride) {
    const name = popRandom(nameOverride);
    if (name) {
      if (typeof name === 'string') {
        fname = name;
        lname = '';
      } else {
        [fname, lname] = name;
      }
    }
  }

  for (const room of rooms) {
    if (room.score <= 0) {
      continue;
    }

    // if (room.score <= 0 && discardZero) {
    //   continue;
    // }

    if (numberReserved >= maxToReserve) {
      break;
    }

    const groupTimesToReserve: ReservationSlot[][] = [];
    let group: ReservationSlot[] = [];

    for (const time of room.times) {
      if (
        group.length >= 1 &&
        group[group.length - 1].time == time.time - 1 &&
        group.length < 4
      ) {
        group.push(time);
      } else if (group.length == 0) {
        group = [time];
      } else {
        groupTimesToReserve.push(group);
        group = [time];
      }
    }
    groupTimesToReserve.push(group);

    webhook.log(`*RESERVING ${room.name}*`);
    // if (groupTimesToReserve.length > users.length) {
    //   webhook.log('\nNOT ENOUGH EMAILS!\n');
    //   break;
    // }

    const queue = groupTimesToReserve.slice(0);
    const success: ReservationSlot[] = [];

    while (queue.length > 0) {
      const group = queue.shift()!;
      const user = popRandom(users);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = new FormData();

      for (const [i, time] of group.entries()) {
        body.append(`bookings[${i}][lid]`, lid);
        body.append(`bookings[${i}][eid]`, time.eid);
        body.append(`bookings[${i}][seat_id]`, '0');
        body.append(`bookings[${i}][start]`, time.start);
        body.append(`bookings[${i}][end]`, time.end);
        body.append(`bookings[${i}][checksum]`, time.checksum);
      }

      // The server doesn't encode + as %2B is this encoded correctly wtf?
      // @ts-expect-error: Use this method to encode the rest of this
      const fixedBody = new URLSearchParams(body)
        .toString()
        .replace(/%2B/g, '+');

      const response = await fetch(`${urlTime}`, {
        method: 'POST',
        headers: {
          Accept: 'text/html, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Referer: url,
        },
        body: fixedBody,
      });

      // handle unexpected error codes
      if (response.status !== 200) {
        throw Error(`Unhandled status: ${response.status}`);
      }

      const dom = new JSDOM(await response.text());

      const document = dom.window._document as Document;

      const session = Number(
        document.getElementById('session')?.getAttribute('value'),
      );

      cleanup.addSession(session);

      webhook.log(
        `${Temporal.PlainTime.from(
          group[0].start,
        ).toString()}-${Temporal.PlainTime.from(
          group[group.length - 1].end,
        ).toString()}|${session}`,
      );

      if (!user) {
        webhook.log(`No user to reserve session with`);
        continue;
      }

      if (dryRun) {
        webhook.log(
          `#dry_runFoobar|${user?.email}|${fname ?? user.fname} ${
            lname ?? user.lname
          }`,
        );
        success.push(...group);
        continue;
      }

      if (Number.isNaN(session)) {
        throw Error(`Failed to get session for ${room.name}`);
      }

      // get return url
      const returnUrl = (() => {
        const newUrl = new URL(url);
        const newParams = new URLSearchParams([
          ['lid', lid],
          ['gid', newUrl.searchParams.get('gid')!],
          ['zone', newUrl.searchParams.get('zone')!],
          ['space', newUrl.searchParams.get('space')!],
          ['capacity', newUrl.searchParams.get('capacity')!],
        ]);
        return newUrl.pathname.replace('/availability', '') + '?' + newParams;
      })();

      const body2 = new FormData();

      body2.append('session', `${session}`);
      body2.append('fname', fname ?? user.fname);
      body2.append('lname', lname ?? user.lname);
      body2.append('email', user.email);
      body2.append(
        'bookings',
        JSON.stringify(
          group.map((g) => ({
            lid: Number(lid),
            eid: Number(g.eid),
            seat_id: Number(g['seat_id']),
            start: g.start,
            end: g.end,
            checksum: g.checksum,
          })),
        ),
      );
      body2.append('returnUrl', returnUrl);
      body2.append('method', '14');

      const response2 = await fetch(urlBook, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          // 'Content-Type': `multipart/form-data; boundary=${divider}`,
          referer: url,
        },
        body: body2,
      });

      // handle failed session just in case our user already reserved today, and we still want to reserve this timeslot!
      if (
        response2.status === 500 &&
        (await response2.text()).includes(
          'Sorry, this exceeds the 120 minute per day limit across all locations.',
        )
      ) {
        queue.push(group);
        continue;
      }

      // handle unexpected error codes
      if (response2.status !== 200) {
        throw Error(`Unhandled status: ${response2.status}`);
      }

      const response2json = await response2.json();

      webhook.log(`#${response2json.bookId}|${user.email}`);

      // remove session from cleanup if we booked the session
      cleanup.removeSession(session);

      success.push(...group);
    }

    // print out the successfully reserved slots
    webhook.log(displaySlots(success, true));

    webhook.log('\n');
    numberReserved += 1;
  }

  if (numberReserved < maxToReserve) {
    webhook.log(
      `Only reserved ${numberReserved} out of ${maxToReserve} requsted. Was there enough valid rooms?`,
    );
  }

  if (numberReserved == 0) {
    webhook.ping();
    webhook.log('Failed to reserve any rooms! What happened???\n');
  }
}

export default reserveTimes;
