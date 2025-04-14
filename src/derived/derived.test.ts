import { describe, it, expect } from 'vitest'

import { schemasAreEquivalent, schemaDescribesUniverse } from './derived.js'

describe(schemaDescribesUniverse, () => {
  it('works with boolean schemas', () => {
    expect(schemaDescribesUniverse(false)).toBe(false)
    expect(schemaDescribesUniverse(true)).toBe(true)
  })

  it('works with negated boolean schemas', () => {
    expect(schemaDescribesUniverse({ not: false })).toBe(true)
    expect(schemaDescribesUniverse({ not: true })).toBe(false)
  })

  it('returns true', () => {
    expect(schemaDescribesUniverse({})).toBe(true)
    expect(
      schemaDescribesUniverse({
        anyOf: [
          { type: ['number', 'boolean', 'string'] },
          { type: ['null', 'object'] },
          { type: 'array' },
        ],
      }),
    ).toBe(true)
  })

  it('returns null', () => {
    expect(schemaDescribesUniverse({ minimum: 2 })).toBe(null)
  })

  it('returns false', () => {
    expect(schemaDescribesUniverse({ not: { const: 5 } })).toBe(false)
  })
})

describe(schemasAreEquivalent, () => {
  it('works with boolean schemas', () => {
    expect(schemasAreEquivalent(false, true)).toBe(false)
    expect(schemasAreEquivalent(true, false)).toBe(false)
    expect(schemasAreEquivalent(false, false)).toBe(true)
    expect(schemasAreEquivalent(true, true)).toBe(true)
  })

  it('returns true on the same schemas', () => {
    expect(schemasAreEquivalent({ pattern: '^a+$' }, { pattern: '^a+$' })).toBe(
      true,
    )
  })

  it('returns false', () => {
    expect(
      schemasAreEquivalent(
        { exclusiveMinimum: 5.6 },
        { exclusiveMinimum: 5.5 },
      ),
    ).toBe(false)

    expect(
      schemasAreEquivalent(
        { exclusiveMinimum: 5.5 },
        { exclusiveMinimum: 5.6 },
      ),
    ).toBe(false)
  })

  it('returns null', () => {
    expect(schemasAreEquivalent({ minimum: 2 }, { minimum: 5 })).toBe(null)
    expect(schemasAreEquivalent({ minimum: 5 }, { minimum: 2 })).toBe(null)
  })
})
