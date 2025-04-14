import { describe, it, expect, expectTypeOf } from 'vitest'

import {
  type DefaultDNF,
  type Disjunct,
  type DNF,
  type GeneralDNF,
  sortCompareDisjuncts,
  toDNF,
  type GeneralDNFSpelledOut,
  type DefaultDNFSpelledOut,
  type JSONSchemaTypeForDNF,
  removeSubsetDisjuncts,
} from './dnf.js'
import type {
  BuiltInOrOptionsSimplificationPlugin,
  Options,
} from '../options/index.js'
import type { SimplificationResultSchemaByType } from '../plugin/index.js'
import type {
  constSimplification,
  numberSimplification,
  stringSimplification,
  objectSimplification,
  arraySimplification,
  refSimplification,
  RefConjunctionSchemaAllOfElement,
} from '../built-in-plugins/index.js'
import { schemaDescribesSubset } from '../schema-describes-subset/index.js'

describe(removeSubsetDisjuncts, () => {
  it('removes subsets', () => {
    expect(
      removeSubsetDisjuncts([], schemaDescribesSubset),
    ).toMatchInlineSnapshot(`[]`)

    expect(
      removeSubsetDisjuncts(
        [
          { type: 'number' },
          { type: 'string' },
          { const: 5 },
          { const: 'text' },
        ],
        schemaDescribesSubset,
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "type": "number",
        },
        {
          "type": "string",
        },
      ]
    `)

    expect(
      removeSubsetDisjuncts(
        [
          { const: 5 },
          false,
          { const: 'text' },
          { type: 'number' },
          { type: 'string' },
        ],
        schemaDescribesSubset,
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "type": "number",
        },
        {
          "type": "string",
        },
      ]
    `)
  })
})

describe(sortCompareDisjuncts, () => {
  it('returns the expected value', () => {
    expect(sortCompareDisjuncts({ const: 5 }, { const: '' })).toBe(0)

    expect(
      sortCompareDisjuncts({ fantasyKeyword1: 5 }, { fantasyKeyword1: '' }),
    ).toBe(0)

    expect(sortCompareDisjuncts({ const: 5 }, { fantasyKeyword1: '' })).toBe(-1)

    expect(sortCompareDisjuncts({ fantasyKeyword1: '' }, { const: 5 })).toBe(1)

    const array = [
      { fantasyKeyword1: '' },
      { const: 5 },
      { fantasyKeyword1: 'test' },
      { const: [] },
      { fantasyKeyword2: 'xyz' },
      { const: 7 },
      { fantasyKeyword1: true },
      { const: false },
      { fantasyKeyword1: 'test' },
      { const: {} },
    ]
    array.sort(sortCompareDisjuncts)
    expect(array).toMatchInlineSnapshot(`
      [
        {
          "const": 5,
        },
        {
          "const": [],
        },
        {
          "const": 7,
        },
        {
          "const": false,
        },
        {
          "const": {},
        },
        {
          "fantasyKeyword1": "",
        },
        {
          "fantasyKeyword1": "test",
        },
        {
          "fantasyKeyword2": "xyz",
        },
        {
          "fantasyKeyword1": true,
        },
        {
          "fantasyKeyword1": "test",
        },
      ]
    `)
  })
})

describe(toDNF, () => {
  it('returns the expected dnf', () => {
    const dnfA = toDNF(
      {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: ['string', 'number', 'array'],
        minimum: 5,
        pattern: '^a+$',
        minLength: 4,
        minItems: 2,
      },
      {} as Record<string, never>,
    )
    expectTypeOf(dnfA).toEqualTypeOf<DefaultDNF>()
    expectTypeOf(dnfA).toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().not.toMatchTypeOf(dnfA)
    expect(dnfA).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "minimum": 5,
            "type": "number",
          },
          {
            "allOf": [
              {
                "pattern": "^a+$",
              },
            ],
            "minLength": 4,
            "type": "string",
          },
          {
            "minItems": 2,
            "type": "array",
          },
        ],
      }
    `)

    const dnfB = toDNF(
      {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        minimum: 5,
        pattern: '^a+$',
      },
      undefined,
    )
    expectTypeOf(dnfB).toEqualTypeOf<DefaultDNF>()
    expectTypeOf(dnfB).toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().not.toMatchTypeOf(dnfB)
    expect(dnfB).toMatchInlineSnapshot(`
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
            "minimum": 5,
            "type": "number",
          },
          {
            "allOf": [
              {
                "pattern": "^a+$",
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

  it('returns the expected boolean', () => {
    const dnfA = toDNF({ anyOf: [{ type: 'number' }, true] })
    expect(dnfA).toBe(true)
    expectTypeOf(dnfA).toEqualTypeOf<DefaultDNF>()
    expectTypeOf(dnfA).toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().not.toMatchTypeOf(dnfA)

    const dnfB = toDNF(
      { allOf: [{ type: 'number' }, false] },
      {} as Record<string, never>,
    )
    expect(dnfB).toBe(false)
    expectTypeOf(dnfB).toEqualTypeOf<DefaultDNF>()
    expectTypeOf(dnfB).toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().not.toMatchTypeOf(dnfB)

    const dnfB1 = toDNF({ allOf: [{ type: 'number' }, false] }, {})
    expect(dnfB1).toBe(false)
    expectTypeOf<GeneralDNF>().toMatchTypeOf(dnfB1)
    expectTypeOf(dnfB1).toMatchTypeOf<GeneralDNF>()

    const dnfC = toDNF({ allOf: [{ type: 'number' }, false] }, { plugins: [] })
    expect(dnfC).toBe(false)
    expectTypeOf(dnfC).toEqualTypeOf<DefaultDNF>()
    expectTypeOf(dnfC).toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().not.toMatchTypeOf(dnfC)

    const dnfD = toDNF(
      { allOf: [{ type: 'number' }, false] },
      { plugins: [[]] },
    )
    expect(dnfD).toBe(false)
    expectTypeOf(dnfD).toEqualTypeOf<DefaultDNF>()
    expectTypeOf(dnfD).toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().not.toMatchTypeOf(dnfD)

    const dnfE = toDNF(
      { allOf: [{ type: 'number' }, false] },
      { plugins: undefined },
    )
    expect(dnfE).toBe(false)
    expectTypeOf(dnfE).toEqualTypeOf<DefaultDNF>()
    expectTypeOf(dnfE).toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().not.toMatchTypeOf(dnfE)
  })

  it('works with dummy plugin', () => {
    const options = {
      plugins: [
        [
          {
            appliesToJSONSchemaType: 'number',
            mergeableKeywords: ['fantasyKeyword'],
            simplify: (): { fantasyKeyword: number } => ({ fantasyKeyword: 0 }),
          },
        ],
      ],
    } as const satisfies Options

    type ExpectedCustomPlugin = {
      readonly appliesToJSONSchemaType: 'number'
      readonly mergeableKeywords: ['fantasyKeyword']
      readonly simplify: () => {
        fantasyKeyword: number
      }
    }

    expectTypeOf<
      (typeof options)['plugins'][number][number]
    >().toEqualTypeOf<ExpectedCustomPlugin>()

    const dnf = toDNF({ type: 'number' }, options)

    type Plugin = BuiltInOrOptionsSimplificationPlugin<typeof options>
    expectTypeOf<Plugin>().toEqualTypeOf<
      | typeof constSimplification
      | typeof numberSimplification
      | typeof stringSimplification
      | typeof objectSimplification
      | typeof arraySimplification
      | typeof refSimplification
      | ExpectedCustomPlugin
    >()

    expect(dnf).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "fantasyKeyword": 0,
            "type": "number",
          },
        ],
      }
    `)

    expectTypeOf(dnf).toEqualTypeOf<ReturnType<typeof toDNF<typeof options>>>()
    expectTypeOf(dnf).toEqualTypeOf<DNF<Plugin>>()
    expectTypeOf(dnf).not.toEqualTypeOf<DefaultDNF>()
    expectTypeOf(dnf).toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().not.toMatchTypeOf(dnf)

    type DisjunctType = Exclude<typeof dnf, boolean>['anyOf'][number]

    expectTypeOf<DisjunctType>().toEqualTypeOf<Disjunct<Plugin>>()
    expectTypeOf<DisjunctType>().toEqualTypeOf<
      Exclude<
        SimplificationResultSchemaByType<Plugin, JSONSchemaTypeForDNF>,
        boolean
      >
    >()
    expectTypeOf<boolean | DisjunctType>().toEqualTypeOf<
      SimplificationResultSchemaByType<Plugin, JSONSchemaTypeForDNF>
    >()

    type NumberDisjunctType = Extract<DisjunctType, { type: 'number' }>
    type ExpectedNumberDisjunctType = {
      allOf?: (
        | {
            not: {
              multipleOf: number
            }
          }
        | {
            not: {
              const: number
            }
          }
        | RefConjunctionSchemaAllOfElement
      )[]
      fantasyKeyword?: number
      minimum?: number
      maximum?: number
      multipleOf?: number
      const?: never
      anyOf?: never
      not?: never
      type: 'number'
    }
    expectTypeOf<ExpectedNumberDisjunctType>().toMatchTypeOf<DisjunctType>()
    expectTypeOf<ExpectedNumberDisjunctType>().toMatchTypeOf<NumberDisjunctType>()

    expectTypeOf<ExpectedNumberDisjunctType>().toEqualTypeOf<NumberDisjunctType>()
  })

  it('works with negated const of various types', () => {
    expect(toDNF({ not: { const: 5 } })).toMatchInlineSnapshot(`
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
                "not": {
                  "const": 5,
                },
              },
            ],
            "type": "number",
          },
          {
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

    expect(toDNF({ not: { const: 'test-string' } })).toMatchInlineSnapshot(`
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
            "allOf": [
              {
                "not": {
                  "const": "test-string",
                },
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

    expect(toDNF({ not: { const: true } })).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "const": null,
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
          },
          {
            "type": "object",
          },
        ],
      }
    `)

    expect(toDNF({ not: { const: null } })).toMatchInlineSnapshot(`
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
          {
            "type": "array",
          },
          {
            "type": "object",
          },
        ],
      }
    `)

    expect(toDNF({ not: { const: [1] } })).toMatchInlineSnapshot(`
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
            "allOf": [
              {
                "not": {
                  "const": [
                    1,
                  ],
                },
              },
            ],
            "type": "array",
          },
          {
            "type": "object",
          },
        ],
      }
    `)

    expect(toDNF({ not: { const: { a: 1 } } })).toMatchInlineSnapshot(`
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
          },
          {
            "allOf": [
              {
                "not": {
                  "const": {
                    "a": 1,
                  },
                },
              },
            ],
            "type": "object",
          },
        ],
      }
    `)
  })

  it('removes subsets', () => {
    expect(
      toDNF({
        anyOf: [{ minimum: 2 }, { exclusiveMinimum: 1 }],
      }),
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
                "not": {
                  "const": 1,
                },
              },
            ],
            "minimum": 1,
            "type": "number",
          },
          {
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

  it('returns the expected general type', () => {
    type ToDNFReturnTypeA = ReturnType<typeof toDNF<Options | undefined>>
    expectTypeOf<ToDNFReturnTypeA>().toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().toMatchTypeOf<ToDNFReturnTypeA>()

    type ToDNFReturnTypeB = ReturnType<typeof toDNF<Options>>
    expectTypeOf<ToDNFReturnTypeB>().toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().toMatchTypeOf<ToDNFReturnTypeB>()

    type ToDNFReturnTypeC = ReturnType<typeof toDNF<undefined>>
    expectTypeOf<ToDNFReturnTypeC>().toMatchTypeOf<DefaultDNF>()
    expectTypeOf<DefaultDNF>().toMatchTypeOf<ToDNFReturnTypeC>()

    type ToDNFReturnTypeD = ReturnType<typeof toDNF>
    expectTypeOf<ToDNFReturnTypeD>().toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().toMatchTypeOf<ToDNFReturnTypeD>()

    type ToDNFReturnTypeE = ReturnType<typeof toDNF<Record<string, never>>>
    expectTypeOf<ToDNFReturnTypeE>().toMatchTypeOf<DefaultDNF>()
    expectTypeOf<DefaultDNF>().toMatchTypeOf<ToDNFReturnTypeE>()

    type ToDNFReturnTypeF = ReturnType<typeof toDNF<object>>
    expectTypeOf<ToDNFReturnTypeF>().toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().toMatchTypeOf<ToDNFReturnTypeF>()

    type ToDNFReturnTypeG = ReturnType<typeof toDNF<{ definitions: [] }>>
    expectTypeOf<ToDNFReturnTypeG>().toMatchTypeOf<GeneralDNF>()
    expectTypeOf<GeneralDNF>().toMatchTypeOf<ToDNFReturnTypeG>()

    type ToDNFReturnTypeH = ReturnType<typeof toDNF<{ plugins: [] }>>
    expectTypeOf<ToDNFReturnTypeH>().toMatchTypeOf<DefaultDNF>()
    expectTypeOf<DefaultDNF>().toMatchTypeOf<ToDNFReturnTypeH>()
  })
})

describe('GeneralDNF', () => {
  it('matches GeneralDNFSpelledOut', () => {
    expectTypeOf<GeneralDNF>().toMatchTypeOf<GeneralDNFSpelledOut>()
    expectTypeOf<GeneralDNFSpelledOut>().toMatchTypeOf<GeneralDNF>()
  })
})

describe('DefaultDNF', () => {
  it('matches DefaultDNFSpelledOut', () => {
    expectTypeOf<DefaultDNF>().toMatchTypeOf<DefaultDNFSpelledOut>()
    expectTypeOf<DefaultDNFSpelledOut>().toMatchTypeOf<DefaultDNF>()
  })

  it('matches GeneralDNF', () => {
    expectTypeOf<DefaultDNF>().toMatchTypeOf<GeneralDNF>()
    expectTypeOf<DefaultDNFSpelledOut>().toMatchTypeOf<GeneralDNF>()
    expectTypeOf<DefaultDNF>().toMatchTypeOf<GeneralDNFSpelledOut>()
    expectTypeOf<DefaultDNFSpelledOut>().toMatchTypeOf<GeneralDNFSpelledOut>()
  })
})
