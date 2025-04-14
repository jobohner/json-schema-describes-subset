import { describe, it, expect, vi } from 'vitest'

import { createCachedFunction } from './cached-function.js'

describe(createCachedFunction, () => {
  it('returns the calculated or cached result', () => {
    const helpers = {
      increment: (a: number): number => {
        return a + 1
      },
    }

    const incrementSpy = vi.spyOn(helpers, 'increment')

    const cachedIncrement = createCachedFunction(helpers.increment)

    expect(cachedIncrement(2)).toBe(3)
    expect(cachedIncrement(3)).toBe(4)
    expect(cachedIncrement(4)).toBe(5)

    expect(incrementSpy).toHaveBeenCalledTimes(3)

    expect(cachedIncrement(3)).toBe(4)
    expect(cachedIncrement(4)).toBe(5)

    expect(incrementSpy).toHaveBeenCalledTimes(3)

    expect(cachedIncrement(5)).toBe(6)
    expect(cachedIncrement(6)).toBe(7)

    expect(incrementSpy).toHaveBeenCalledTimes(5)
  })
})
