import { describe, it, expect } from 'vitest'
import { schemaDescribesEmptySet, toDNF } from '../index.js'

describe(`${schemaDescribesEmptySet.name} using ifThenElsePlugin`, () => {
  it('returns the expected result', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'number',
        if: { minimum: 5 },
        then: { maximum: 1 },
        else: { minimum: 6 },
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'number',
        if: { minimum: 5 },
        then: { maximum: 1 },
        else: { minimum: 4 },
      }),
    ).toBe(null)

    expect(schemaDescribesEmptySet({ if: true, then: false })).toBe(true)
    expect(schemaDescribesEmptySet({ if: false, then: false })).toBe(false)
    expect(schemaDescribesEmptySet({ if: true, then: true })).toBe(false)

    expect(schemaDescribesEmptySet({ if: false, else: false })).toBe(true)
    expect(schemaDescribesEmptySet({ if: true, else: false })).toBe(false)
    expect(schemaDescribesEmptySet({ if: false, else: true })).toBe(false)
  })
})

describe(`${toDNF.name} using ifThenElsePlugin`, () => {
  it('returns the expected dnf', () => {
    expect(
      toDNF({
        type: 'number',
        if: { minimum: 5 },
        then: { maximum: 1 },
        else: { minimum: 4 },
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "const": 5,
                },
              },
            ],
            "maximum": 5,
            "minimum": 4,
            "type": "number",
          },
        ],
      }
    `)

    expect(
      toDNF({
        type: 'number',
        if: { multipleOf: 5 },
        then: { minimum: 10 },
        else: { maximum: 100 },
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "minimum": 10,
            "multipleOf": 5,
            "type": "number",
          },
          {
            "allOf": [
              {
                "not": {
                  "multipleOf": 5,
                },
              },
            ],
            "maximum": 100,
            "type": "number",
          },
          {
            "maximum": 100,
            "minimum": 10,
            "type": "number",
          },
        ],
      }
    `)
  })
})
