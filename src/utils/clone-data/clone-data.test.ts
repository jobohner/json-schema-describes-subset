import { describe, it, expect } from 'vitest'

import { cloneData } from './clone-data.js'

describe(cloneData, () => {
  it('returns the cloned data', () => {
    const data = {
      a: 0,
      b: 1,
      c: 2,
      d: [
        1,
        2,
        3,
        [4, 5, 6],
        {
          e: 'string',
          f: true,
          g: null,
          h: undefined,
        },
      ],
    }

    const clonedData = cloneData(data)

    expect(clonedData).toEqual(data)
    expect(clonedData).not.toBe(data)
    expect(clonedData.d).not.toBe(data.d)
    expect(clonedData.d[3]).not.toBe(data.d[3])
    expect(clonedData.d[4]).not.toBe(data.d[4])
  })
})
