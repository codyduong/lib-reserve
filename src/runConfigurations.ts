import { ConfigurationBase, Runs } from './getConfigurations';
import { JSDOM } from 'jsdom';
import getScore from './getScore';
import reserveTimes, { RoomsToReserve } from './reserveTimes';
import Webhook from './webhook';
import Cleanup from './cleanup';

async function runConfigurations(
  webhook: Webhook,
  cleanup: Cleanup,
  base: ConfigurationBase,
  runs: Runs,
  ..._args: unknown[]
): Promise<void> {
  for (const run of runs) {
    const { url } = run;

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

    const checkboxes = document.getElementById(
      's-lc-eq-checkboxes',
    ) as HTMLDivElement;

    const rooms = checkboxes.children as HTMLCollectionOf<HTMLDivElement>;

    // reservations are required to be adjacent, otherwise reserve in multiple attempts
    // index is time (0-48),
    const roomsToReserve: RoomsToReserve = [];
    const zeroRooms: string[] = [];

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
      const name = fieldset
        .getElementsByTagName('legend')[0]
        .textContent!.trim();
      const [score, times] = getScore(fieldset, capacity, webhook, run);

      if (score == 0) {
        // Strip out location name
        zeroRooms.push(name.replace(/^[^\d]*/g, ''));
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

    if (zeroRooms.length > 0) {
      webhook.log(`${zeroRooms.join(',')}:0`);
    }

    webhook.log('\n');

    const lid = new URLSearchParams(run.url).get(run.url.split('=')[0])!;

    await reserveTimes(roomsToReserve, base.users, lid, {
      debug: run.debug,
      url: url,
      urlTime: run.urlTime,
      urlBook: run.urlBook,
      dryRun: run.dryRun,
      webhook,
      cleanup,
    });
  }
}

export default runConfigurations;
