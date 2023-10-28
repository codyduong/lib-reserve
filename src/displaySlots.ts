import type { ReservationSlot } from './getScore';

export function displaySlots(slots: ReservationSlot[], flip = false): string {
  let availability = '';
  for (let i = 0; i < 48; i++) {
    if (slots.findIndex((slot) => slot.time == i) != -1) {
      availability += flip ? '▮' : '▯';
    } else {
      availability += flip ? '▯' : '▮';
    }
  }
  return availability;
}
