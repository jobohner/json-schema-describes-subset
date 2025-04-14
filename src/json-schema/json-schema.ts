import type { JSONSchema as StandardJSONSchema } from 'json-schema-typed/draft-2020-12'
import isObject from 'lodash/isObject.js'

import type { UnknownProperties } from '../utils/type-helpers/index.js'

export type JSONSchemaObject = UnknownProperties<StandardJSONSchema>

/**
 * A schema compatible with the
 * [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
 * specification.
 * If you would like to use one of the functions provided by this project with
 * an older JSON Schema draft, you could try to use something like
 * [alterschema](https://github.com/sourcemeta-research/alterschema).
 *
 * In the functions that accept more than one schema
 * ({@link schemaDescribesSubset} and {@link schemasAreEquivalent}) it is
 * assumed that when a schema resource's `$id` appears in more than one of the
 * root schemas, the respective schemas are identical.
 *
 * Since currently [Ajv](https://ajv.js.org/json-schema.html#draft-2020-12) is
 * used under the hood, the
 * [`nullable`](https://ajv.js.org/json-schema.html#nullable) keyword is
 * supported out of the box, despite of not being a standard JSON Schema
 * keyword.
 *
 * Custom keywords can be supported and the behavior of standard keywords can be
 * customized using {@link Plugin}s.
 *
 * In order to be permissive towards custom keywords, the type is equivalent to
 *
 * {@includeCode ./json-schema.ts#GeneralJSONSchema}
 *
 * but it still provides code completion and tool tip documentation for standard
 * keywords.
 *
 * There are only limited checks whether the provided schemas are actually
 * valid. Providing invalid schemas will cause undefined behavior.
 *
 * Referenced schema resources (`$ref`) are not retrieved via their url. If a
 * referenced resource is not part of the schema itself, it needs to be provided
 * in {@link Options.definitions}.
 *
 * ## ⚠️ Currently unsupported keywords
 *
 * Some of the standard keywords of
 * [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
 * are not supported yet at all (`$dynamicRef`, `$dynamicAnchor`,
 * `unevaluatedItems` and `unevaluatedProperties`). JSON schemas passed as
 * arguments to {@link toDNF} that contain any of them might cause an
 * exception to be thrown. If such schemas are passed to any of the
 * [discriminative functions](../documents/discriminative-functions.md) (like
 * {@link schemaDescribesSubset} or {@link schemaDescribesEmptySet}) a false
 * negative `null` value might be returned.
 */
export type JSONSchema = JSONSchemaObject | boolean

/** More general equivalent to {@link JSONSchema} */
export type GeneralJSONSchema =
  //#region GeneralJSONSchema
  Record<string, unknown> | boolean
//#endregion GeneralJSONSchema

export function isJSONSchema(value: unknown): value is JSONSchema {
  return isObject(value) || typeof value === 'boolean'
}

export function assertJSONSchema(value: unknown): JSONSchema | undefined {
  if (isJSONSchema(value)) {
    return value
  }

  return undefined
}
