import { describe, it, expect } from 'vitest'
import { schemaDescribesSubset } from '../schema-describes-subset/index.js'
import { schemaDescribesEmptySet, toDNF } from '../dnf/index.js'

describe(`${schemaDescribesEmptySet.name} using ref plugin`, () => {
  it('returns the expected (possibly false negative) result', () => {
    expect(
      schemaDescribesEmptySet(
        {
          $ref: 'https://example.com/main-schema/x/y/z',
        },
        { definitions: [{ $id: 'https://example.com/main-schema/x/y/z' }] },
      ),
    ).toBe(false)

    expect(
      schemaDescribesEmptySet(
        {
          not: {
            $ref: 'https://example.com/main-schema/x/y/z',
          },
        },
        { definitions: [{ $id: 'https://example.com/main-schema/x/y/z' }] },
      ),
    ).toBe(null)
  })

  it('throws on `$dynamicAnchor`', () => {
    expect(() =>
      schemaDescribesEmptySet({ type: 'number', $dynamicAnchor: 'test' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword '$dynamicAnchor' with value 'test'. This currently cannot be transformed to a dnf.]`,
    )
  })

  it('throws on `$dynamicRef`', () => {
    expect(() =>
      schemaDescribesEmptySet({ type: 'number', $dynamicRef: '#test' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword '$dynamicRef' with value '#test'. This currently cannot be transformed to a dnf.]`,
    )
  })
})

describe(`${schemaDescribesSubset.name} using ref plugin`, () => {
  it('works with non relative refs', () => {
    expect(
      schemaDescribesSubset(
        { $ref: 'https://example.com/main-schema/x/y/z' },
        { $ref: 'https://example.com/main-schema/x/y/z' },
        { definitions: [{ $id: 'https://example.com/main-schema/x/y/z' }] },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { $ref: 'https://example.com/main-schema/x/y/z' },
        {},
        { definitions: [{ $id: 'https://example.com/main-schema/x/y/z' }] },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { $ref: 'https://example.com/main-schema/x/y/z' },
        { $ref: 'https://example.com/main-schema/x/y' },
        {
          definitions: [
            { $id: 'https://example.com/main-schema/x/y' },
            { $id: 'https://example.com/main-schema/x/y/z' },
          ],
        },
      ),
    ).toBe(null)
  })

  it('throws on relative refs without baseURI', () => {
    expect(() =>
      schemaDescribesSubset(
        { $ref: '/x/y/z#fragment/a/b' },
        { $ref: '/x/y/z#fragment/a/b' },
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: can't resolve reference /x/y/z#fragment/a/b from id #]`,
    )

    expect(() =>
      schemaDescribesSubset({ $ref: '/x/y/z#fragment/a/b' }, {}),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: can't resolve reference /x/y/z#fragment/a/b from id #]`,
    )
  })

  it('works with relative refs with baseURI', () => {
    expect(
      schemaDescribesSubset(
        { $ref: '/x/y/z' },
        { $ref: 'https://example.com/x/y/z' },
        {
          baseURI: 'https://example.com/main-schema',
          definitions: [{ $id: 'https://example.com/x/y/z' }],
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { $ref: '/x/y/z' },
        {},
        {
          baseURI: 'https://example.com/main-schema',
          definitions: [{ $id: 'https://example.com/x/y/z' }],
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { $ref: 'https://example.com/x/y' },
        { $ref: '/x/y/z' },
        {
          baseURI: [null, 'https://example.com/main-schema'],
          definitions: [
            { $id: 'https://example.com/x/y' },
            { $id: 'https://example.com/x/y/z' },
          ],
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          $ref: '/x/y/z',
        },
        { $ref: 'https://example.com/x/y/z' },
        {
          baseURI: 'https://example.com/main-schema',
          definitions: [{ $id: 'https://example.com/x/y/z' }],
        },
      ),
    ).toBe(true)
  })
})

describe(`${toDNF.name} using ref plugin`, () => {
  it('works with non relative refs', () => {
    /* TODO: `{ $ref: <string> } as disjunct would actually be prettier` */
    expect(
      toDNF(
        {
          $ref: 'https://example.com/main-schema/x/y/z',
        },
        {
          definitions: [{ $id: 'https://example.com/main-schema/x/y/z' }],
        },
      ),
    ).toMatchInlineSnapshot(`
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
            "allOf": [
              {
                "$ref": "https://example.com/main-schema/x/y/z",
              },
            ],
            "type": "number",
          },
          {
            "allOf": [
              {
                "$ref": "https://example.com/main-schema/x/y/z",
              },
            ],
            "type": "string",
          },
          {
            "allOf": [
              {
                "$ref": "https://example.com/main-schema/x/y/z",
              },
            ],
            "type": "array",
          },
          {
            "allOf": [
              {
                "$ref": "https://example.com/main-schema/x/y/z",
              },
            ],
            "type": "object",
          },
        ],
      }
    `)
  })

  it('throws on non $dynamicRef', () => {
    expect(() =>
      toDNF({
        $dynamicRef: 'https://example.com/main-schema/x/y/z#fragment/a/b',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword '$dynamicRef' with value 'https://example.com/main-schema/x/y/z#fragment/a/b'. This currently cannot be transformed to a dnf.]`,
    )
  })

  it('works with relative refs', () => {
    expect(
      toDNF(
        {
          $id: 'https://example.com/main-schema/x',
          $ref: '/y/z',
        },
        { definitions: [{ $id: 'https://example.com/y/z' }] },
      ),
    ).toMatchInlineSnapshot(`
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
            "allOf": [
              {
                "$ref": "https://example.com/y/z",
              },
            ],
            "type": "number",
          },
          {
            "allOf": [
              {
                "$ref": "https://example.com/y/z",
              },
            ],
            "type": "string",
          },
          {
            "allOf": [
              {
                "$ref": "https://example.com/y/z",
              },
            ],
            "type": "array",
          },
          {
            "allOf": [
              {
                "$ref": "https://example.com/y/z",
              },
            ],
            "type": "object",
          },
        ],
      }
    `)

    expect(
      toDNF(
        {
          $id: './u/v',
          allOf: [
            {
              $id: './s/t',
              type: ['number', 'string'],
              $ref: './y/z',
            },
          ],
        },
        {
          baseURI: 'https://example.com/main-schema/x',
          definitions: [{ $id: 'https://example.com/main-schema/u/s/y/z' }],
        },
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "$ref": "https://example.com/main-schema/u/s/y/z",
              },
            ],
            "type": "number",
          },
          {
            "allOf": [
              {
                "$ref": "https://example.com/main-schema/u/s/y/z",
              },
            ],
            "type": "string",
          },
        ],
      }
    `)
  })

  it('throws on relative `$dynamicRef`', () => {
    expect(() =>
      toDNF({
        $id: 'https://example.com/main-schema/x',
        $dynamicRef: '/y/z#fragment/a/b',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword '$dynamicRef' with value 'https://example.com/y/z#fragment/a/b'. This currently cannot be transformed to a dnf.]`,
    )
  })
})
