import type { RoomsToReserve } from './reserveTimes';

type Room = RoomsToReserve[number];

const isAdjacent = (room1: Room, room2: Room) => {
  const getRoomNumber = (name: string) => Number(name.replace(/^[^\d]*/g, ''));
  const roomNumber = getRoomNumber(room1.name);
  const room2Number = getRoomNumber(room2.name);

  return (
    !Number.isNaN(roomNumber) &&
    !Number.isNaN(room2Number) &&
    (room2Number + 1 === roomNumber || room2Number - 1 === roomNumber)
  );
};

/**
 * Group by highest score, then by rooms that are close (only if they have the exact same score), then flatten the groups
 * @param rooms Assume already sorted by score (highest to lowest) to ensure no disjoint groups
 */
export default function groupRooms(rooms: RoomsToReserve): RoomsToReserve {
  const groups: { score: number; rooms: RoomsToReserve }[] = [];

  rooms.forEach((room) => {
    const foundGroup = groups.find((group) => group.score === room.score);

    if (foundGroup) {
      if (foundGroup.rooms.some((room2) => isAdjacent(room, room2))) {
        groups.splice(groups.indexOf(foundGroup), 1);
        foundGroup.rooms.push(room);
        groups.push(foundGroup);
      } else {
        groups.push({ score: room.score, rooms: [room] });
      }
    } else {
      groups.push({ score: room.score, rooms: [room] });
    }
  });

  return groups
    .sort(({ score: a, rooms: ar }, { score: b, rooms: br }) => {
      if (a == b) {
        return br.length - ar.length;
      }
      return b - a;
    })
    .flatMap(({ rooms }) => rooms);
}
