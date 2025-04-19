import type { JSONSchema } from '../json-schema/index.js'
import type { Options } from '../options/index.js'

import {
  type ValidationPlugin, // eslint-disable-line @typescript-eslint/no-unused-vars
} from '../plugin/index.js'
import { schemaDescribesEmptySet } from '../dnf/index.js'
import { schemaDescribesSubsetFactory } from './schema-describes-subset-factory.js'

/**
 * Tries to determine whether the first argument JSON schema
 * (`potentialSubsetSchema`) describes a subset of the set of data values
 * described by the second argument JSON schema (`potentialSupersetSchema`).
 *
 * @returns
 * Returns `true` if it does find a reason to do so.
 *
 * If such a reason cannot be found, usually `null` is returned to indicate
 * the possibility of false negatives. (Not having found any reason to return
 * `true` doesn't mean that there aren't any.)
 *
 * This behavior is sufficient for many use cases and has been the focus so far.
 * The ability to determine true positive `true` results is fairly powerful and
 * will work in many complex cases. (See the following [examples](#example) and
 * [Limitations](../documents/limitations.md).)
 * The true positive `false` return value is currently only returned if an
 * example data value that satisfies `potentialSubsetSchema` but not
 * `potentialSupersetSchema` can be trivially found.
 * See [Limitations](../documents/limitations.md) for more details.
 *
 * @example
 *
 * If a few of the following examples that return `true` seem unintuitive
 * at first glance, try to find a data value that satisfies the first schema but
 * not the second one. Failing to find such a data value might help to
 * understand why `true` is returned. (If, contrary to expectations, you
 * actually are able to find such a data value, please do report a
 * [bug](/BUGS_URL)).
 *
 * {@includeCode examples/snapshots/schema-describes-subset-0.example.ts}
 *
 * @remarks
 *
 * ### Use Cases
 *
 * This function is useful whenever you want to ensure that different data
 * interfaces are compatible with each other.
 *
 * For example, it can be used to check whether a new API version is backwards
 * compatible with the old one.
 *
 * Several other good use cases where a function like
 * `schemaDescribesSubset` might come in handy, are described in the
 * introduction of the paper
 * [Type Safety with JSON Subschema](https://arxiv.org/abs/2106.05271), which
 * follows the same goal as this function using a slightly different approach.
 *
 * ### How does this work?
 *
 * The implementation utilizes {@link schemaDescribesEmptySet} and the fact that
 * A&nbsp;⊆&nbsp;B if and only if A&nbsp;∩&nbsp;¬B&nbsp;=&nbsp;∅. (That
 * relation should be obvious if illustrated in a venn diagram.)
 *
 * It basically looks similar to this:
 *
 * ```typescript
 * function schemaDescribesSubset(
 *   potentialSubsetSchema: JSONSchema,
 *   potentialSupersetSchema: JSONSchema,
 * ): boolean | null {
 *   return schemaDescribesEmptySet({
 *     allOf: [
 *       potentialSubsetSchema,
 *       { not: potentialSupersetSchema },
 *     ],
 *   })
 * }
 * ```
 *
 * ### Good to know: Validation using `schemaDescribesSubset`
 *
 * `schemaDescribesSubset` uses
 * [Ajv](https://ajv.js.org/json-schema.html#draft-2020-12) to validate `consts`
 * among others. It can be configured using {@link ValidationPlugin}s. If you
 * ever need a routine that validates a value `a` against a schema `B` and that
 * is equally configured, an alternative to importing and configuring Ajv would
 * be to use:
 *
 * ```typescript
 * schemaDescribesSubset({const: a}, B)
 * ```
 *
 * This is one of the cases where
 * [a definite boolean is always returned and never `null`](../documents/limitations.md).
 *
 * However, since this is not optimized for performance, configuring and using a
 * validator might often be the better choice.
 */
export function schemaDescribesSubset(
  potentialSubsetSchema: JSONSchema,
  potentialSupersetSchema: JSONSchema,
  options?: Options | undefined,
): boolean | null {
  return schemaDescribesSubset_(
    potentialSubsetSchema,
    potentialSupersetSchema,
    options,
  )
}

export type SchemaDescribesSubset = typeof schemaDescribesSubset

/**
 * Awkward construct to have this work with the factory function and at the same
 * time have a nicely documented {@link schemaDescribesSubset}.
 */
const schemaDescribesSubset_ = schemaDescribesSubsetFactory(
  schemaDescribesEmptySet,
)
