import { describe, it, expect } from 'vitest'

import { groupByAndMap } from './group-by-and-map.js'

describe(groupByAndMap, () => {
  it('returns the expected result', () => {
    expect(groupByAndMap([1.1, 1.5, 2.8, 3.9, 3.1], Math.floor, String))
      .toMatchInlineSnapshot(`
      {
        "1": [
          "1.1",
          "1.5",
        ],
        "2": [
          "2.8",
        ],
        "3": [
          "3.9",
          "3.1",
        ],
      }
    `)
  })
})
