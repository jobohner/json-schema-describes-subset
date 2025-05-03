import pick from 'lodash/pick.js'

import { type JSONSchema } from '../json-schema/index.js'
import type {
  RawDNF,
  ConjunctionOfLiterals,
} from '../atomic-schema/to-raw-dnf/index.js'
import type { JSONSchemaType } from '../json-schema-type/index.js'
import {
  getSimplificationPluginsForTypeFromInternalOptions,
  toInternalOptions,
  type InternalOptions,
  type Options,
  type OptionsSimplificationPlugin,
} from '../options/index.js'
import {
  isConstSchema,
  type NonConstConjunctionSchemaObject,
  type ConjunctionSchemaObject,
  type SimplificationPlugin,
  type SimplificationResultSchemaByType,
  type SimplificationResultSchemaForType,
  type SimplificationPluginWithType,
  type SimplificationResultNonConstConjunctionSchemaObjectForType,
  type ValidateConst,
} from '../plugin/index.js'
import type { InstancesByConstructor } from '../utils/instances-by-constructor/index.js'
import { groupLogicLiteralConjuncts } from './group-logic-literal-conjuncts.js'
import { splitToRawDNF } from '../atomic-schema/split/index.js'
import { resolveSchemaArgumentsIds } from '../id/index.js'
import type { BuiltInSimplificationPlugin } from '../built-in-plugins/index.js'
import { schemaDescribesSubsetFactory } from '../schema-describes-subset/schema-describes-subset-factory.js'
import { forEachElementCombination } from '../utils/array/index.js'

export function createValidateConst(
  options: InternalOptions,
  schema: JSONSchema,
): ValidateConst {
  return (constValue: unknown): false | { const: unknown } =>
    options.validate(schema, constValue) ? { const: constValue } : false
}

/**
 * Brings the given disjunct of a {@link RawDNF} to a simpler canonical form by
 * summarizing keywords. Returns `false` (which is a valid JSON Schema) if there
 * is a contradiction in the disjunct.
 */
export function simplifyDisjunct<
  Type extends JSONSchemaType,
  SimplificationPlugin_ extends SimplificationPlugin,
>({
  type,
  atomicSchemasByConstructor,
  negatedAtomicSchemasByConstructor,
  options,
  validateConst,
}: {
  type: Type
  atomicSchemasByConstructor: InstancesByConstructor
  negatedAtomicSchemasByConstructor: InstancesByConstructor
  options: InternalOptions<SimplificationPlugin_>
  validateConst: ValidateConst
}): SimplificationResultSchemaForType<SimplificationPlugin_, Type> {
  const simplificationPlugins: SimplificationPluginWithType<
    SimplificationPlugin_,
    Type
  >[] = getSimplificationPluginsForTypeFromInternalOptions(options, type)

  type SimplificationResultSchema =
    SimplificationResultNonConstConjunctionSchemaObjectForType<
      SimplificationPlugin_,
      Type
    >

  let simplificationResultSchema: SimplificationResultSchema = {
    type,
  } as SimplificationResultSchema

  for (const { simplify, mergeableKeywords } of simplificationPlugins) {
    const nextSimplificationResultSchema = simplify({
      type,
      atomicSchemasByConstructor,
      negatedAtomicSchemasByConstructor,
      previousSimplificationResultSchema: simplificationResultSchema,
      options,
      schemaDescribesEmptySet: (schema) =>
        schemaDescribesEmptySetInternal(schema, options),
      splitToRawDNF: (schema) => splitToRawDNF(schema, options),
      validateConst,
    })

    if (nextSimplificationResultSchema === false) {
      return false
    }

    if (nextSimplificationResultSchema === true) {
      continue
    }

    if (isConstSchema(nextSimplificationResultSchema)) {
      return nextSimplificationResultSchema
    }

    simplificationResultSchema = {
      ...simplificationResultSchema,
      ...(pick(nextSimplificationResultSchema, ...mergeableKeywords) as Partial<
        NonConstConjunctionSchemaObject & {
          type?: never
        }
      >),
      allOf: [
        ...(simplificationResultSchema.allOf ?? []),
        ...(nextSimplificationResultSchema.allOf ?? []),
      ],
    }
  }

  if (simplificationResultSchema.allOf?.length === 0) {
    delete simplificationResultSchema.allOf
  }

  return simplificationResultSchema
}

export type JSONSchemaTypeForDNF = Exclude<JSONSchemaType, 'null' | 'boolean'>

export function isJSONSchemaTypeForDNF(
  type: JSONSchemaType,
): type is JSONSchemaTypeForDNF {
  return type !== 'null' && type !== 'boolean'
}

/**
 * @param rawDisjunct Represents multiple disjuncts, because there might be
 *   multiple types
 */
export function simplifyRawDisjunct<
  SimplificationPlugin_ extends SimplificationPlugin,
>(
  rawDisjunct: ConjunctionOfLiterals,
  validateConst: ValidateConst,
  options: InternalOptions<SimplificationPlugin_>,
): SimplificationResultSchemaByType<
  SimplificationPlugin_,
  JSONSchemaTypeForDNF
>[] {
  const {
    booleanSchema,
    atomicSchemasByConstructor,
    negatedAtomicSchemasByConstructor,
    types,
  } = groupLogicLiteralConjuncts(rawDisjunct.allOf)

  if (booleanSchema !== undefined) {
    return [booleanSchema]
  }

  /* filter to exclude 'null' and 'boolean' to make DNF more canonical by
   * instead using `{ const: null | boolean}` */
  return types.filter(isJSONSchemaTypeForDNF).map(
    <Type extends JSONSchemaTypeForDNF>(type: Type) =>
      simplifyDisjunct<Type, SimplificationPlugin_>({
        type,
        atomicSchemasByConstructor,
        negatedAtomicSchemasByConstructor,
        options,
        validateConst,
      }) as SimplificationResultSchemaByType<
        SimplificationPlugin_,
        JSONSchemaTypeForDNF
      >,
  )
}

export type Disjunct<SimplificationPlugin_ extends SimplificationPlugin> =
  Exclude<
    SimplificationResultSchemaByType<
      SimplificationPlugin_,
      JSONSchemaTypeForDNF
    >,
    boolean
  >

export type DNF<SimplificationPlugin_ extends SimplificationPlugin> =
  | boolean
  | { anyOf: Disjunct<SimplificationPlugin_>[] }

/**
 * This is equivalent to
 *
 * {@includeCode ./dnf.ts#GeneralDNFSpelledOut}
 */
export type GeneralDNF = DNF<SimplificationPlugin>

/** Is equivalent to {@link GeneralDNF} */
export //#region GeneralDNFSpelledOut
type GeneralDNFSpelledOut =
  | boolean
  | {
      anyOf: (
        | { const: unknown }
        | {
            [mergeableKeyword: string]: unknown
            type: 'string' | 'number' | 'object' | 'array'
            allOf?: JSONSchema[]
            const?: never
            anyOf?: never
            not?: never
          }
      )[]
    }
//#endregion GeneralDNFSpelledOut

/**
 * This is equivalent to
 *
 * {@includeCode ./dnf.ts#DefaultDNFSpelledOut}
 */
export type DefaultDNF = DNF<BuiltInSimplificationPlugin>

/** Is equivalent to {@link DefaultDNF} */
export //#region DefaultDNFSpelledOut
type DefaultDNFSpelledOut =
  | boolean
  | {
      anyOf: (
        | { const: unknown }
        | {
            type: 'number'
            maximum?: number
            minimum?: number
            multipleOf?: number
            allOf?: (
              | { not: { const: number } }
              | { not: { multipleOf: number } }
              | { $ref: string }
              | { not: { $ref: string } }
            )[]
            const?: never
            anyOf?: never
            not?: never
          }
        | {
            type: 'string'
            maxLength?: number
            minLength?: number
            allOf?: (
              | { not: { const: string } }
              | { pattern: string }
              | { not: { pattern: string } }
              | { $ref: string }
              | { not: { $ref: string } }
            )[]
            const?: never
            anyOf?: never
            not?: never
          }
        | {
            type: 'object'
            maxProperties?: number
            minProperties?: number
            patternProperties?: Record<string, JSONSchema>
            properties?: Record<string, JSONSchema>
            propertyNames?: JSONSchema
            required?: string[]
            allOf?: (
              | { not: { const: Record<string, unknown> } }
              | {
                  additionalProperties: JSONSchema
                  properties?: Record<string, true>
                  patternProperties?: Record<string, true>
                }
              | { not: { patternProperties: Record<string, JSONSchema> } }
              | {
                  not: {
                    additionalProperties: JSONSchema
                    properties?: Record<string, true>
                    patternProperties?: Record<string, true>
                  }
                }
              | { not: { propertyNames: JSONSchema } }
              | { $ref: string }
              | { not: { $ref: string } }
            )[]
            const?: never
            anyOf?: never
            not?: never
          }
        | {
            type: 'array'
            items?: JSONSchema
            maxItems?: number
            minItems?: number
            prefixItems?: JSONSchema[]
            uniqueItems?: boolean
            allOf?: (
              | { not: { const: unknown[] } }
              | {
                  contains: JSONSchema
                  minContains?: number
                  maxContains?: number
                }
              | {
                  not: { uniqueItems?: boolean }
                }
              | {
                  not: {
                    prefixItems?: true[]
                    items?: JSONSchema
                  }
                }
              | { $ref: string }
              | { not: { $ref: string } }
            )[]
            const?: never
            anyOf?: never
            not?: never
          }
      )[]
    }
//#endregion DefaultDNFSpelledOut

/** Sort const schemas to the start of the array (mainly for aesthetic reasons) */
export function sortCompareDisjuncts(
  ...disjuncts: [
    ConjunctionSchemaObject<NonConstConjunctionSchemaObject>,
    ConjunctionSchemaObject<NonConstConjunctionSchemaObject>,
  ]
): -1 | 0 | 1 {
  const [disjunctAIsConstSchema, disjunctBIsConstSchema] =
    disjuncts.map(isConstSchema)

  if (disjunctAIsConstSchema === disjunctBIsConstSchema) {
    return 0
  }

  return disjunctAIsConstSchema ? -1 : 1
}

function isNotBoolean<Type>(value: Type): value is Exclude<Type, boolean> {
  return typeof value !== 'boolean'
}

/** Removes unnecessary disjuncts (if they are subsets of other disjuncts) */
export function removeSubsetDisjuncts<Disjunct_ extends JSONSchema>(
  disjuncts: Disjunct_[],
  schemaDescribesSubset: (
    potentialSubset: JSONSchema,
    potentialSuperset: JSONSchema,
  ) => boolean | null,
): Disjunct_[] {
  const disjunctsWithSubsetsSetToFalse: (Disjunct_ | false)[] = [...disjuncts]

  forEachElementCombination(
    disjunctsWithSubsetsSetToFalse,
    (schemaI, schemaJ, i, j, array) => {
      if (schemaDescribesSubset(schemaJ, schemaI)) {
        array[j] = false
      } else if (schemaDescribesSubset(schemaI, schemaJ)) {
        array[i] = false
      }
    },
  )

  return disjunctsWithSubsetsSetToFalse.filter(isNotBoolean)
}

/** Removes unnecessary conjuncts (if they are supersets of other conjuncts) */
export function removeSupersetConjuncts<Conjunct_ extends JSONSchema>(
  conjuncts: Conjunct_[],
  schemaDescribesSubset: (
    potentialSubset: JSONSchema,
    potentialSuperset: JSONSchema,
  ) => boolean | null,
): Conjunct_[] {
  const conjunctsWithSupersetsSetToTrue: (Conjunct_ | true)[] = [...conjuncts]

  forEachElementCombination(
    conjunctsWithSupersetsSetToTrue,
    (schemaI, schemaJ, i, j, array) => {
      if (schemaDescribesSubset(schemaJ, schemaI)) {
        array[i] = true
      } else if (schemaDescribesSubset(schemaI, schemaJ)) {
        array[j] = true
      }
    },
  )

  return conjunctsWithSupersetsSetToTrue.filter(isNotBoolean)
}

export type DNFFromOptions<Options_ extends Options | undefined> = DNF<
  BuiltInSimplificationPlugin | OptionsSimplificationPlugin<Options_>
>

/**
 * Transforms the given schema to a [disjunctive normal
 * form](https://en.wikipedia.org/wiki/Disjunctive_normal_form) similar to the
 * one utilized by {@link schemaDescribesEmptySet}.
 *
 * @returns
 *
 * The resulting dnf schema will be equivalent to the provided schema (meaning
 * that it will accept the same data values) but all
 * [boolean combinations](https://json-schema.org/understanding-json-schema/reference/combining)
 * will be restructured.
 *
 * Subschemas that represent property values of a JSON object or elements of a
 * JSON array do not represent boolean combinations. They are currently
 * considered atomic for that purpose.
 *
 * The resulting dnf schema will be simplified so that disjuncts that were determined
 * to be unsatisfiable are already eliminated. If each disjunct was determined
 * to be unsatisfiable the return value is `false`.
 *
 * The return type's most general form (without specified
 * {@link Options.plugins | plugin} types, for example returned by
 * `toDNF<Options>(...)`) is equivalent to:
 *
 * {@includeCode ./dnf.ts#GeneralDNFSpelledOut}
 *
 * If the provided option's type does not contain any custom
 * {@link Options.plugins | plugins}, the default return type (for example
 * returned by `toDNF(schema)` (without options)  or by
 * `toDNF<{ plugins: [] }>(...)`) is equivalent to:
 *
 * {@includeCode ./dnf.ts#DefaultDNFSpelledOut}
 *
 * The return type will adjust according to the (explicit or inferred) type of
 * the property `plugins` of the provided `options`.
 *
 * @example
 *
 * {@include ./examples/snapshots/to-dnf.example.md}
 *
 * @remarks
 *
 * ### Use cases
 *
 * This function was created mainly for demonstration purposes, but might also
 * have some real world use cases. For example when creating a data mocking
 * tool, that generates example data for a given schema, it might be easier to
 * generate that data for one of the logically flat disjuncts instead of a
 * complex schema which is logically deeply nested.
 */
export function toDNF<const Options_ extends Options | undefined = undefined>(
  schema: JSONSchema,
  options?: Options_,
): DNFFromOptions<Options_> {
  const resolved = resolveSchemaArgumentsIds([schema], options)
  const internalOptions = toInternalOptions(resolved.options)

  const resolvedSchema = resolved.schemas[0]

  const rawDNF = splitToRawDNF(resolvedSchema, internalOptions)

  const validateConst = createValidateConst(internalOptions, resolvedSchema)

  const anyOf: Exclude<DNFFromOptions<Options_>, boolean>['anyOf'] =
    /* check all null and boolean values (there are only three in total) once
     * in advance, so they don't need to be checked later */
    [null, true, false].map(validateConst).filter(isNotBoolean)

  for (const rawDisjunct of rawDNF.anyOf) {
    const disjuncts = simplifyRawDisjunct<
      BuiltInSimplificationPlugin | OptionsSimplificationPlugin<Options_>
    >(rawDisjunct, validateConst, internalOptions)

    if (disjuncts.includes(true)) {
      return true
    }

    const nonBooleanDisjuncts = disjuncts.filter(isNotBoolean)

    anyOf.push(...nonBooleanDisjuncts)
  }

  if (anyOf.length === 0) {
    return false
  }

  anyOf.sort(sortCompareDisjuncts)

  const schemaDescribesSubset = schemaDescribesSubsetFactory((schema) =>
    schemaDescribesEmptySetInternal(schema, internalOptions),
  )

  return {
    /* TODO: maybe make removing of unnecessary disjuncts / conjuncts optional,
     * in some cases it might more desirable to have more explicit disjuncts
     * ??? */
    anyOf: removeSubsetDisjuncts<
      Exclude<DNFFromOptions<Options_>, boolean>['anyOf'][number]
    >(anyOf, schemaDescribesSubset).map((disjunct) =>
      isConstSchema(disjunct) || disjunct.allOf === undefined
        ? disjunct
        : {
            ...disjunct,
            allOf: removeSupersetConjuncts<JSONSchema>(
              disjunct.allOf,
              schemaDescribesSubset,
            ),
          },
    ),
  }
}

export function rawDisjunctDescribesEmptySet<
  SimplificationPlugin_ extends SimplificationPlugin,
>(
  rawDisjunct: ConjunctionOfLiterals,
  validateConst: ValidateConst,
  options: InternalOptions<SimplificationPlugin_>,
): boolean | null {
  const {
    booleanSchema,
    atomicSchemasByConstructor,
    negatedAtomicSchemasByConstructor,
    types,
  } = groupLogicLiteralConjuncts(rawDisjunct.allOf)

  if (booleanSchema !== undefined) {
    return !booleanSchema
  }

  for (const type of types) {
    // TODO: maybe add an option that says whether we need the full result?
    // A `null` return would be sufficient, if we are only interested whether
    // contradictions could be found
    const resultSchema = simplifyDisjunct({
      type,
      atomicSchemasByConstructor,
      negatedAtomicSchemasByConstructor,
      options,
      validateConst,
    })

    if (resultSchema === false) {
      continue
    }

    if (isConstSchema(resultSchema)) {
      return false
    }

    return null
  }

  return true
}

export function rawDNFDescribesEmptySet(
  rawDNF: RawDNF,
  validateConst: ValidateConst,
  options: InternalOptions,
): boolean | null {
  const subResults = rawDNF.anyOf.map((rawDisjunct) =>
    rawDisjunctDescribesEmptySet(rawDisjunct, validateConst, options),
  )

  if (subResults.every((result) => result === true)) {
    /* all disjuncts are unsatisfiable */
    return true
  }

  if (subResults.includes(false)) {
    /* one disjunct is definitely satisfiable => true negative */
    return false
  }

  /* (possibly false) negative */
  return null
}

/**
 * Tries to determine whether the provided JSON Schema is unsatisfiable and
 * therefore describes the empty set. In that case, the schema would be
 * equivalent to the `false` schema.
 *
 * @returns
 *
 * Returns `true` if it does find a reason why the schema will not accept any
 * value.
 *
 * If such a reason cannot be found, usually `null` is returned to indicate the
 * possibility of false negatives.
 *
 * The true positive `false` return value is currently only returned if an
 * example data value that satisfies the schema can be trivially found.
 * See [Limitations](#limitations) for more details.
 *
 * @example
 *
 * {@includeCode ./examples/snapshots/schema-describes-empty-set-0.example.ts}
 *
 * @remarks
 *
 * ## How does this work?
 *
 * The provided schema is first transformed to a [disjunctive normal
 * form](https://en.wikipedia.org/wiki/Disjunctive_normal_form) similar to the
 * one returned by {@link toDNF}. Then each disjunct is checked for
 * contradictions which would make it unsatisfiable. If a contradiction is found
 * for each disjunct, the complete schema is unsatisfiable and `true` is
 * returned.
 */
export function schemaDescribesEmptySet(
  schema: JSONSchema,
  options?: Options | undefined,
): boolean | null {
  const resolved = resolveSchemaArgumentsIds([schema], options)
  const internalOptions = toInternalOptions(resolved.options)
  return schemaDescribesEmptySetInternal(...resolved.schemas, internalOptions)
}

export type SchemaDescribesEmptySet = typeof schemaDescribesEmptySet

export function schemaDescribesEmptySetInternal(
  schema: JSONSchema,
  options: InternalOptions,
): boolean | null {
  /* check all null and boolean values once
   * in advance, so they don't need to be checked later */
  if (
    [null, true, false].some((value) => {
      return options.validate(schema, value)
    })
  ) {
    return false
  }

  const rawDNF = splitToRawDNF(schema, options)

  return rawDNFDescribesEmptySet(
    rawDNF,
    createValidateConst(options, schema),
    options,
  )
}

export type SchemaDescribesEmptySetInternal =
  typeof schemaDescribesEmptySetInternal
