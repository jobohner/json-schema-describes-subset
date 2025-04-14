import isString from 'lodash/isString.js'

import { type JSONSchema } from '../json-schema/index.js'
import type { Options } from '../options/index.js'
import { mapTuple } from '../utils/type-helpers/index.js'
import { cloneData } from '../utils/clone-data/index.js'
import { traverseJSONSchema } from '../utils/traverse-json-schema/index.js'

export function normalizeURI(uri: string): string
export function normalizeURI(uri: undefined): undefined
export function normalizeURI(uri: string | undefined): string | undefined
export function normalizeURI(uri: string | undefined): string | undefined {
  if (uri === undefined) {
    return undefined
  }
  return uri.replace(/#\/?$/, '')
}

// export function isNonRelativeURI(uri: string): boolean {
//   try {
//     new URL(uri)
//     return true
//   } catch {
//     return false
//   }
// }

/** Returns a non relative uri or `undefined` */
export function resolveSchemaIdValue(
  baseURI: string | undefined,
  $id: string | undefined,
): string | undefined {
  if ($id === undefined) {
    if (baseURI === undefined) {
      return undefined
    }

    try {
      return normalizeURI(new URL(baseURI).href)
    } catch {
      return undefined
    }
  }

  if ($id.startsWith('urn:') || $id.startsWith('tag:')) {
    // `$id` already is non relative
    return normalizeURI($id)
  }

  try {
    return normalizeURI(new URL($id, baseURI).href)
  } catch {
    /* The uri being invalid is only relevant upon encountering a relative
     * `$ref` or relative `$dynamicRef` => don't throw */
    return undefined
  }
}

export function createSchemaCloneWithNonRelativeIdsAndRefs(
  schema: JSONSchema,
  baseURI: string | undefined,
  idDenyList: Set<string>,
): { schema: JSONSchema; ids: Set<string> } {
  const clonedSchema = cloneData(schema)

  const ids = new Set<string>()

  traverseJSONSchema(
    clonedSchema,
    (schema, baseURI, { parent }) => {
      const { $id } = schema

      let newId: string | undefined

      if (isString($id) || (parent === null && baseURI !== undefined)) {
        newId = resolveSchemaIdValue(baseURI, isString($id) ? $id : undefined)
        if (newId !== undefined && !idDenyList.has(newId)) {
          schema.$id = newId
          ids.add(newId)
        } else {
          // remove relative `$id`s that cannot be resolved
          delete schema.$id
        }
      }

      for (const refKeyword of ['$ref', '$dynamicRef'] as const) {
        const refValue = schema[refKeyword]
        if (!isString(refValue)) {
          continue
        }

        const newRefValue = resolveSchemaIdValue(newId ?? baseURI, refValue)

        if (newRefValue !== undefined) {
          schema[refKeyword] = newRefValue
        }
      }

      return newId ?? baseURI
    },
    baseURI,
  )

  return {
    schema: clonedSchema,
    ids,
  }
}

export function getBaseURIsFromOptions(
  options?: Options | undefined,
): (string | undefined)[] {
  const baseURI = options?.baseURI

  if (Array.isArray(baseURI)) {
    return baseURI.map((baseURI) => baseURI ?? undefined)
  }

  return [baseURI]
}

/**
 * Takes `options`' `baseURI` property and returns the given `schemas` with a
 * `$id` that has been resolved accordingly. The returned `options`' `baseURI`
 * is set to `undefined` since this is not needed any more.
 */
export function resolveSchemaArgumentsIds<
  const Schemas extends JSONSchema[],
  Options_ extends Options | undefined,
>(
  schemas: Schemas,
  options: Options_,
): {
  schemas: { [Key in keyof Schemas]: JSONSchema }
  options: Options_ & {
    baseURI: undefined
    definitions: JSONSchema[]
  }
} {
  const baseURIs = getBaseURIsFromOptions(options)
  const includedIds = new Set<string>()

  const resolvedSchemas = mapTuple(schemas, (schema, index): JSONSchema => {
    const baseURI = baseURIs[index]

    if (typeof schema === 'boolean') {
      try {
        /* if possible add baseURI as $id */
        return {
          $id: normalizeURI(new URL(baseURI ?? '').href),
          allOf: [schema],
        }
      } catch {
        return schema
      }
    }

    const { schema: clonedSchema, ids } =
      createSchemaCloneWithNonRelativeIdsAndRefs(
        schema,
        baseURI,
        /* don't include $ids that were already included in other schemas,
         * this might affect  JSON pointers that 'move up' and out of resource
         * scope, which shouldn't be possible in draft 2020-12 anyways */
        includedIds,
      )

    ids.forEach((id) => includedIds.add(id))

    return clonedSchema
  })

  const schemasWithoutIds = mapTuple(resolvedSchemas, (schema): JSONSchema => {
    const clonedSchema = cloneData(schema)

    traverseJSONSchema(
      clonedSchema,
      (schema) => {
        delete schema.$id
      },
      undefined,
    )

    return clonedSchema
  })

  return {
    schemas: schemasWithoutIds,
    options: {
      ...options,
      baseURI: undefined,
      definitions: [...resolvedSchemas, ...(options?.definitions ?? [])],
    } as Options_ & {
      baseURI: undefined
      definitions: JSONSchema[]
    },
  }
}
