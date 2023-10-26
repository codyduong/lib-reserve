import { JSDOM } from 'jsdom';
import { ReservationSlot } from './getScore';
import { ConfigurationBase } from './getConfigurations';

export type RoomsToReserve = {
  name: string;
  score: number;
  times: ReservationSlot[];
}[];

export type ReserveTimesConfiguration = {
  debug?: boolean;
  url: string;
  urlTime: string;
  urlBook: string;
};

// naively assume sorted
async function reserveTimes(
  rooms: RoomsToReserve,
  users: ConfigurationBase['users'],
  lid: string,
  configuration: ReserveTimesConfiguration,
) {
  const { url, urlTime, urlBook, debug } = configuration;

  let numberReserved = 0;

  for (const room of rooms) {
    if (room.score <= 0) {
      continue;
    }

    if (numberReserved >= 1) {
      break;
    }

    // if (room.score <= 0 && discardZero) {
    //   continue;
    // }

    // if (numberReserved >= maxToReserve) {
    //   break;
    // }

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

    if (groupTimesToReserve.length > users.length) {
      console.log('There are not enough users to reserve the times!');
      // return 0;
    }

    console.log(`${debug ? '\n' : ''}Now reserving for ${room.name}`);
    const queue = groupTimesToReserve.slice(0);

    while (queue.length > 0) {
      const group = queue.shift()!;
      const user = users[0]; //users.pop();

      if (!user?.email) {
        console.warn(
          `Failed timeslot (${group[0].start} - ${
            group[group.length - 1].end
          })`,
        );
        continue;
      }

      continue;

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

      const session = document.getElementById('session')!.getAttribute('value');

      console.log(
        `Locked timeslot (${group[0].start} - ${
          group[group.length - 1].end
        }), id: ${session}`,
      );

      // submit our reservation

      // handle failed session just in case our user already reserved today, and we still want to reserve this timeslot!
      if (
        response.status === 500 &&
        (await response.text()).includes(
          'Sorry, this exceeds the 120 minute per day limit across all locations.',
        )
      ) {
        queue.push(group);
        continue;
      }
    }

    numberReserved += 1;
  }

  // Use our session to submit

  if (numberReserved == 0) {
    console.log('Failed to reserve any rooms! What happened???');
  }

  return 0;
}

export default reserveTimes;
