import { describe, expect, it } from 'vitest'

import {
  builtInSimplificationPlugins,
  getBuiltInSimplificationPlugins,
} from './built-in-plugins.js'

describe(getBuiltInSimplificationPlugins, () => {
  it('returns the expected plugins', () => {
    expect(
      getBuiltInSimplificationPlugins<Record<string, never>>({}).map(
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

    expect(getBuiltInSimplificationPlugins({})[0]).toBe(
      builtInSimplificationPlugins['const'],
    )

    expect(getBuiltInSimplificationPlugins({})[1]).toBe(
      builtInSimplificationPlugins['number'],
    )

    expect(getBuiltInSimplificationPlugins({})[2]).toBe(
      builtInSimplificationPlugins['string'],
    )

    const testOverrideSimplify = (): boolean => true
    expect(
      getBuiltInSimplificationPlugins({
        string: {
          appliesToJSONSchemaType: ['string', 'number'],
          mergeableKeywords: [],
          simplify: testOverrideSimplify,
        },
      }),
    ).toMatchInlineSnapshot(`
      [
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
          "appliesToJSONSchemaType": [
            "string",
            "number",
          ],
          "mergeableKeywords": [],
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
      ]
    `)
  })
})
