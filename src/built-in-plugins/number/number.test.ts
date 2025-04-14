import { describe, it, expect } from 'vitest'

import { schemaDescribesEmptySet, toDNF } from '../../index.js'
import { schemaDescribesSubset } from '../../schema-describes-subset/index.js'
import { MaximumAtomicSchema, MinimumAtomicSchema } from './number.js'
import { splitToRawDNF } from '../../atomic-schema/split/split.js'
import { toInternalOptions } from '../../options/options.js'

describe(MaximumAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new MaximumAtomicSchema(3)
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "maximum": 3,
      }
    `)
  })
})

describe(MinimumAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new MinimumAtomicSchema(3)
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "minimum": 3,
      }
    `)
  })
})

describe(`${splitToRawDNF.name} using numberPlugin`, () => {
  it(`works with { multipleOf: 0 } (even though that's not valid json schema)`, () => {
    expect(splitToRawDNF({ multipleOf: 0 }, toInternalOptions({})))
      .toMatchInlineSnapshot(`
      AnyOfSchema {
        "anyOf": [
          AllOfSchema {
            "allOf": [
              ConstAtomicSchema {
                "const": 0,
              },
            ],
          },
        ],
      }
    `)
  })
})

describe(`${schemaDescribesEmptySet.name} using number built-in plugin`, () => {
  it('works with minimum/maximum/multipleOf', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'number',
        minimum: 2,
        maximum: 8,
        multipleOf: 10,
      }),
    ).toBe(true)
    expect(
      schemaDescribesEmptySet({
        type: 'number',
        minimum: 2,
        maximum: 8,
        multipleOf: 5,
      }),
    ).toBe(false)
  })
})

describe(`${schemaDescribesSubset.name} using number built-in plugin`, () => {
  it('works with number minimum', () => {
    expect(schemaDescribesSubset({ minimum: 5.5 }, {})).toBe(true)
    expect(schemaDescribesSubset({ minimum: 5.5 }, { minimum: 5.6 })).toBe(null)
    expect(schemaDescribesSubset({ minimum: 5.5 }, { minimum: 5.4 })).toBe(true)
    expect(schemaDescribesSubset({ minimum: 0 }, { minimum: -1 })).toBe(true)
  })

  it('works with number exclusiveMinimum', () => {
    expect(schemaDescribesSubset({ exclusiveMinimum: 5.5 }, {})).toBe(true)
    expect(
      schemaDescribesSubset(
        { exclusiveMinimum: 5.5 },
        { exclusiveMinimum: 5.6 },
      ),
    ).toBe(false)
    expect(
      schemaDescribesSubset(
        { exclusiveMinimum: 5.5 },
        { exclusiveMinimum: 5.4 },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ minimum: 5.5 }, { exclusiveMinimum: 5.6 }),
    ).toBe(false)
    expect(
      schemaDescribesSubset({ minimum: 5.5 }, { exclusiveMinimum: 5.4 }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ exclusiveMinimum: 5.5 }, { minimum: 5.6 }),
    ).toBe(null)
    expect(
      schemaDescribesSubset({ exclusiveMinimum: 5.5 }, { minimum: 5.4 }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ exclusiveMinimum: 5.5 }, { minimum: 5.5 }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ minimum: 5.5 }, { exclusiveMinimum: 5.5 }),
    ).toBe(false)
    expect(schemaDescribesSubset({ exclusiveMinimum: 0 }, { minimum: 0 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ minimum: 0 }, { exclusiveMinimum: 0 })).toBe(
      false,
    )
  })

  it('works with number exclusiveMaximum', () => {
    expect(schemaDescribesSubset({ exclusiveMaximum: 5.5 }, {})).toBe(true)
    expect(
      schemaDescribesSubset(
        { exclusiveMaximum: 5.5 },
        { exclusiveMaximum: 5.6 },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { exclusiveMaximum: 5.5 },
        { exclusiveMaximum: 5.4 },
      ),
    ).toBe(false)
    expect(
      schemaDescribesSubset({ maximum: 5.5 }, { exclusiveMaximum: 5.6 }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ maximum: 5.5 }, { exclusiveMaximum: 5.4 }),
    ).toBe(false)
    expect(
      schemaDescribesSubset({ exclusiveMaximum: 5.5 }, { maximum: 5.6 }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ exclusiveMaximum: 5.5 }, { maximum: 5.4 }),
    ).toBe(null)
    expect(
      schemaDescribesSubset({ exclusiveMaximum: 5.5 }, { maximum: 5.5 }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ maximum: 5.5 }, { exclusiveMaximum: 5.5 }),
    ).toBe(false)
    expect(schemaDescribesSubset({ exclusiveMaximum: 0 }, { maximum: 0 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ maximum: 0 }, { exclusiveMaximum: 0 })).toBe(
      false,
    )
  })

  it('works with number maximum', () => {
    expect(schemaDescribesSubset({ maximum: 5.5 }, {})).toBe(true)
    expect(schemaDescribesSubset({ maximum: 5.5 }, { maximum: 5.6 })).toBe(true)
    expect(schemaDescribesSubset({ maximum: 5.5 }, { maximum: 5.4 })).toBe(null)
    expect(schemaDescribesSubset({ maximum: 0 }, { maximum: 5.6 })).toBe(true)
  })

  it('works with multipleOf minimum === maximum', () => {
    expect(
      schemaDescribesSubset({ minimum: 10, maximum: 10 }, { multipleOf: 5 }),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ minimum: 10, maximum: 10 }, { multipleOf: 3 }),
    ).toBe(false)
  })

  it(`works with minimum/maximum/multipleOf`, () => {
    expect(
      schemaDescribesSubset(
        { type: 'number', minimum: 2, multipleOf: 10 },
        { type: 'number', minimum: 8 },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { type: 'number', minimum: 2, multipleOf: 5 },
        { type: 'number', minimum: 8 },
      ),
    ).toBe(false)
  })

  it('returns true if multipleOf is a multiple of the other multipleOf', () => {
    expect(schemaDescribesSubset({ multipleOf: 10 }, { multipleOf: 5 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ multipleOf: 5 }, { multipleOf: 10 })).toBe(
      null,
    )
    expect(
      schemaDescribesSubset(
        { multipleOf: 10, minimum: 15, maximum: 100 },
        { multipleOf: 5 },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { multipleOf: 10 },
        { anyOf: [{ multipleOf: 5 }, { multipleOf: 2 }] },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ type: 'integer' }, { multipleOf: 0.1 }),
    ).toBe(true)
    expect(schemaDescribesSubset({ type: 'integer' }, { multipleOf: 2 })).toBe(
      null,
    )

    expect(
      schemaDescribesSubset({ multipleOf: 4.18 }, { multipleOf: 0.01 }),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { multipleOf: 53.198098 },
        { multipleOf: 0.0000001 },
      ),
    ).toBe(true)
  })

  it('works with finite multipleOf', () => {
    expect(
      schemaDescribesSubset(
        { minimum: 10, maximum: 30, multipleOf: 5 },
        { anyOf: [{ multipleOf: 3 }, { multipleOf: 20 }, { enum: [10, 25] }] },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { minimum: 10, maximum: 30, multipleOf: 5 },
        { anyOf: [{ multipleOf: 3 }, { multipleOf: 20 }, { enum: [10] }] },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { minimum: 10, maximum: 30, multipleOf: 5 },
        { anyOf: [{ multipleOf: 20 }, { enum: [10, 25] }] },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { minimum: 10, maximum: 30, multipleOf: 5 },
        { anyOf: [{ multipleOf: 3 }, { multipleOf: 20 }, { enum: [10, 10] }] },
      ),
    ).toBe(null)
  })
})

describe(`${toDNF.name} using number built-in plugin`, () => {
  it('creates the expected dnf', () => {
    expect(
      toDNF({
        type: 'number',
        allOf: [
          { minimum: 5 },
          { exclusiveMinimum: 8 },
          { maximum: 17 },
          { maximum: 19 },
          { multipleOf: 5 },
          { multipleOf: 3 },
        ],
        not: { const: 5 },
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "const": 15,
          },
        ],
      }
    `)

    expect(
      toDNF({
        type: 'number',
        allOf: [
          { minimum: 5 },
          { exclusiveMinimum: 15 },
          { maximum: 117 },
          { maximum: 119 },
          { multipleOf: 5 },
        ],
        not: { multipleOf: 3 },
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "multipleOf": 3,
                },
              },
            ],
            "maximum": 117,
            "minimum": 15,
            "multipleOf": 5,
            "type": "number",
          },
        ],
      }
    `)
  })
})
