import type { JSONSchema } from '../json-schema/index.js'
import {
  schemaDescribesEmptySet,
  type toDNF, // eslint-disable-line @typescript-eslint/no-unused-vars
} from '../dnf/dnf.js'
import { schemaDescribesSubset } from '../schema-describes-subset/index.js'
import type { Options } from '../options/index.js'
import { resolveSchemaArgumentsIds } from '../id/index.js'

/**
 * Tries to determine whether the provided schema accepts any JSON value. In
 * that case, the schema would be equivalent to the `true` or `{}` schema.
 *
 * @returns
 *
 * The [limitations](../documents/limitations.md) concerning false negative
 * `null` results apply here.
 *
 * @example
 *
 * 🚧TODO🚧
 *
 * @remarks
 *
 * ### Use cases
 *
 * Can't think of any 🤷‍♂️. This function was created only because it was so easy
 * to do so.
 */
export function schemaDescribesUniverse(
  schema: JSONSchema,
  options?: Options | undefined,
): boolean | null {
  const resolved = resolveSchemaArgumentsIds([schema], options)

  return schemaDescribesEmptySet({ not: resolved.schemas[0] }, resolved.options)
}

/**
 * Tries to determine whether the provided schemas accept the exact same set of
 * data values.
 *
 * @returns
 *
 * The [limitations](../documents/limitations.md) concerning false negative
 * `null` results apply here.
 *
 * @example
 *
 * 🚧TODO🚧
 *
 * @remarks
 *
 * ### Use cases
 *
 * One possible use case could be: If you are creating a tool that transforms a
 * JSON Schema to another representation (like {@link toDNF}), this function
 * could be useful to help create tests.
 */
export function schemasAreEquivalent(
  schemaA: JSONSchema,
  schemaB: JSONSchema,
  options?: Options | undefined,
): boolean | null {
  const resolved = resolveSchemaArgumentsIds([schemaA, schemaB], options)
  const [resolvedSchemaA, resolvedSchemaB] = resolved.schemas

  const aDescribesSubsetOfB = schemaDescribesSubset(
    resolvedSchemaA,
    resolvedSchemaB,
    resolved.options,
  )
  if (aDescribesSubsetOfB === false) {
    /* there is at least one element of 'a' that is not in 'b'
     * => definitely not equivalent */
    return false
  }

  const bDescribesSubsetOfA = schemaDescribesSubset(
    resolvedSchemaB,
    resolvedSchemaA,
    resolved.options,
  )
  if (bDescribesSubsetOfA === false) {
    /* there is at least one element of 'b' that is not in 'a'
     * => definitely not equivalent */
    return false
  }

  return aDescribesSubsetOfB && bDescribesSubsetOfA
}
