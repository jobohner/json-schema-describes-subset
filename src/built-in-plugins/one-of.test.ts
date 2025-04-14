import { describe, it, expect } from 'vitest'
import { schemaDescribesEmptySet, toDNF } from '../index.js'

describe(`${schemaDescribesEmptySet.name} using oneOf plugin`, () => {
  it('returns the expected result', () => {
    expect(schemaDescribesEmptySet({ oneOf: [true, false, false] })).toBe(false)
    expect(schemaDescribesEmptySet({ oneOf: [false, false, false] })).toBe(true)
    expect(schemaDescribesEmptySet({ oneOf: [true, false, true] })).toBe(true)
  })
})

describe(`${toDNF.name} using oneOf plugin`, () => {
  it('returns the expected result', () => {
    expect(
      toDNF({
        oneOf: [{ type: 'number' }, { type: 'boolean' }, { type: 'string' }],
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "const": true,
          },
          {
            "const": false,
          },
          {
            "type": "number",
          },
          {
            "type": "string",
          },
        ],
      }
    `)

    expect(
      toDNF({
        oneOf: [
          { type: ['number', 'string'] },
          { type: ['number', 'boolean'] },
          { type: ['string', 'number'] },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "const": true,
          },
          {
            "const": false,
          },
        ],
      }
    `)
  })
})
