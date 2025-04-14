import { describe, it, expect } from 'vitest'

import { schemaDescribesSubset } from '../schema-describes-subset/index.js'
import { splitToRawDNF } from '../atomic-schema/split/index.js'

import {
  ItemsAtomicSchema,
  PrefixItemAtomicSchema,
  UnevaluatedItemsAtomicSchema,
  mergeItemsSchemas,
} from './array.js'
import { schemaDescribesEmptySet } from '../index.js'
import { toDNF } from '../dnf/index.js'
import { toInternalOptions } from '../options/options.js'

const options = toInternalOptions({})

describe(UnevaluatedItemsAtomicSchema, () => {
  it('throws on `toJSON`', () => {
    const schema = new UnevaluatedItemsAtomicSchema()
    expect(() => schema.toJSONSchema()).toThrowErrorMatchingInlineSnapshot(
      `[Error: unimplemented]`,
    )
  })
})

describe(mergeItemsSchemas, () => {
  it('returns the merged prefixItems', () => {
    expect(mergeItemsSchemas([], [])).toMatchInlineSnapshot(`[]`)

    expect(mergeItemsSchemas([], [])).toMatchInlineSnapshot(`[]`)

    expect(
      mergeItemsSchemas(
        [new PrefixItemAtomicSchema(2, { type: ['array', 'boolean'] })],
        [],
      ),
    ).toMatchInlineSnapshot(`
      [
        [],
        [],
        [
          {
            "type": [
              "array",
              "boolean",
            ],
          },
        ],
      ]
    `)

    expect(
      mergeItemsSchemas(
        [
          new PrefixItemAtomicSchema(2, { type: ['array', 'boolean'] }),
          new PrefixItemAtomicSchema(0, {
            type: ['array', 'boolean', 'string'],
          }),
          new PrefixItemAtomicSchema(2, { type: ['boolean'] }),
        ],
        [],
      ),
    ).toMatchInlineSnapshot(`
      [
        [
          {
            "type": [
              "array",
              "boolean",
              "string",
            ],
          },
        ],
        [],
        [
          {
            "type": [
              "array",
              "boolean",
            ],
          },
          {
            "type": [
              "boolean",
            ],
          },
        ],
      ]
    `)
  })

  it('returns the merged prefixItems and items', () => {
    expect(
      mergeItemsSchemas(
        [
          new PrefixItemAtomicSchema(2, { type: ['array', 'boolean'] }),
          new PrefixItemAtomicSchema(0, {
            type: ['array', 'boolean', 'string'],
          }),
          new PrefixItemAtomicSchema(2, { type: ['boolean'] }),
        ],
        [
          new ItemsAtomicSchema(2, { type: ['array', 'boolean'] }),
          new ItemsAtomicSchema(1, { type: 'array' }),
        ],
      ),
    ).toMatchInlineSnapshot(`
      [
        [
          {
            "type": [
              "array",
              "boolean",
              "string",
            ],
          },
        ],
        [
          {
            "type": "array",
          },
        ],
        [
          {
            "type": [
              "array",
              "boolean",
            ],
          },
          {
            "type": [
              "boolean",
            ],
          },
          {
            "type": [
              "array",
              "boolean",
            ],
          },
          {
            "type": "array",
          },
        ],
      ]
    `)
  })
})

describe(`${splitToRawDNF.name} using array built-in plugin`, () => {
  it('works with minItems and maxItems', () => {
    expect(splitToRawDNF({ minItems: 5, maxItems: 7 }, options).toJSONSchema())
      .toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "minItems": 5,
              },
              {
                "maxItems": 7,
              },
            ],
          },
        ],
      }
    `)
  })

  it('works with items and prefixItems', () => {
    expect(
      splitToRawDNF(
        {
          prefixItems: [true, { type: 'string' }, { type: 'boolean' }],
          items: { type: 'number' },
        },
        options,
      ).toJSONSchema(),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "items": {
                  "type": "number",
                },
                "prefixItems": [
                  true,
                  true,
                  true,
                ],
              },
              {
                "prefixItems": [
                  true,
                ],
              },
              {
                "prefixItems": [
                  true,
                  {
                    "type": "string",
                  },
                ],
              },
              {
                "prefixItems": [
                  true,
                  true,
                  {
                    "type": "boolean",
                  },
                ],
              },
            ],
          },
        ],
      }
    `)

    expect(splitToRawDNF({ items: { type: 'number' } }, options).toJSONSchema())
      .toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "items": {
                  "type": "number",
                },
              },
            ],
          },
        ],
      }
    `)

    expect(
      splitToRawDNF(
        { not: { items: { type: 'number' } } },
        options,
      ).toJSONSchema(),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "items": {
                    "type": "number",
                  },
                },
              },
              {
                "type": [
                  "array",
                ],
              },
            ],
          },
        ],
      }
    `)

    expect(
      splitToRawDNF(
        {
          prefixItems: [true, { type: 'string' }],
        },
        options,
      ).toJSONSchema(),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "prefixItems": [
                  true,
                ],
              },
              {
                "prefixItems": [
                  true,
                  {
                    "type": "string",
                  },
                ],
              },
            ],
          },
        ],
      }
    `)

    expect(
      splitToRawDNF(
        {
          not: {
            prefixItems: [true, { type: 'string' }],
          },
        },
        options,
      ).toJSONSchema(),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "type": [
                  "array",
                ],
              },
              {
                "minItems": 1,
              },
              {
                "prefixItems": [
                  {
                    "not": true,
                  },
                ],
              },
            ],
          },
          {
            "allOf": [
              {
                "type": [
                  "array",
                ],
              },
              {
                "minItems": 2,
              },
              {
                "prefixItems": [
                  true,
                  {
                    "not": {
                      "type": "string",
                    },
                  },
                ],
              },
            ],
          },
        ],
      }
    `)
  })

  it('works with contains', () => {
    expect(
      splitToRawDNF(
        {
          contains: { type: 'boolean' },
          minContains: 2,
          maxContains: 5,
        },
        options,
      ).toJSONSchema(),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "contains": {
                  "type": "boolean",
                },
                "maxContains": 5,
                "minContains": 2,
              },
            ],
          },
        ],
      }
    `)

    expect(
      splitToRawDNF(
        {
          contains: { type: 'boolean' },
        },
        options,
      ).toJSONSchema(),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "contains": {
                  "type": "boolean",
                },
                "minContains": 1,
              },
            ],
          },
        ],
      }
    `)
  })

  it('works with uniqueItems', () => {
    expect(splitToRawDNF({ uniqueItems: true }, options).toJSONSchema())
      .toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "uniqueItems": true,
              },
            ],
          },
        ],
      }
    `)
  })
})

describe(`${toDNF.name} using array built-in plugin`, () => {
  it('returns a const schema for maxItems === 0', () => {
    expect(toDNF({ maxItems: 0 }, {})).toMatchInlineSnapshot(`
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
            "const": [],
          },
          {
            "type": "number",
          },
          {
            "type": "string",
          },
          {
            "type": "object",
          },
        ],
      }
    `)
  })

  it('works with uniqueItems', () => {
    expect(toDNF({ uniqueItems: true }, {})).toMatchInlineSnapshot(`
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
            "type": "number",
          },
          {
            "type": "string",
          },
          {
            "type": "array",
            "uniqueItems": true,
          },
          {
            "type": "object",
          },
        ],
      }
    `)

    expect(toDNF({ uniqueItems: false }, {})).toBe(true)

    expect(toDNF({ not: { uniqueItems: true } }, {})).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "uniqueItems": true,
                },
              },
            ],
            "type": "array",
          },
        ],
      }
    `)

    expect(toDNF({ not: { uniqueItems: false } }, {})).toBe(false)
  })

  it('works with negated items and prefixItems', () => {
    expect(
      toDNF(
        {
          not: {
            prefixItems: [{ type: 'string' }, { type: 'boolean' }],
            items: { type: 'number' },
          },
        },
        {},
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "items": {
                    "type": "number",
                  },
                  "prefixItems": [
                    true,
                    true,
                  ],
                },
              },
            ],
            "minItems": 3,
            "type": "array",
          },
          {
            "minItems": 1,
            "prefixItems": [
              {
                "not": {
                  "type": "string",
                },
              },
            ],
            "type": "array",
          },
          {
            "minItems": 2,
            "prefixItems": [
              {
                "not": {
                  "type": "boolean",
                },
              },
            ],
            "type": "array",
          },
        ],
      }
    `)

    expect(
      toDNF(
        {
          not: {
            items: { type: 'number' },
          },
        },
        {},
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "items": {
                    "type": "number",
                  },
                },
              },
            ],
            "minItems": 1,
            "type": "array",
          },
        ],
      }
    `)
  })

  it('works with an extensive example', () => {
    expect(
      toDNF({
        type: 'array',
        minItems: 2,
        maxItems: 100,
        items: { type: ['number', 'string', 'boolean'] },
        contains: { type: 'string' },
        minContains: 3,
        prefixItems: [
          { type: ['number', 'string', 'null'] },
          { type: 'array' },
        ],
        allOf: [
          {
            minItems: 1,
            maxItems: 90,
            uniqueItems: true,
            contains: { type: 'boolean' },
            minContains: 3,
            maxContains: 80,
            prefixItems: [{ type: ['array', 'number'] }],
          },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "contains": {
                  "type": "boolean",
                },
                "maxContains": 80,
                "minContains": 3,
              },
              {
                "contains": {
                  "type": "string",
                },
                "minContains": 3,
              },
            ],
            "items": {
              "allOf": [
                {
                  "type": [
                    "number",
                    "string",
                    "boolean",
                  ],
                },
              ],
            },
            "maxItems": 90,
            "minItems": 3,
            "prefixItems": [
              {
                "allOf": [
                  {
                    "type": [
                      "array",
                      "number",
                    ],
                  },
                  {
                    "type": [
                      "number",
                      "string",
                      "null",
                    ],
                  },
                ],
              },
              {
                "type": "array",
              },
            ],
            "type": "array",
            "uniqueItems": true,
          },
        ],
      }
    `)
  })

  it('throws on `unevaluatedItems`', () => {
    expect(() =>
      toDNF({ type: 'array', unevaluatedItems: { type: 'string' } }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'unevaluatedItems'. This currently cannot be transformed to a dnf.]`,
    )

    expect(() =>
      toDNF({
        type: 'array',
        not: { unevaluatedItems: { type: 'string' } },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'unevaluatedItems'. This currently cannot be transformed to a dnf.]`,
    )
  })

  it("doesn't throw on `unevaluatedItems` if there's another contradiction", () => {
    expect(
      toDNF({
        type: 'array',
        unevaluatedItems: { type: 'string' },
        minItems: 5,
        maxItems: 4,
      }),
    ).toMatchInlineSnapshot(`false`)
  })
})

describe(`${schemaDescribesEmptySet.name} using array built-in plugin`, () => {
  it('works with minItems and items', () => {
    expect(
      schemaDescribesEmptySet({ type: 'array', minItems: 1, items: false }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        minItems: 1,
        items: { type: 'boolean' },
      }),
    ).toBe(null)
  })

  it('works with minContains and maxContains with the same contains', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'array',
        contains: { type: 'number' },
        minContains: 5,
        maxContains: 3,
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        contains: { type: 'number' },
        minContains: 5,
        maxContains: 7,
      }),
    ).toBe(null)
  })

  it('works with items, prefixItems and maxContains', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [{ type: 'boolean' }, { type: 'boolean' }],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 4,
        contains: { type: 'boolean' },
        maxContains: 2,
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [
          { type: 'number' },
          { type: 'boolean' },
          { type: 'boolean' },
        ],
        items: { type: 'boolean' },
        minItems: 4,
        maxItems: 5,
        contains: { type: 'boolean' },
        maxContains: 2,
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [{ type: 'boolean' }, { type: 'boolean' }],
        items: { type: 'boolean' },
        minItems: 5,
        maxItems: 7,
        contains: { type: 'boolean' },
        maxContains: 2,
      }),
    ).toBe(true)
  })

  it('works with items, prefixItems and minContains', () => {
    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [{ type: 'boolean' }, { type: 'boolean' }],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 4,
        contains: { type: 'number' },
        minContains: 2,
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [{ type: 'boolean' }, { type: 'boolean' }],
        items: { type: 'number' },
        minItems: 3,
        maxItems: 4,
        contains: { type: 'number' },
        minContains: 2,
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [{ type: 'number' }, { type: 'boolean' }],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 4,
        contains: { type: 'number' },
        minContains: 2,
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [{ type: 'number' }, { type: 'number' }],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 4,
        contains: { type: 'number' },
        minContains: 2,
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [
          { type: 'number' },
          { type: 'number' },
          { type: 'number' },
        ],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 4,
        contains: { type: 'number' },
        minContains: 2,
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [
          { type: 'number' },
          { type: 'number' },
          { type: 'number' },
          { type: 'number' },
        ],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 6,
        contains: { type: 'number' },
        minContains: 2,
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [{ type: 'number' }, { type: 'number' }],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 5,
        allOf: [
          {
            contains: { type: 'number', minimum: 5 },
            minContains: 2,
          },
          {
            contains: { type: 'number', maximum: 3 },
            minContains: 2,
          },
        ],
      }),
    ).toBe(true)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [{ type: 'number' }, { type: 'number' }],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 5,
        allOf: [
          {
            contains: { type: 'number', minimum: 5 },
            minContains: 2,
          },
          {
            contains: { type: 'number', maximum: 7 },
            minContains: 2,
          },
        ],
      }),
    ).toBe(null)

    expect(
      schemaDescribesEmptySet({
        type: 'array',
        prefixItems: [
          { type: 'number' },
          { type: 'number' },
          { type: 'number' },
        ],
        items: { type: 'boolean' },
        minItems: 3,
        maxItems: 6,
        allOf: [
          {
            contains: { type: 'number', minimum: 5 },
            minContains: 2,
          },
          {
            contains: { type: 'number', maximum: 3 },
            minContains: 2,
          },
        ],
      }),
    ).toBe(
      /* False negative. Not all index combinations are checked. */
      null,
    )
  })
})

describe(`${schemaDescribesSubset.name} using array built-in plugin`, () => {
  it('works with minItems and maxItems', () => {
    expect(schemaDescribesSubset({ minItems: 7 }, { minItems: 5 })).toBe(true)
    expect(schemaDescribesSubset({ minItems: 5 }, { minItems: 5 })).toBe(true)
    expect(schemaDescribesSubset({ minItems: 3 }, { minItems: 5 })).toBe(null)
    expect(schemaDescribesSubset({ maxItems: 7 }, { maxItems: 5 })).toBe(null)
    expect(schemaDescribesSubset({ maxItems: 5 }, { maxItems: 5 })).toBe(true)
    expect(schemaDescribesSubset({ maxItems: 3 }, { maxItems: 5 })).toBe(true)
    expect(
      schemaDescribesSubset(
        { minItems: 3, maxItems: 8 },
        { minItems: 2, maxItems: 10 },
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { minItems: 1, maxItems: 8 },
        { minItems: 2, maxItems: 10 },
      ),
    ).toBe(null)
    expect(
      schemaDescribesSubset(
        { minItems: 3, maxItems: 11 },
        { minItems: 2, maxItems: 10 },
      ),
    ).toBe(null)
  })

  it('works with prefixItems', () => {
    expect(
      schemaDescribesSubset(
        { prefixItems: [{ type: 'string' }, { type: 'boolean' }] },
        { prefixItems: [{ type: ['string', 'number'] }] },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { prefixItems: [{ type: 'string' }, { type: 'boolean' }] },
        { prefixItems: [{ type: ['string', 'number'] }, { type: 'boolean' }] },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { prefixItems: [{ type: 'string' }, { type: 'boolean' }] },
        { prefixItems: [{ type: ['boolean', 'number'] }] },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { prefixItems: [{ type: 'string' }, { type: 'boolean' }] },
        {
          prefixItems: [
            { type: ['string', 'number'] },
            { type: 'boolean' },
            { type: 'number' },
          ],
        },
      ),
    ).toBe(null)
  })

  it('works with items', () => {
    expect(
      schemaDescribesSubset(
        { items: { type: 'boolean' } },
        { items: { type: 'boolean' } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { items: { type: 'boolean' } },
        { items: { type: ['boolean', 'string'] } },
      ),
    ).toBe(true)
  })

  it('works with items and prefixItems', () => {
    expect(
      schemaDescribesSubset(
        {
          prefixItems: [{ type: 'string' }, { type: 'boolean' }],
          items: { type: 'object' },
        },
        { prefixItems: [{ type: ['string', 'number'] }, { type: 'boolean' }] },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          prefixItems: [{ type: 'string' }, { type: 'boolean' }],
          items: { type: 'object' },
        },
        {
          prefixItems: [
            { type: ['string', 'number'] },
            { type: 'boolean' },
            { type: 'object' },
          ],
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          prefixItems: [{ type: 'string' }],
          items: { type: 'boolean' },
        },
        {
          prefixItems: [
            { type: ['string', 'number'] },
            { type: 'boolean' },
            { type: 'boolean' },
          ],
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          prefixItems: [{ type: 'string' }],
          items: { type: 'boolean' },
        },
        {
          prefixItems: [
            { type: ['string', 'number'] },
            { type: 'boolean' },
            { type: 'string' },
          ],
        },
      ),
    ).toBe(null)
  })

  it('works with contains', () => {
    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' } },
        { contains: { type: 'boolean' } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' } },
        { contains: { type: ['boolean', 'number'] } },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 5 },
        { contains: { type: ['boolean', 'number'] }, minContains: 3 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 5 },
        { contains: { type: ['boolean', 'number'] }, minContains: 5 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 5 },
        { contains: { type: ['boolean', 'number'] }, minContains: 7 },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, maxContains: 5 },
        { contains: { type: ['boolean', 'number'] }, maxContains: 3 },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, maxContains: 5 },
        { contains: { type: ['boolean', 'number'] }, maxContains: 7 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, maxContains: 5 },
        { contains: { type: ['boolean', 'number'] }, maxContains: 5 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 3, maxContains: 5 },
        {
          contains: { type: ['boolean', 'number'] },
          minContains: 1,
          maxContains: 7,
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 3, maxContains: 5 },
        {
          contains: { type: ['boolean', 'number'] },
          minContains: 3,
          maxContains: 5,
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 0, maxContains: 5 },
        {
          contains: { type: ['boolean', 'number'] },
          minContains: 1,
          maxContains: 7,
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 3, maxContains: 9 },
        {
          contains: { type: ['boolean', 'number'] },
          minContains: 1,
          maxContains: 7,
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 0, maxContains: 9 },
        {
          contains: { type: ['boolean', 'number'] },
          minContains: 1,
          maxContains: 7,
        },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'boolean' }, minContains: 3, maxContains: 5 },
        {
          contains: { type: ['boolean', 'number'] },
          minContains: 0,
          maxContains: Infinity,
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          contains: { type: 'boolean' },
          minContains: 0,
          maxContains: Infinity,
        },
        {
          contains: { type: ['boolean', 'number'] },
          minContains: 0,
          maxContains: Infinity,
        },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          type: 'array',
          contains: { type: 'boolean' },
          minContains: 6,
          maxContains: 1,
        },
        {
          contains: { type: ['boolean', 'number'] },
          minContains: 5,
          maxContains: 2,
        },
      ),
    ).toBe(true)
  })

  it('works with contains and minItems', () => {
    expect(
      schemaDescribesSubset(
        { contains: { type: 'number' }, minContains: 5 },
        { minItems: 5 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'number' }, minContains: 5 },
        { minItems: 4 },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { contains: { type: 'number' }, minContains: 5 },
        { minItems: 6 },
      ),
    ).toBe(null)
  })

  it('works with basic uniqueItems', () => {
    expect(
      schemaDescribesSubset({ uniqueItems: true }, { uniqueItems: true }),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ uniqueItems: false }, { uniqueItems: false }),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ uniqueItems: true }, { uniqueItems: false }),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ uniqueItems: false }, { uniqueItems: true }),
    ).toBe(null)
  })

  it('works with prefixItems and uniqueItems', () => {
    expect(
      schemaDescribesSubset(
        {
          prefixItems: [
            { type: 'number' },
            { type: 'boolean' },
            { type: 'string' },
            { type: 'number' },
          ],
          maxItems: 3,
        },
        { uniqueItems: true },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          prefixItems: [{ type: 'number' }, { type: 'boolean' }],
          items: { type: 'string' },
          maxItems: 3,
        },
        { uniqueItems: true },
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        {
          prefixItems: [
            { type: 'number' },
            { type: 'boolean' },
            { type: 'string' },
            { type: 'number' },
          ],
          maxItems: 4,
        },
        { uniqueItems: true },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          prefixItems: [
            { type: 'number' },
            { type: 'boolean' },
            { type: 'string' },
          ],
          maxItems: 4,
        },
        { uniqueItems: true },
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        {
          prefixItems: [{ type: 'number' }, { type: 'boolean' }],
          items: { type: 'string' },
          maxItems: 4,
        },
        { uniqueItems: true },
      ),
    ).toBe(null)
  })

  it('works with `unevaluatedItems` (to a minimal degree)', () => {
    expect(
      schemaDescribesSubset(
        { type: 'object' },
        { unevaluatedItems: { type: 'boolean' } },
      ),
    ).toBe(true)

    expect(() =>
      schemaDescribesSubset(
        { type: 'array' },
        { unevaluatedItems: { type: 'boolean' } },
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'unevaluatedItems'. This currently cannot be transformed to a dnf.]`,
    )
  })
})
