import type { JSONSchema } from '../json-schema/index.js'
import type { Options } from '../options/options.js'
import type { SchemaDescribesEmptySet } from '../dnf/index.js'
import {
  getBaseURIsFromOptions,
  normalizeURI,
  resolveSchemaArgumentsIds,
} from '../id/index.js'
import { mapTuple } from '../utils/type-helpers/type-helpers.js'

/**
 * Factory function to create `schemaDescribesSubset`. `schemaDescribesSubset`
 * is not created directly to avoid cyclic imports when used internally.
 */
export function schemaDescribesSubsetFactory(
  schemaDescribesEmptySet: SchemaDescribesEmptySet,
) {
  return function schemaDescribesSubset(
    potentialSubsetSchema: JSONSchema,
    potentialSupersetSchema: JSONSchema,
    options?: Options | undefined,
  ): boolean | null {
    const schemas: [JSONSchema, JSONSchema] = [
      potentialSubsetSchema,
      potentialSupersetSchema,
    ]

    const resolved = resolveSchemaArgumentsIds(schemas, options)

    const [resolvedPotentialSubsetSchema, resolvedPotentialSupersetSchema] =
      resolved.schemas

    const baseURIs = getBaseURIsFromOptions(options)
    const [sub$id, super$id] = mapTuple(schemas, (schema, index) => {
      const baseURI = baseURIs[index]
      try {
        if (typeof schema === 'boolean' || typeof schema.$id !== 'string') {
          return normalizeURI(new URL(baseURI ?? '').href)
        }

        return normalizeURI(new URL(schema.$id, baseURI).href)
      } catch {
        return undefined
      }
    })

    if (sub$id !== undefined && sub$id === super$id) {
      // since both schemas have the same `$id` they should be the same schema
      return true
    }

    return schemaDescribesEmptySet(
      {
        allOf: [
          resolvedPotentialSubsetSchema,
          { not: resolvedPotentialSupersetSchema },
        ],
      },
      resolved.options,
    )
  }
}
