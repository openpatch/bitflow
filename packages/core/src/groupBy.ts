export function groupBy<T>(array: Array<T>, by: (value: T) => string): T[][] {
  const grouped: T[][] = [];
  let index = 0;
  const indexes: Record<string, number> = {};

  let l = 0;

  while (l < array.length) {
    const value = array[l];
    const key = by(value);
    if (indexes[key] === undefined) {
      indexes[key] = index;
      index++;
    }

    if (!grouped[indexes[key]]) {
      grouped[indexes[key]] = [value];
    } else {
      grouped[indexes[key]].push(value);
    }
    l++;
  }
  return grouped;
}
