export function popRandom<T extends Array<unknown>>(
  arr: T,
): T[number] | undefined {
  if (arr.length === 0) {
    return undefined; // Return undefined if the array is empty.
  }

  const randomIndex = Math.floor(Math.random() * arr.length); // Generate a random index.
  const poppedElement = arr.splice(randomIndex, 1)[0]; // Remove and return the random element.

  return poppedElement;
}
