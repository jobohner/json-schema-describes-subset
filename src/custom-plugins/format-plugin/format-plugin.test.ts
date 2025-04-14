import { describe, it, expect, expectTypeOf } from 'vitest'

import { schemaDescribesSubset } from '../../schema-describes-subset/index.js'
import {
  schemaDescribesEmptySet,
  toDNF,
  type DefaultDNF,
  type DNF,
} from '../../dnf/index.js'

import {
  formatPlugin,
  StringFormatAtomicSchema,
  type FormatConjunctionSchema,
  type StringFormatName,
} from './format-plugin.js'
import type {
  BuiltInOrOptionsSimplificationPlugin,
  Options,
} from '../../options/index.js'
import type {
  BuiltInSimplificationPlugin,
  RefConjunctionSchemaAllOfElement,
} from '../../built-in-plugins/index.js'
import type {
  ExtractionPlugin,
  SimplificationPluginMergeableKeyword,
  SimplificationPluginWithType,
  ValidationPlugin,
  SimplificationPlugin,
} from '../../plugin/index.js'

const options = { plugins: [formatPlugin] } as const satisfies Options

describe(StringFormatAtomicSchema, () => {
  it('can create the expected json schema', () => {
    expect(new StringFormatAtomicSchema('date-time').toJSONSchema())
      .toMatchInlineSnapshot(`
        {
          "format": "date-time",
        }
      `)
  })
})

describe('formatPlugin', () => {
  it('contains the expected (sub-)plugins', () => {
    expect(formatPlugin).toMatchInlineSnapshot(`
      [
        {
          "modifyAjv": [Function],
        },
        {
          "extract": [Function],
        },
        {
          "appliesToJSONSchemaType": "string",
          "mergeableKeywords": [],
          "simplify": [Function],
        },
      ]
    `)

    expectTypeOf(formatPlugin[0]).toEqualTypeOf<ValidationPlugin>()
    expectTypeOf(formatPlugin[1]).toEqualTypeOf<ExtractionPlugin>()
    expectTypeOf(formatPlugin[2]).toEqualTypeOf<
      SimplificationPlugin<
        'string',
        FormatConjunctionSchema<StringFormatName>,
        never
      >
    >()

    expectTypeOf(formatPlugin).toEqualTypeOf<
      [
        ValidationPlugin,
        ExtractionPlugin,
        SimplificationPlugin<
          'string',
          FormatConjunctionSchema<StringFormatName>,
          never
        >,
      ]
    >()
  })
})

describe('internal const validation using formatPlugin', () => {
  it('validates int32', () => {
    expect(
      schemaDescribesSubset({ const: 5 }, { format: 'int32' }, options),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ const: '5' }, { format: 'int32' }, options),
    ).toBe(true)
    expect(
      schemaDescribesSubset({ const: 5.5 }, { format: 'int32' }, options),
    ).toBe(false)
    expect(
      schemaDescribesSubset({ const: '5.5' }, { format: 'int32' }, options),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { const: 2147483647 },
        { format: 'int32' },
        options,
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { const: '2147483647' },
        { format: 'int32' },
        options,
      ),
    ).toBe(true)
    expect(
      schemaDescribesSubset(
        { const: 2147483648 },
        { format: 'int32' },
        options,
      ),
    ).toBe(false)
    expect(
      schemaDescribesSubset(
        { const: '2147483648' },
        { format: 'int32' },
        options,
      ),
    ).toBe(true)
  })

  it('ignores unspecified formats', () => {
    expect(
      schemaDescribesSubset(
        { const: 5 },
        { format: 'unspecified-test-format-abc' },
        options,
      ),
    ).toBe(true)
  })

  it('validates byte', () => {
    expect(
      schemaDescribesSubset(
        { const: /* 'Hello World!' */ 'SGVsbG8gV29ybGQh' },
        { format: 'byte' },
        options,
      ),
    ).toBe(true)
  })

  it('works with uri-templates', () => {
    expect(
      schemaDescribesSubset(
        { const: 'http://example.com/dictionary/{term:1}/{term}' },
        { format: 'uri-template' },
        options,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { const: 'http://example.com/dictionary/a/b' },
        { format: 'uri-template' },
        options,
      ),
    ).toBe(true)
  })
})

describe(`${schemaDescribesSubset.name} using formatPlugin`, () => {
  it('works with const and format', () => {
    expect(
      schemaDescribesSubset(
        { const: '2000-01-01' },
        { format: 'date' },
        options,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { const: 'not-a-date' },
        { format: 'date' },
        options,
      ),
    ).toBe(false)

    expect(
      schemaDescribesSubset({ const: 5 }, { format: 'date' }, options),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ const: 5 }, { format: 'int32' }, options),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ const: '5' }, { format: 'int32' }, options),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ const: 5.5 }, { format: 'int32' }, options),
    ).toBe(false)
  })

  it('returns true with same unspecified formats', () => {
    expect(
      schemaDescribesSubset(
        { format: 'unspecified-test-format-abc' },
        { format: 'unspecified-test-format-abc' },
        options,
      ),
    ).toBe(true)
  })

  it('returns true with one unspecified format', () => {
    expect(
      schemaDescribesSubset(
        {},
        { format: 'unspecified-test-format-abc' },
        options,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { format: 'unspecified-test-format-abc' },
        {},
        options,
      ),
    ).toBe(true)

    expect(schemaDescribesSubset({}, { format: 'password' }, options)).toBe(
      true,
    )

    expect(schemaDescribesSubset({ format: 'password' }, {}, options)).toBe(
      true,
    )
  })

  it('works with string formats', () => {
    expect(
      schemaDescribesSubset(
        { format: 'date-time' },
        { format: 'date-time' },
        options,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { format: 'email' },
        { format: 'date-time' },
        options,
      ),
    ).toBe(null)
  })

  it('works with number formats', () => {
    expect(schemaDescribesSubset({ format: 'int32' }, {}, options)).toBe(true)

    expect(
      schemaDescribesSubset({ format: 'int32' }, { format: 'int64' }, options),
    ).toBe(true)

    expect(schemaDescribesSubset({ format: 'int32' }, {}, options)).toBe(true)

    expect(
      schemaDescribesSubset({ format: 'int64' }, { format: 'int64' }, options),
    ).toBe(true)

    expect(schemaDescribesSubset({ format: 'int64' }, {}, options)).toBe(true)

    expect(
      /* this is true in JavaScript, since any JSON number is needs to be
       * double precision floating point number. Will be the same in all
       * languages that treat JSON numbers as double precision floating point
       * number, but that's not specified.
       * TODO: include in doc */
      schemaDescribesSubset({ format: 'int64' }, { format: 'double' }, options),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ format: 'int32' }, { format: 'double' }, options),
    ).toBe(true)

    expect(
      schemaDescribesSubset({ format: 'float' }, { format: 'double' }, options),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { format: 'double' },
        { format: 'double' },
        options,
      ),
    ).toBe(true)

    expect(schemaDescribesSubset({}, { format: 'double' }, options)).toBe(true)

    expect(
      schemaDescribesSubset({ format: 'double' }, { format: 'float' }, options),
    ).toBe(
      // returns true because `{ format: 'float' }` will accept any number
      true,
    )

    expect(
      schemaDescribesSubset({ format: 'int64' }, { format: 'date' }, options),
    ).toBe(null)
  })

  it('works with specified and unspecified formats', () => {
    expect(
      schemaDescribesSubset(
        { format: 'date' },
        { format: 'unspecified-test-format-abc' },
        options,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { format: 'unspecified-test-format-abc' },
        { format: 'date' },
        options,
      ),
    ).toBe(null)
  })

  it('works with specified negated formats', () => {
    expect(
      schemaDescribesSubset(
        { not: { format: 'int32' } },
        { type: 'number' },
        options,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { not: { format: 'int32' } },
        { type: 'string' },
        options,
      ),
    ).toBe(null)

    expect(
      schemaDescribesSubset(
        { not: { format: 'date' } },
        { type: 'string' },
        options,
      ),
    ).toBe(true)

    expect(
      schemaDescribesSubset(
        { not: { format: 'date' } },
        { type: 'number' },
        options,
      ),
    ).toBe(null)
  })
})

describe(`${schemaDescribesEmptySet.name} using formatPlugin`, () => {
  it('returns false when other types are possible', () => {
    expect(
      schemaDescribesEmptySet(
        {
          allOf: [{ format: 'date-time' }, { format: 'ipv4' }],
        },
        options,
      ),
    ).toBe(false)
  })

  it('does not check whether non negated formats contradict', () => {
    expect(
      schemaDescribesEmptySet(
        {
          allOf: [
            { type: 'string' },
            { format: 'date-time' },
            { format: 'ipv4' },
          ],
        },
        options,
      ),
    ).toBe(null)
  })

  it('works with subformats', () => {
    expect(
      schemaDescribesEmptySet(
        {
          allOf: [{ type: 'number' }, { format: 'int64' }, { format: 'int32' }],
        },
        options,
      ),
    ).toBe(null)
  })

  it('works with allof and unspecified format', () => {
    expect(
      schemaDescribesEmptySet(
        {
          allOf: [
            { type: 'string' },
            { format: 'date-time' },
            { format: 'unspecified-test-format-abc' },
          ],
        },
        options,
      ),
    ).toBe(null)
  })

  it('returns true with negated unspecified format', () => {
    expect(
      schemaDescribesEmptySet(
        {
          not: { format: 'unspecified-test-format-abc' },
        },
        options,
      ),
    ).toBe(true)
  })
})

describe(`${toDNF.name} using formatPlugin`, () => {
  it('does not check whether formats contradict', () => {
    expect(
      toDNF(
        {
          allOf: [
            { type: 'string' },
            { format: 'date-time' },
            { format: 'ipv4' },
          ],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "format": "date-time",
              },
              {
                "format": "ipv4",
              },
            ],
            "type": "string",
          },
        ],
      }
    `)
  })

  it('works with subformats', () => {
    expect(
      toDNF(
        {
          allOf: [
            { type: ['number', 'string', 'boolean'] },
            { format: 'int64' },
            { format: 'int32' },
          ],
        },
        options,
      ),
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
            "maximum": 2147483647,
            "minimum": -2147483648,
            "multipleOf": 1,
            "type": "number",
          },
          {
            "type": "string",
          },
        ],
      }
    `)
  })

  it('accepts unrelated formats', () => {
    expect(
      toDNF(
        {
          type: 'string',
          allOf: [{ format: 'regex' }, { format: 'time' }],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "format": "regex",
              },
              {
                "format": "time",
              },
            ],
            "type": "string",
          },
        ],
      }
    `)
  })

  it('omits unspecified format', () => {
    expect(
      toDNF(
        {
          allOf: [
            { type: 'string' },
            { format: 'date-time' },
            { format: 'unspecified-test-format-abc' },
          ],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "format": "date-time",
              },
            ],
            "type": "string",
          },
        ],
      }
    `)
  })

  it('ignores formats without validation', () => {
    expect(
      toDNF(
        {
          allOf: [
            { type: 'string' },
            { format: 'date-time' },
            { format: 'password' },
            { format: 'binary' },
          ],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "format": "date-time",
              },
            ],
            "type": "string",
          },
        ],
      }
    `)
  })

  it('works with string formats along number formats', () => {
    expect(toDNF({ allOf: [{ format: 'ipv4' }, { format: 'int32' }] }, options))
      .toMatchInlineSnapshot(`
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
              "maximum": 2147483647,
              "minimum": -2147483648,
              "multipleOf": 1,
              "type": "number",
            },
            {
              "allOf": [
                {
                  "format": "ipv4",
                },
              ],
              "type": "string",
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

  it('returns false with negated unspecified format', () => {
    expect(
      toDNF(
        {
          not: { format: 'unspecified-test-format-abc' },
        },
        options,
      ),
    ).toBe(false)

    expect(
      toDNF(
        {
          allOf: [
            { not: { format: 'int32' } },
            { not: { format: 'int64' } },
            { not: { format: 'unspecified-test-format-abc' } },
          ],
        },
        options,
      ),
    ).toBe(false)
  })

  it('works with negated specified format', () => {
    expect(
      toDNF(
        {
          not: { format: 'date-time' },
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "format": "date-time",
                },
              },
            ],
            "type": "string",
          },
        ],
      }
    `)

    expect(
      toDNF(
        {
          allOf: [
            { not: { format: 'date-time' } },
            { not: { format: 'ipv4' } },
          ],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "format": "ipv4",
                },
              },
              {
                "not": {
                  "format": "date-time",
                },
              },
            ],
            "type": "string",
          },
        ],
      }
    `)
  })

  it('eliminates negated subformats', () => {
    expect(
      toDNF(
        {
          allOf: [{ not: { format: 'int32' } }, { not: { format: 'int64' } }],
        },
        options,
      ),
    ).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "allOf": [
              {
                "not": {
                  "multipleOf": 1,
                },
              },
            ],
            "type": "number",
          },
        ],
      }
    `)
  })

  it('returns the expected type', () => {
    const result = toDNF({}, options)
    expectTypeOf(result).toEqualTypeOf<
      DNF<BuiltInOrOptionsSimplificationPlugin<typeof options>>
    >()
    expectTypeOf(result).toEqualTypeOf<
      DNF<BuiltInSimplificationPlugin | (typeof formatPlugin)[2]>
    >()

    type NonBooleanResult = Exclude<typeof result, boolean>
    type ResultDisjunct = NonBooleanResult['anyOf'][number]

    type ConstResultDisjunct = Extract<ResultDisjunct, { const: unknown }>
    expectTypeOf<ConstResultDisjunct>().toEqualTypeOf<{ const: unknown }>()

    type BooleanSimplificationPlugin = SimplificationPluginWithType<
      BuiltInOrOptionsSimplificationPlugin<typeof options>,
      'boolean'
    >

    type BooleanMergeableKeyword =
      SimplificationPluginMergeableKeyword<BooleanSimplificationPlugin>
    expectTypeOf<BooleanMergeableKeyword>().toEqualTypeOf<never>()

    type NumberResultDisjunct = Extract<ResultDisjunct, { type: 'number' }>
    type DefaultNumberResultDisjunct = Extract<
      Exclude<DefaultDNF, boolean>['anyOf'][number],
      { type: 'number' }
    >
    expectTypeOf<NumberResultDisjunct>().toEqualTypeOf<DefaultNumberResultDisjunct>()

    // TODO: spelled out DNF type

    type StringResultDisjunct = Extract<ResultDisjunct, { type: 'string' }>
    expectTypeOf<StringResultDisjunct>().toEqualTypeOf<{
      minLength?: number
      maxLength?: number
      allOf?: (
        | { not: { const: string } }
        | { format: StringFormatName }
        | { not: { format: StringFormatName } }
        | { pattern: string }
        | { not: { pattern: string } }
        | RefConjunctionSchemaAllOfElement
      )[]
      const?: never
      anyOf?: never
      not?: never
      type: 'string'
    }>()
  })
})
