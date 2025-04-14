import { describe, it, expect, expectTypeOf } from 'vitest'

import isString from 'lodash/isString.js'
import isBoolean from 'lodash/isBoolean.js'

import {
  createSameElementsArray,
  getElementsBetween,
  splitArray,
} from './array.js'

describe(createSameElementsArray, () => {
  it('returns the expected array', () => {
    expect(createSameElementsArray(3, 'test')).toMatchInlineSnapshot(`
      [
        "test",
        "test",
        "test",
      ]
    `)
    expectTypeOf(createSameElementsArray(3, 'test')).toEqualTypeOf<'test'[]>()
  })
})

describe(splitArray, () => {
  it('returns the expected split array', () => {
    expect(splitArray([], isString)).toMatchInlineSnapshot(`
      [
        [],
      ]
    `)

    expect(splitArray([1, 2, 3], isString)).toMatchInlineSnapshot(`
      [
        [
          1,
          2,
          3,
        ],
      ]
    `)

    expect(splitArray(['1', '2', '3'], isString)).toMatchInlineSnapshot(`
      [
        [],
        [],
        [],
        [],
      ]
    `)

    expect(splitArray([1, 2, 3, '4', '5', 6, 7, 8, '9'], isString))
      .toMatchInlineSnapshot(`
      [
        [
          1,
          2,
          3,
        ],
        [],
        [
          6,
          7,
          8,
        ],
        [],
      ]
    `)
  })
})

describe(getElementsBetween, () => {
  it('returns the expected elements', () => {
    expect(getElementsBetween([], isString, isString)).toMatchInlineSnapshot(
      `[]`,
    )

    expect(
      getElementsBetween([1, true, 2, 3], isString, isBoolean),
    ).toMatchInlineSnapshot(`[]`)

    expect(getElementsBetween([1, true, 2, 3, '4'], isString, isBoolean))
      .toMatchInlineSnapshot(`
      [
        [],
      ]
    `)

    expect(getElementsBetween([1, true, 2, 3, '4', 5, 6], isString, isBoolean))
      .toMatchInlineSnapshot(`
      [
        [
          5,
          6,
        ],
      ]
    `)

    expect(
      getElementsBetween(
        [1, true, 2, 3, '4', 5, 6, 7, true, 8, 9],
        isString,
        isBoolean,
      ),
    ).toMatchInlineSnapshot(`
      [
        [
          5,
          6,
          7,
        ],
      ]
    `)

    expect(
      getElementsBetween(
        [1, true, 2, 3, '4', 5, 6, 7, true, 8, 9, '10'],
        isString,
        isBoolean,
      ),
    ).toMatchInlineSnapshot(`
      [
        [
          5,
          6,
          7,
        ],
        [],
      ]
    `)

    expect(
      getElementsBetween(
        [1, true, 2, 3, '4', 5, 6, 7, true, 8, 9, '10', 11, 12],
        isString,
        isBoolean,
      ),
    ).toMatchInlineSnapshot(`
      [
        [
          5,
          6,
          7,
        ],
        [
          11,
          12,
        ],
      ]
    `)

    expect(
      getElementsBetween(
        [1, true, 2, 3, '4', 5, 6, 7, true, 8, 9, '10', 11, 12, false, 13, 14],
        isString,
        isBoolean,
      ),
    ).toMatchInlineSnapshot(`
      [
        [
          5,
          6,
          7,
        ],
        [
          11,
          12,
        ],
      ]
    `)
  })
})
