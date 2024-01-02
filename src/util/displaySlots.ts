import type { ReservationSlot } from '../getScore';

export function displaySlots(slots: ReservationSlot[], flip = false): string {
  let availability = '';
  for (let i = 0; i < 48; i++) {
    const findIndex = slots.findIndex((slot) => slot.time == i);
    if (findIndex != -1) {
      // available
      if (slots[findIndex].blacklist) {
        availability += '◈';
        continue;
      }
      availability += flip ? '◆' : '◇';
    } else {
      // unavailable
      availability += flip ? '◇' : '◆';
    }
  }
  return availability;
}
