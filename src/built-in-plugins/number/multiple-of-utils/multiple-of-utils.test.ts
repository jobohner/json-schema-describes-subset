import { describe, it, expect } from 'vitest'

import {
  findMultipleOfCardinality,
  findMultipleOfUnionCardinality,
  gcd,
  isValidMultiple,
  lcm,
  multiRealLCM,
  realLCM,
} from './multiple-of-utils.js'

describe(gcd, () => {
  it('returns the expected result', () => {
    expect(gcd(8, 6)).toBe(2)
    expect(gcd(6, 8)).toBe(2)
    expect(gcd(12, 8)).toBe(4)
    expect(gcd(8, 12)).toBe(4)
    expect(gcd(105, 150)).toBe(15)
    expect(gcd(150, 105)).toBe(15)
    expect(gcd(5, 0)).toBe(5)
    expect(gcd(0, 5)).toBe(5)
    expect(gcd(1, 5)).toBe(1)
    expect(gcd(5, 1)).toBe(1)
    expect(gcd(100, 100)).toBe(100)
  })
})

describe(lcm, () => {
  it('returns the expected result', () => {
    expect(lcm(8, 6)).toBe(24)
    expect(lcm(6, 8)).toBe(24)
    expect(lcm(12, 8)).toBe(24)
    expect(lcm(8, 12)).toBe(24)
    expect(lcm(105, 150)).toBe(1050)
    expect(lcm(150, 105)).toBe(1050)
    expect(lcm(5, 0)).toBe(0)
    expect(lcm(0, 5)).toBe(0)
    expect(lcm(1, 5)).toBe(5)
    expect(lcm(5, 1)).toBe(5)
    expect(lcm(100, 100)).toBe(100)
    expect(lcm(0, 0)).toBe(0)
    expect(lcm(531980980, 1)).toBe(531980980)
    expect(lcm(Infinity, 5)).toBe(Infinity)
    expect(lcm(Infinity, Infinity)).toBe(Infinity)
    expect(lcm(NaN, 5)).toBeNaN()
    expect(lcm(NaN, NaN)).toBeNaN()
    expect(lcm(NaN, Infinity)).toBeNaN()
  })
})

describe(realLCM, () => {
  it('returns the expected result', () => {
    expect(realLCM(1.25, 0.75)).toBe(3.75)
    expect(realLCM(1.25, -0.75)).toBe(3.75)
    expect(realLCM(-1.25, 0.75)).toBe(3.75)
    expect(realLCM(-1.25, -0.75)).toBe(3.75)
    expect(realLCM(0.03476675, 0.0556268)).toBe(0.278134)
    expect(realLCM(0.03476675, -0.0556268)).toBe(0.278134)
    expect(realLCM(-0.03476675, 0.0556268)).toBe(0.278134)
    expect(realLCM(-0.03476675, -0.0556268)).toBe(0.278134)
    expect(realLCM(Infinity, -0.5)).toBe(Infinity)
    expect(realLCM(Infinity, -Infinity)).toBe(Infinity)
    expect(realLCM(0.5, Infinity)).toBe(Infinity)
    expect(realLCM(NaN, -0.5)).toBeNaN()
    expect(realLCM(NaN, NaN)).toBeNaN()
    expect(realLCM(0.5, NaN)).toBeNaN()
    expect(realLCM(Infinity, NaN)).toBeNaN()
    expect(realLCM(53.198098, 0.0000001)).toBe(53.198098)
  })
})

describe(multiRealLCM, () => {
  it(`returns undefined when there aren't any arguments`, () => {
    expect(multiRealLCM()).toBe(undefined)
  })

  it('returns a single argument', () => {
    expect(multiRealLCM(1.234)).toBe(1.234)
  })

  it('works with 2 arguments', () => {
    expect(multiRealLCM(1.25, 0.75)).toBe(3.75)
    expect(multiRealLCM(4.18, 0.01)).toBe(4.18)
  })

  it('works with more than 2 arguments', () => {
    expect(multiRealLCM(1.25, 0.75, 2)).toBe(30)
    expect(multiRealLCM(1.25, 0.75, 0, 2)).toBe(0)
    expect(multiRealLCM(4.18, 0.01, 0)).toBe(0)
  })
})

describe(findMultipleOfCardinality, () => {
  it('returns the expected result', () => {
    expect(findMultipleOfCardinality(5, -11, 24.5)).toMatchInlineSnapshot(`
      {
        "cardinality": 7,
      }
    `)

    expect(findMultipleOfCardinality(1, 100, -100)).toMatchInlineSnapshot(`
      {
        "cardinality": 0,
      }
    `)

    expect(findMultipleOfCardinality(50, 10, 100)).toMatchInlineSnapshot(`
      {
        "cardinality": 2,
      }
    `)

    expect(findMultipleOfCardinality(50, 10, 90)).toMatchInlineSnapshot(`
      {
        "cardinality": 1,
        "singleElement": 50,
      }
    `)

    expect(findMultipleOfCardinality(1, 2, 2)).toMatchInlineSnapshot(`
      {
        "cardinality": 1,
        "singleElement": 2,
      }
    `)
  })

  it('works with rounding errors', () => {
    expect(findMultipleOfCardinality(0.01, 4.18, 4.18)).toMatchInlineSnapshot(`
      {
        "cardinality": 1,
        "singleElement": 4.18,
      }
    `)
  })

  it('works with non positive multipleOf (even though not valid JSON Schema)', () => {
    expect(findMultipleOfCardinality(0, -11, 24.5)).toMatchInlineSnapshot(`
      {
        "cardinality": 1,
        "singleElement": 0,
      }
    `)

    expect(findMultipleOfCardinality(0, -11, -7)).toMatchInlineSnapshot(`
      {
        "cardinality": 0,
      }
    `)

    expect(findMultipleOfCardinality(0, 7, 11)).toMatchInlineSnapshot(`
      {
        "cardinality": 0,
      }
    `)

    expect(findMultipleOfCardinality(-5, -11, 24.5)).toMatchInlineSnapshot(`
      {
        "cardinality": 7,
      }
    `)

    expect(findMultipleOfCardinality(-5, -11, -7)).toMatchInlineSnapshot(`
      {
        "cardinality": 1,
        "singleElement": -10,
      }
    `)

    expect(findMultipleOfCardinality(-5, 7, 11)).toMatchInlineSnapshot(`
      {
        "cardinality": 1,
        "singleElement": 10,
      }
    `)
  })
})

describe(isValidMultiple, () => {
  it('returns false on non numbers', () => {
    expect(isValidMultiple(5, 0, 100)(null)).toBe(false)
    expect(isValidMultiple(5, 0, 100)('')).toBe(false)
    expect(isValidMultiple(5, 0, 100)(false)).toBe(false)
  })

  it('returns the expected result', () => {
    expect(isValidMultiple(2, 0, 100)(10)).toBe(true)
    expect(isValidMultiple(3, 0, 100)(10)).toBe(false)
    expect(isValidMultiple(2, 10.01, 100)(10)).toBe(false)
    expect(isValidMultiple(2, 0, 9.9999)(10)).toBe(false)
    expect(isValidMultiple(0, 0, 100)(0)).toBe(true)
    expect(isValidMultiple(0, 0, 100)(10)).toBe(false)
    expect(isValidMultiple(5, 0)(10)).toBe(true)
    expect(isValidMultiple(5)(10)).toBe(true)
  })
})

describe(findMultipleOfUnionCardinality, () => {
  it('returns the expected value', () => {
    // { 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30, 32 }
    expect(findMultipleOfUnionCardinality(0, 32, [2, 3, 5], [10, 7, 45])).toBe(
      25,
    )
  })
})
