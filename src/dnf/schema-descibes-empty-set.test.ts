import { describe, it, expect } from 'vitest'

import { schemaDescribesEmptySet } from './dnf.js'

describe(schemaDescribesEmptySet, () => {
  it('works with boolean schemas', () => {
    expect(schemaDescribesEmptySet(true)).toBe(false)
    expect(schemaDescribesEmptySet(false)).toBe(true)
  })

  it('works with negated boolean schemas', () => {
    expect(schemaDescribesEmptySet({ not: true })).toBe(true)
    expect(schemaDescribesEmptySet({ not: false })).toBe(false)
  })

  it('works with empty schema', () => {
    expect(schemaDescribesEmptySet({})).toBe(false)
    expect(
      schemaDescribesEmptySet({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
      }),
    ).toBe(false)
  })

  it('works with empty negated schema', () => {
    expect(schemaDescribesEmptySet({ not: {} })).toBe(true)
    expect(
      schemaDescribesEmptySet({ not: { $id: 'https://example.com/test' } }),
    ).toBe(true)
  })

  it('works with simple atomic rule schema', () => {
    expect(
      schemaDescribesEmptySet({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'number',
        minimum: 5,
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        minimum: 5,
      }),
    ).toBe(false)
  })

  it('works with empty simplification plugin', () => {
    expect(
      schemaDescribesEmptySet({ type: 'number', minimum: 2 }, { plugins: [] }),
    ).toBe(null)

    expect(schemaDescribesEmptySet({ minimum: 2 }, { plugins: [] })).toBe(false)

    expect(
      schemaDescribesEmptySet(
        { type: 'number', minimum: 2 },
        {
          plugins: [
            [
              {
                appliesToJSONSchemaType: [],
                mergeableKeywords: [],
                simplify: (): { const: null } => ({ const: null }),
              },
            ],
          ],
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet(
        { minimum: 2 },
        {
          plugins: [
            [
              {
                appliesToJSONSchemaType: [],
                mergeableKeywords: [],
                simplify: (): { const: null } => ({ const: null }),
              },
            ],
          ],
        },
      ),
    ).toBe(false)
  })

  it('works with multiple types', () => {
    expect(
      schemaDescribesEmptySet({
        type: ['number', 'string'],
        minimum: 5,
        maximum: 2,
      }),
    ).toBe(null)
    expect(
      schemaDescribesEmptySet({
        type: ['number', 'string'],
        minimum: 5,
        maximum: 2,
        minLength: 5,
        maxLength: 2,
      }),
    ).toBe(true)
    expect(
      schemaDescribesEmptySet({ type: ['number'], minimum: 5, maximum: 2 }),
    ).toBe(true)
  })
})
