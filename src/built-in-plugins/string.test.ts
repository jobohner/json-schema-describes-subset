import { describe, it, expect } from 'vitest'

import { schemaDescribesSubset } from '../schema-describes-subset/index.js'
import { toDNF } from '../dnf/index.js'
import { MaxLengthAtomicSchema, MinLengthAtomicSchema } from './string.js'

describe(`${toDNF.name} using string built-in plugin`, () => {
  it('returns const on 0 maxLength', () => {
    expect(toDNF({ maxLength: 0 }, {})).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "const": null,
          },
          {
            "const": true,
          },
          {
            "const": false,
          },
          {
            "const": "",
          },
          {
            "type": "number",
          },
          {
            "type": "array",
          },
          {
            "type": "object",
          },
        ],
      }
    `)
  })

  it('returns the expected dnf', () => {
    expect(
      toDNF({
        minLength: 10,
        maxLength: 100,
        not: { pattern: 'b+' },
        pattern: 'a+',
        allOf: [{ minLength: 20, maxLength: 200, pattern: 'c+' }],
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "pattern": "c+",
              },
              {
                "pattern": "a+",
              },
              {
                "not": {
                  "pattern": "b+",
                },
              },
            ],
            "maxLength": 100,
            "minLength": 20,
            "type": "string",
          },
        ],
      }
    `)
  })
})

describe(`${schemaDescribesSubset.name} using string built-in plugin`, () => {
  it('works with string minLength', () => {
    expect(schemaDescribesSubset({ minLength: 5 }, {})).toBe(true)
    expect(schemaDescribesSubset({ minLength: 5 }, { minLength: 2 })).toBe(true)
    expect(schemaDescribesSubset({ minLength: 5 }, { minLength: 10 })).toBe(
      null,
    )
    expect(schemaDescribesSubset({ minLength: 0 }, { minLength: 0 })).toBe(true)
    expect(schemaDescribesSubset({ minLength: 0 }, { minLength: -10 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ minLength: 5 }, { minLength: 0 })).toBe(true)
    expect(schemaDescribesSubset({ minLength: 0 }, { minLength: 10 })).toBe(
      null,
    )
  })

  it('works with string maxLength', () => {
    expect(schemaDescribesSubset({ maxLength: 5 }, {})).toBe(true)
    expect(schemaDescribesSubset({ maxLength: 5 }, { maxLength: 2 })).toBe(null)
    expect(schemaDescribesSubset({ maxLength: 5 }, { maxLength: 10 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ maxLength: 0 }, { maxLength: 10 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ maxLength: 0 }, { maxLength: 0 })).toBe(true)
    expect(schemaDescribesSubset({ maxLength: 5 }, { maxLength: 0 })).toBe(null)
  })

  it('works with string minLength and maxLength', () => {
    expect(
      schemaDescribesSubset(
        { minLength: 2, maxLength: 5 },
        { minLength: 2, maxLength: 10 },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { minLength: 1, maxLength: 5 },
        { minLength: 2, maxLength: 10 },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { minLength: 3, maxLength: 12 },
        { minLength: 2, maxLength: 10 },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { minLength: 1, maxLength: 12 },
        { minLength: 2, maxLength: 10 },
      ),
    ).toBe(null)
    expect(schemaDescribesSubset({ minLength: 10 }, { maxLength: 5 })).toBe(
      null,
    )
  })

  it('treats negative maxLength as not satisfiable', () => {
    expect(
      schemaDescribesSubset(
        { type: 'string', maxLength: -5 },
        { type: 'null' },
      ),
    ).toBe(true)
  })

  it('treats minLength > maxLength as not satisfiable', () => {
    expect(
      schemaDescribesSubset(
        { type: 'string', maxLength: 5, minLength: 10 },
        { type: 'null' },
      ),
    ).toBe(true)
  })

  it('works with not whole minLength', () => {
    expect(schemaDescribesSubset({ minLength: 2.5 }, {})).toBe(true)
    expect(schemaDescribesSubset({ minLength: 2.5 }, { minLength: 2 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ minLength: 2.5 }, { minLength: 3 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ minLength: 2.5 }, { minLength: 4 })).toBe(
      null,
    )
  })

  it('works with not whole maxLength', () => {
    expect(schemaDescribesSubset({ maxLength: 2.5 }, {})).toBe(true)
    expect(schemaDescribesSubset({ maxLength: 2.5 }, { maxLength: 1 })).toBe(
      null,
    )
    expect(schemaDescribesSubset({ maxLength: 2.5 }, { maxLength: 2 })).toBe(
      true,
    )
    expect(schemaDescribesSubset({ maxLength: 2.5 }, { maxLength: 3 })).toBe(
      true,
    )
  })

  it('works with string patterns', () => {
    expect(schemaDescribesSubset({ pattern: '^[abc]{3}$' }, {})).toBe(true)
    expect(
      schemaDescribesSubset(
        { pattern: '^[abc]{3}$' },
        { pattern: '^[abc]{3}$' },
      ),
    ).toBe(true)
    expect(schemaDescribesSubset({}, { pattern: '^[abc]{3}$' })).toBe(null)
    expect(schemaDescribesSubset({}, { pattern: '' })).toBe(null)

    // false negative by design:
    expect(
      schemaDescribesSubset(
        { pattern: '^[abc]{3}$' },
        { pattern: '^[abcdef]{3}$' },
      ),
    ).toBe(null)
  })

  it('works with string constraints and consts', () => {
    expect(schemaDescribesSubset({ const: 'a' }, { pattern: 'a+' })).toBe(true)
    expect(schemaDescribesSubset({ const: 'b' }, { pattern: 'a+' })).toBe(false)
    expect(schemaDescribesSubset({ const: 'abc' }, { minLength: 3 })).toBe(true)
    expect(schemaDescribesSubset({ const: 'ab' }, { minLength: 3 })).toBe(false)
    expect(schemaDescribesSubset({ const: 'abc' }, { maxLength: 3 })).toBe(true)
    expect(schemaDescribesSubset({ const: 'abcd' }, { maxLength: 3 })).toBe(
      false,
    )
  })
})

describe(MinLengthAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new MinLengthAtomicSchema(3)
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "minLength": 3,
      }
    `)
  })
})

describe(MaxLengthAtomicSchema, () => {
  it('creates the expected JSON', () => {
    const schema = new MaxLengthAtomicSchema(3)
    expect(schema.toJSONSchema()).toMatchInlineSnapshot(`
      {
        "maxLength": 3,
      }
    `)
  })
})
