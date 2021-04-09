export function findLast<T>(
  array: Array<T>,
  predicate: (value: T, index: number, obj: T[]) => boolean
): T | null {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) return array[l];
  }
  return null;
}
