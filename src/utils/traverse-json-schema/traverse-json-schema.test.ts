import { describe, it, expect } from 'vitest'

import { traverseJSONSchema } from './traverse-json-schema.js'

describe(traverseJSONSchema, () => {
  it('visits all subSchemas', () => {
    const schema = {
      allOf: [
        true,
        { minimum: 5 },
        {
          items: {
            anyOf: [
              {
                properties: {
                  a: { type: 'number' },
                },
              },
              {
                propertyNames: {
                  oneOf: [{ type: 'array' }],
                },
              },
            ],
          },
          /* invalid value for prefixItems: ignore */
          prefixItems: { type: 'number' },
        },
        { properties: [{ type: 'number' }] },
      ],
    }

    traverseJSONSchema(
      schema,
      (schema, depth) => {
        schema._depth = depth
        return depth + 1
      },
      0,
    )

    expect(schema).toMatchInlineSnapshot(`
      {
        "_depth": 0,
        "allOf": [
          true,
          {
            "_depth": 1,
            "minimum": 5,
          },
          {
            "_depth": 1,
            "items": {
              "_depth": 2,
              "anyOf": [
                {
                  "_depth": 3,
                  "properties": {
                    "a": {
                      "_depth": 4,
                      "type": "number",
                    },
                  },
                },
                {
                  "_depth": 3,
                  "propertyNames": {
                    "_depth": 4,
                    "oneOf": [
                      {
                        "_depth": 5,
                        "type": "array",
                      },
                    ],
                  },
                },
              ],
            },
            "prefixItems": {
              "type": "number",
            },
          },
          {
            "_depth": 1,
            "properties": [
              {
                "type": "number",
              },
            ],
          },
        ],
      }
    `)
  })

  it('ignores unexpected values', () => {
    const schema = {
      allOf: [
        {
          allOf: 5,
          anyOf: [2, {}],
          properties: {
            a: 4,
            b: {},
          },
        },
      ],
    }

    traverseJSONSchema(
      schema,
      (schema, depth) => {
        schema._depth = depth
        return depth + 1
      },
      0,
    )

    expect(schema).toMatchInlineSnapshot(`
      {
        "_depth": 0,
        "allOf": [
          {
            "_depth": 1,
            "allOf": 5,
            "anyOf": [
              2,
              {
                "_depth": 2,
              },
            ],
            "properties": {
              "a": 4,
              "b": {
                "_depth": 2,
              },
            },
          },
        ],
      }
    `)
  })
})
