import calculateTime from './calculateTime';

export type ReservationSlot = {
  time: number;
  checksum: string;
  eid: string;
  start: string;
  end: string;
};

export type GetScoreConfiguration = {
  continuity?: {
    base?: number;
    multiplier?:
      | number
      | ((data: {
          start: number; // 0
          end: number; // 48
          combo: number;
        }) => number);
    multiplerMax?: number;
    min?: number;
    max?: number | null;
  };
  capacity?: {
    multiplier?: number;
    min?: number;
    max?: number | null;
  };
  requiredTimes: number[];
  debug?: boolean;
};

function getScore(
  fieldset: HTMLFieldSetElement,
  capacity: number,
  configuration?: GetScoreConfiguration,
): [number, ReservationSlot[]] {
  const {
    continuity = {},
    capacity: capacityConfiguration = {},
    debug,
    requiredTimes,
  } = configuration ?? {};

  const {
    base: continuityBase = 0.5,
    multiplier: continuityMultiplier = ({ start }) => {
      return Math.sin((start * Math.PI) / 48);
    },
    multiplerMax: continuityMultiplierMax = 8,
    min: continuityMin = 12, // 6 hours
    max: continuityMax = null,
  } = continuity;

  const {
    multiplier: capacityMultiplier = 2,
    min: capacityMin = 8,
    max: capacityMax = null,
  } = capacityConfiguration;

  // get all rooms availabilites and convert it to an easily readable format
  const checkboxes = fieldset.getElementsByTagName('label');

  const name = fieldset.getElementsByTagName('legend')[0].textContent?.trim();

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

    const continuityScore =
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
    timeSlots.push({
      time: startTime,
      checksum: input.getAttribute('data-crc')!,
      eid: input.getAttribute('data-eid')!,
      start: input.getAttribute('data-start')!,
      end: input.getAttribute('data-end')!,
    });
    score += continuityScore;
  }

  // disregard if continuity isn't within bounds
  if (maxCombo < continuityMin || (continuityMax && maxCombo > continuityMax)) {
    score = 0;
  }

  // disregard if capacity isn't within bounds
  if (capacity < capacityMin || (capacityMax && capacity > capacityMax)) {
    score = 0;
  }

  if (debug) {
    console.log(`${name} scored ${score}`);
  }

  return [score, timeSlots];
}

export default getScore;
