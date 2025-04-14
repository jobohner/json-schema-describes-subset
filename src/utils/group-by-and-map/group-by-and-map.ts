export function groupByAndMap<Type, MapResult>(
  array: Type[],
  getKey: (value: Type) => string | number | symbol,
  map: (value: Type) => MapResult,
): Record<string | number | symbol, MapResult[]> {
  const result: Record<string | number | symbol, MapResult[]> = {}

  for (const value of array) {
    const key = getKey(value)
    const mappedValue = map(value)

    const arrayForKey = result[key]

    if (arrayForKey === undefined) {
      result[key] = [mappedValue]
    } else {
      arrayForKey.push(mappedValue)
    }
  }

  return result
}
