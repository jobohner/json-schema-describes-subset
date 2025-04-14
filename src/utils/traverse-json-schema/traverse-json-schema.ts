import isObject from 'lodash/isObject.js'
import includes from 'lodash/includes.js'

import { isJSONSchema, type JSONSchema } from '../../json-schema/index.js'

const arrayKeywords = ['prefixItems', 'allOf', 'anyOf', 'oneOf'] as const
const objectKeywords = [
  '$defs',
  'definitions',
  'properties',
  'patternProperties',
  'dependencies',
] as const
const schemaKeywords = [
  'additionalItems',
  'items',
  'contains',
  'additionalProperties',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'unevaluatedProperties',
  'unevaluatedItems',
]

export function traverseJSONSchema<Data>(
  schema: JSONSchema,
  callback: (
    schema: Record<string, unknown>,
    data: Data,
    args: { parent: JSONSchema | null },
  ) => Data,
  data: Data,
  args?: { parent: JSONSchema },
): void {
  if (!isObject(schema) || Array.isArray(schema)) {
    return
  }

  const newData = callback(schema, data, { parent: args?.parent || null })

  for (const [key, value] of Object.entries(schema)) {
    if (includes(arrayKeywords, key)) {
      if (Array.isArray(value)) {
        value.forEach((subSchema: unknown) => {
          if (isJSONSchema(subSchema)) {
            traverseJSONSchema(subSchema, callback, newData, {
              parent: schema,
            })
          }
        })
      }
    } else if (includes(objectKeywords, key)) {
      if (isObject(value) && !Array.isArray(value))
        Object.values(value).forEach((subSchema) => {
          if (isJSONSchema(subSchema)) {
            traverseJSONSchema(subSchema, callback, newData, {
              parent: schema,
            })
          }
        })
    } else if (includes(schemaKeywords, key) && isJSONSchema(value)) {
      traverseJSONSchema(value, callback, newData, {
        parent: schema,
      })
    }
  }
}
