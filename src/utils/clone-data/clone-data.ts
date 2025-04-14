/**
 * @param data Must be pure data and not contain functions etc. May contain non
 *   JSON data (e. g. `undefined`)
 */
export function cloneData<Type>(data: Type): Type {
  if (Array.isArray(data)) {
    return data.map(cloneData) as Type
  }

  if (typeof data === 'object' && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, cloneData(value)]),
    ) as Type
  }

  return data
}
