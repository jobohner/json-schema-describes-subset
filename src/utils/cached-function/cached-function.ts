export function createCachedFunction<ArgType, ResultType>(
  func: (arg: ArgType) => ResultType,
) {
  const cache = new Map<ArgType, ResultType>()
  return function (arg: ArgType): ResultType {
    const cached = cache.get(arg)
    if (cached !== undefined && cache.has(arg)) {
      return cached
    }

    const result = func(arg)
    cache.set(arg, result)
    return result
  }
}
