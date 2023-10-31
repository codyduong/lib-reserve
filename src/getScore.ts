import calculateTime from './calculateTime';
import { displaySlots } from './displaySlots';
import { Run } from './getConfigurations';
import Webhook from './webhook';

export type ReservationSlot = {
  time: number;
  checksum: string;
  eid: string;
  start: string;
  end: string;
  seat_id: string;
  blacklist?: boolean;
};

export type GetScoreConfiguration = Run;

function getScore(
  fieldset: HTMLFieldSetElement,
  capacity: number,
  description: string,
  webhook: Webhook,
  configuration: GetScoreConfiguration | undefined,
): [number, ReservationSlot[]] {
  const {
    continuity = {},
    capacity: capacityConfiguration = {},
    debug,
    times,
    blacklist,
  } = configuration ?? {};

  const {
    base: continuityBase = 0.5,
    // multiplier: continuityMultiplier = ({ start }) => {
    //   return Math.sin((start * Math.PI) / 48);
    // },
    multiplerMax: continuityMultiplierMax = 8,
    min: continuityMin = 12, // 6 hours
    max: continuityMax = null,
  } = continuity;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const continuityMultiplier = ({ start }: any) => {
    return Math.sin((start * Math.PI) / 48);
  };

  const {
    // multiplier: capacityMultiplier = 2,
    min: capacityMin = 8,
    max: capacityMax = null,
  } = capacityConfiguration;

  const capacityMultiplier = 2;

  // get all rooms availabilites and convert it to an easily readable format
  const checkboxes = fieldset.getElementsByTagName('label');

  const name = fieldset.getElementsByTagName('legend')[0].textContent!.trim();

  let score = capacity * capacityMultiplier;
  // check combo
  let maxCombo = 1;
  let combo = 1;
  let comboEnd: null | string = null;
  const timeSlots: ReservationSlot[] = [];

  for (const checkbox of checkboxes) {
    const [start, end] = checkbox.textContent!.trim()!.split(' - ');
    if (start == comboEnd) {
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
    } else {
      combo = 1;
    }
    comboEnd = end;
    const startTime = calculateTime(start);

    let continuityScore =
      continuityBase *
      Math.min(continuityMultiplierMax, combo) *
      (typeof continuityMultiplier == 'number'
        ? continuityMultiplier
        : continuityMultiplier({
            start: startTime,
            end: calculateTime(end),
            combo,
          }));

    const input = checkbox.getElementsByTagName('input')[0];

    const blacklisted =
      times?.blacklist?.includes(startTime) ||
      (times &&
        (times.whitelist?.length ?? 0) > 0 &&
        !times.whitelist.includes(startTime));

    if (blacklisted) {
      continuityScore = 0;
    }

    timeSlots.push({
      time: startTime,
      checksum: input.getAttribute('data-crc')!,
      eid: input.getAttribute('data-eid')!,
      start: input.getAttribute('data-start')!,
      end: input.getAttribute('data-end')!,
      seat_id: input.getAttribute('data-seat')!,
      blacklist: blacklisted,
    });

    score += continuityScore;
  }

  // disregard if description contains phrases which are bad BOO
  if (
    description.includes('unavailable') ||
    description.includes('maintenance')
  ) {
    score = 0;
  }

  // disregard if we don't have required times
  if (
    times?.required &&
    (times.required.length ?? 0) > 0 &&
    !times.required.every((time) =>
      timeSlots.some((slot) => slot.time === time),
    )
  ) {
    score = 0;
  }

  // disregard if blacklisted
  if (
    blacklist?.some((black) => name.includes(black)) ||
    blacklist?.includes(name)
  ) {
    score = 0;
  }

  if (maxCombo < continuityMin || (continuityMax && maxCombo > continuityMax)) {
    // disregard if continuity isn't within bounds
    score = 0;
  }

  // disregard if capacity isn't within bounds
  if (capacity < capacityMin || (capacityMax && capacity > capacityMax)) {
    score = 0;
  }

  if (debug) {
    if (score != 0) {
      webhook.log(
        `${name.replace(/^[^\d]*/g, '')}:${score.toFixed(3)}\n${displaySlots(
          timeSlots,
        )}`,
      );
    }
  }

  const filtered =
    // prioritize blacklist
    times && times.blacklist.length > 0
      ? timeSlots.filter((time) => !times.blacklist.includes(time.time))
      : times && times.whitelist.length > 0
      ? timeSlots.filter((time) => times.whitelist.includes(time.time))
      : timeSlots;

  return [score, filtered];
}

export default getScore;
