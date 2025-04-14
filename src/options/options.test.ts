import { describe, it, expectTypeOf, expect } from 'vitest'

import {
  getOptionsSimplificationPlugins,
  type Options,
  type OptionsSimplificationPluginOverrides,
  getBuiltInAndOptionsSimplificationPlugins,
  toInternalOptions,
  type OptionsPlugin,
  type OptionsSimplificationPlugin,
  type ExtractSimplificationPlugin,
  getBuiltInAndOptionsExtractionPlugins,
} from './options.js'
import type {
  ExtractionPlugin,
  SimplificationPlugin,
  ValidationPlugin,
  Plugin,
} from '../plugin/index.js'
import type {
  FantasySimplificationPlugin,
  FantasySimplificationPlugin2,
} from '../plugin/plugin.test.js'

describe('OptionsPlugin', () => {
  it('creates the expected type', () => {
    type OptionsA = {
      plugins: (
        | [FantasySimplificationPlugin]
        | [FantasySimplificationPlugin2]
      )[]
    }

    expectTypeOf<OptionsA>().toMatchTypeOf<Options>()

    expectTypeOf<OptionsPlugin<OptionsA>>().toEqualTypeOf<
      | ExtractionPlugin
      | ValidationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
    >()

    expectTypeOf<OptionsPlugin<OptionsA>>().toEqualTypeOf<
      OptionsPlugin<OptionsA>
    >()

    type OptionsB = {
      plugins: (
        | (FantasySimplificationPlugin | FantasySimplificationPlugin2)[]
        | [FantasySimplificationPlugin]
        | [FantasySimplificationPlugin2]
      )[]
    }

    expectTypeOf<OptionsB>().toMatchTypeOf<Options>()

    expectTypeOf<OptionsPlugin<OptionsB>>().toEqualTypeOf<
      | ExtractionPlugin
      | ValidationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
    >()

    expectTypeOf<OptionsPlugin<OptionsB>>().toEqualTypeOf<
      OptionsPlugin<OptionsB>
    >()

    type OptionsC = {
      plugins: undefined
    }

    expectTypeOf<OptionsC>().toMatchTypeOf<Options>()

    expectTypeOf<OptionsPlugin<OptionsC>>().toEqualTypeOf<
      ExtractionPlugin | ValidationPlugin
    >()

    expectTypeOf<OptionsPlugin<OptionsC>>().toEqualTypeOf<
      OptionsPlugin<OptionsC>
    >()

    type OptionsD = undefined
    expectTypeOf<OptionsPlugin<OptionsD>>().toEqualTypeOf<
      ExtractionPlugin | ValidationPlugin
    >()

    type OptionsE = {
      baseURI: string
    }

    expectTypeOf<OptionsE>().toMatchTypeOf<Options>()

    expectTypeOf<OptionsPlugin<OptionsE>>().toEqualTypeOf<Plugin[number]>()

    expectTypeOf<OptionsPlugin<OptionsE>>().toEqualTypeOf<
      OptionsPlugin<OptionsE>
    >()

    expectTypeOf<OptionsPlugin<Options>>().toEqualTypeOf<Plugin[number]>()

    expectTypeOf<OptionsPlugin<Options>>().toEqualTypeOf<
      OptionsPlugin<Options>
    >()
  })
})

describe('OptionsSimplificationPluginOverrides', () => {
  it('creates the expected type', () => {
    expectTypeOf<
      OptionsSimplificationPluginOverrides<Options>
    >().toEqualTypeOf<object>()
  })
})

describe('ExtractSimplificationPlugin', () => {
  it('creates the expected type', () => {
    expectTypeOf<
      ExtractSimplificationPlugin<undefined>
    >().toEqualTypeOf<never>()

    expectTypeOf<
      ExtractSimplificationPlugin<Plugin[]>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<ExtractSimplificationPlugin<never>>().toEqualTypeOf<never>()

    expectTypeOf<
      ExtractSimplificationPlugin<never | undefined>
    >().toEqualTypeOf<never>()

    expectTypeOf<ExtractSimplificationPlugin<[]>>().toEqualTypeOf<never>()

    expectTypeOf<ExtractSimplificationPlugin<never[]>>().toEqualTypeOf<never>()

    expectTypeOf<
      ExtractSimplificationPlugin<[] | undefined>
    >().toEqualTypeOf<never>()

    expectTypeOf<
      ExtractSimplificationPlugin<never[] | undefined>
    >().toEqualTypeOf<never>()

    expectTypeOf<
      ExtractSimplificationPlugin<Plugin[] | undefined>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      ExtractSimplificationPlugin<unknown>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      ExtractSimplificationPlugin<string>
    >().toEqualTypeOf<SimplificationPlugin>()
  })
})

describe('OptionsSimplificationPlugin', () => {
  it('creates the expected type', () => {
    expectTypeOf<
      OptionsSimplificationPlugin<Options | undefined>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      OptionsSimplificationPlugin<Options>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      OptionsSimplificationPlugin<undefined>
    >().toEqualTypeOf<never>()

    expectTypeOf<
      OptionsSimplificationPlugin<Record<string, never>>
    >().toEqualTypeOf<never>()

    expectTypeOf<
      OptionsSimplificationPlugin<object>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      OptionsSimplificationPlugin<{ definitions: [] }>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      OptionsSimplificationPlugin<{
        plugins?: Plugin[] | undefined
      }>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      OptionsSimplificationPlugin<{
        plugins: Plugin[] | undefined
      }>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      OptionsSimplificationPlugin<{
        plugins?: Plugin[]
      }>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      OptionsSimplificationPlugin<{
        plugins: Plugin[]
      }>
    >().toEqualTypeOf<SimplificationPlugin>()

    expectTypeOf<
      OptionsSimplificationPlugin<{
        plugins?: undefined
      }>
    >().toEqualTypeOf<never>()

    expectTypeOf<
      OptionsSimplificationPlugin<{
        plugins: undefined
      }>
    >().toEqualTypeOf<never>()

    expectTypeOf<
      OptionsSimplificationPlugin<{
        plugins: []
      }>
    >().toEqualTypeOf<never>()

    expectTypeOf<
      OptionsSimplificationPlugin<{
        plugins?: []
      }>
    >().toEqualTypeOf<never>()
  })
})

describe(getOptionsSimplificationPlugins, () => {
  it('returns the expected plugins', () => {
    expect(getOptionsSimplificationPlugins({})).toEqual([])

    expect(getOptionsSimplificationPlugins({ plugins: [] })).toEqual([])

    const testSimplify0 = () => true as const
    const testSimplify1 = () => false as const
    const testOptions = {
      plugins: [
        [
          {
            appliesToJSONSchemaType: undefined,
            mergeableKeywords: [],
            simplify: testSimplify0,
          },
        ],
        [
          {
            appliesToJSONSchemaType: undefined,
            mergeableKeywords: [],
            simplify: testSimplify1,
          },
        ],
      ],
    } as const satisfies Options
    const plugins = getOptionsSimplificationPlugins(testOptions)
    expect(plugins).toEqual([
      { type: undefined, mergeableKeywords: [], simplify: testSimplify0 },
      { type: undefined, mergeableKeywords: [], simplify: testSimplify1 },
    ])

    expectTypeOf(plugins).toEqualTypeOf<
      (
        | {
            readonly appliesToJSONSchemaType: undefined
            readonly mergeableKeywords: []
            readonly simplify: () => true
          }
        | {
            readonly appliesToJSONSchemaType: undefined
            readonly mergeableKeywords: []
            readonly simplify: () => false
          }
      )[]
    >()
  })
})

describe(getBuiltInAndOptionsSimplificationPlugins, () => {
  it('returns the expected plugins', () => {
    expect(
      getBuiltInAndOptionsSimplificationPlugins({}).map(
        ({ appliesToJSONSchemaType }) => appliesToJSONSchemaType,
      ),
    ).toMatchInlineSnapshot(`
        [
          undefined,
          "number",
          "string",
          "object",
          "array",
          undefined,
        ]
      `)

    expect(
      getBuiltInAndOptionsSimplificationPlugins({
        plugins: [
          [
            {
              appliesToJSONSchemaType: ['string', 'object'],
              mergeableKeywords: [],
              simplify: (): false => false,
            },
          ],
          [
            {
              appliesToJSONSchemaType: 'number',
              mergeableKeywords: [],
              simplify: (): false => false,
            },
          ],
          [
            {
              appliesToJSONSchemaType: ['number', 'array'],
              mergeableKeywords: [],
              simplify: (): false => false,
            },
          ],
        ],
      }).map(({ appliesToJSONSchemaType }) => appliesToJSONSchemaType),
    ).toMatchInlineSnapshot(`
      [
        undefined,
        "number",
        "string",
        "object",
        "array",
        undefined,
        [
          "string",
          "object",
        ],
        "number",
        [
          "number",
          "array",
        ],
      ]
    `)

    expect(
      getBuiltInAndOptionsSimplificationPlugins({
        plugins: [
          [
            {
              appliesToJSONSchemaType: ['string', 'object'],
              mergeableKeywords: [],
              simplify: (): false => false,
            },
          ],
          [
            {
              appliesToJSONSchemaType: 'number',
              mergeableKeywords: [],
              simplify: (): false => false,
            },
          ],
          [
            {
              appliesToJSONSchemaType: ['number', 'array'],
              mergeableKeywords: [],
              simplify: (): false => false,
              overrides: 'number',
            },
          ],
        ],
      }).map(({ appliesToJSONSchemaType }) => appliesToJSONSchemaType),
    ).toMatchInlineSnapshot(`
      [
        undefined,
        [
          "number",
          "array",
        ],
        "string",
        "object",
        "array",
        undefined,
        [
          "string",
          "object",
        ],
        "number",
      ]
    `)
  })
})

describe(getBuiltInAndOptionsExtractionPlugins, () => {
  it('returns the expected plugins', () => {
    expect(
      getBuiltInAndOptionsExtractionPlugins({}).map(
        ({ extract }) => extract.name,
      ),
    ).toMatchInlineSnapshot(`
      [
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
      ]
    `)

    expect(
      getBuiltInAndOptionsExtractionPlugins({
        plugins: [
          [
            {
              extract: function testOverride(): boolean {
                return true
              },
              overrides: 'number',
            },
          ],
        ],
      }).map(({ extract }) => extract.name),
    ).toMatchInlineSnapshot(`
      [
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "testOverride",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
        "extract",
      ]
    `)
  })
})

describe(toInternalOptions, () => {
  it('works with empty options', () => {
    expect(toInternalOptions(undefined)).toMatchInlineSnapshot(`
      {
        "plugins": {
          "extractions": [
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
          ],
          "simplifications": [
            {
              "appliesToJSONSchemaType": undefined,
              "mergeableKeywords": [],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": "number",
              "mergeableKeywords": [
                "minimum",
                "maximum",
                "multipleOf",
              ],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": "string",
              "mergeableKeywords": [
                "minLength",
                "maxLength",
              ],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": "object",
              "mergeableKeywords": [
                "properties",
                "patternProperties",
                "required",
                "propertyNames",
                "minProperties",
                "maxProperties",
              ],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": "array",
              "mergeableKeywords": [
                "items",
                "prefixItems",
                "minItems",
                "maxItems",
                "uniqueItems",
              ],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": undefined,
              "mergeableKeywords": [],
              "simplify": [Function],
            },
          ],
        },
        "validate": [Function],
      }
    `)

    expect(toInternalOptions({})).toMatchInlineSnapshot(`
      {
        "plugins": {
          "extractions": [
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
            {
              "extract": [Function],
            },
          ],
          "simplifications": [
            {
              "appliesToJSONSchemaType": undefined,
              "mergeableKeywords": [],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": "number",
              "mergeableKeywords": [
                "minimum",
                "maximum",
                "multipleOf",
              ],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": "string",
              "mergeableKeywords": [
                "minLength",
                "maxLength",
              ],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": "object",
              "mergeableKeywords": [
                "properties",
                "patternProperties",
                "required",
                "propertyNames",
                "minProperties",
                "maxProperties",
              ],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": "array",
              "mergeableKeywords": [
                "items",
                "prefixItems",
                "minItems",
                "maxItems",
                "uniqueItems",
              ],
              "simplify": [Function],
            },
            {
              "appliesToJSONSchemaType": undefined,
              "mergeableKeywords": [],
              "simplify": [Function],
            },
          ],
        },
        "validate": [Function],
      }
    `)
  })
})
