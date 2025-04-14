import { type JSONSchema, isJSONSchema } from '../../json-schema/index.js'
import uniq from 'lodash/uniq.js'
import difference from 'lodash/difference.js'
import isString from 'lodash/isString.js'

import {
  AtomicSchemaObject,
  type LogicalCombinationOfLiterals,
  NotSchema,
  AllOfSchema,
  type LogicalCombination,
} from '../../atomic-schema/index.js'
import { TypeAtomicSchema } from '../type.js'
import {
  negateIntegerMaximum,
  negateIntegerMinimum,
} from '../../utils/negate-integer-min-max/negate-integer-min-max.js'
import type {
  ExtractionPlugin,
  SimplificationPlugin,
  ConjunctionSchema,
} from '../../plugin/index.js'
import { type ValidateFunction } from '../../validate/index.js'
import { groupByAndMap } from '../../utils/group-by-and-map/index.js'
import { createCachedFunction } from '../../utils/cached-function/index.js'
import { extractIfThenElse } from '../if-then-else.js'
import { retrieveStringSchemaConstsAndPatterns } from './retrieve-string-schema-consts-and-patterns/index.js'
import { UnsupportedKeywordError } from '../../unsupported-keyword-error/index.js'
import {
  isArrayOf,
  isNonArrayObject,
  isRecordOf,
} from '../../utils/type-guards/index.js'
import { getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor } from '../negated-const-helpers.js'

export class RequiredAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly requiredKey: string) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new PropertyAtomicSchema(this.requiredKey, false),
      new TypeAtomicSchema('object'),
    ])
  }

  toJSONSchema(): { required: [string] } {
    return { required: [this.requiredKey] }
  }
}

export class MinPropertiesAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly minProperties: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new MaxPropertiesAtomicSchema(negateIntegerMinimum(this.minProperties)),
      new TypeAtomicSchema('object'),
    ])
  }

  toJSONSchema(): { minProperties: number } {
    return { minProperties: this.minProperties }
  }
}

export class MaxPropertiesAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly maxProperties: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new MinPropertiesAtomicSchema(negateIntegerMaximum(this.maxProperties)),
      new TypeAtomicSchema('object'),
    ])
  }

  toJSONSchema(): { maxProperties: number } {
    return { maxProperties: this.maxProperties }
  }
}

export class PropertyAtomicSchema extends AtomicSchemaObject {
  constructor(
    public readonly key: string,
    public readonly schema: JSONSchema,
  ) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new TypeAtomicSchema('object'),
      new RequiredAtomicSchema(this.key),
      new PropertyAtomicSchema(this.key, { not: this.schema }),
    ])
  }

  toJSONSchema(): {
    properties: Record<string, JSONSchema>
  } {
    return { properties: { [this.key]: this.schema } }
  }
}

export type PatternPropertiesAtomicSchemaJSON = {
  patternProperties: Record<string, JSONSchema>
}

export class PatternPropertyAtomicSchema extends AtomicSchemaObject {
  constructor(
    public readonly keyPattern: string,
    public readonly schema: JSONSchema,
  ) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('object'),
    ])
  }

  toJSONSchema(): PatternPropertiesAtomicSchemaJSON {
    return { patternProperties: { [this.keyPattern]: this.schema } }
  }
}

export type AdditionalPropertiesAtomicSchemaJSON = {
  additionalProperties: JSONSchema
  properties?: Record<string, true>
  patternProperties?: Record<string, true>
}

export class AdditionalPropertiesAtomicSchema extends AtomicSchemaObject {
  public readonly propertyKeys: readonly string[]
  public readonly propertyKeyPatterns: readonly string[]

  constructor(
    public readonly additionalProperties: JSONSchema,
    propertyKeys: string[],
    propertyKeyPatterns: string[],
  ) {
    super()
    this.propertyKeys = [...propertyKeys]
    this.propertyKeyPatterns = [...propertyKeyPatterns]
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('object'),
    ])
  }

  toJSONSchema(): AdditionalPropertiesAtomicSchemaJSON {
    return {
      additionalProperties: this.additionalProperties,
      ...(this.propertyKeys.length > 0
        ? {
            properties: Object.fromEntries(
              this.propertyKeys.map((key) => [key, true]),
            ),
          }
        : {}),
      ...(this.propertyKeyPatterns.length > 0
        ? {
            patternProperties: Object.fromEntries(
              this.propertyKeyPatterns.map((key) => [key, true]),
            ),
          }
        : {}),
    }
  }
}

export class PropertyNamesAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly propertyNames: JSONSchema) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('object'),
    ])
  }

  toJSONSchema(): { propertyNames: JSONSchema } {
    return { propertyNames: this.propertyNames }
  }
}

export class UnevaluatedPropertiesAtomicSchema extends AtomicSchemaObject {
  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('object'),
    ])
  }

  toJSONSchema(): JSONSchema {
    throw new Error('unimplemented')
  }
}

export const objectExtraction: ExtractionPlugin = {
  extract: ({
    schema: {
      required,
      minProperties,
      maxProperties,
      properties,
      patternProperties,
      propertyNames,
      additionalProperties,
      dependentRequired,
      dependentSchemas,
      unevaluatedProperties,
    },
    split,
  }) => {
    const allOf: LogicalCombination[] = []

    if (isArrayOf(isString)(required)) {
      allOf.push(
        ...required.map((requiredKey) => new RequiredAtomicSchema(requiredKey)),
      )
    }

    if (typeof minProperties === 'number') {
      allOf.push(new MinPropertiesAtomicSchema(minProperties))
    }

    if (typeof maxProperties === 'number') {
      allOf.push(new MaxPropertiesAtomicSchema(maxProperties))
    }

    if (isRecordOf(isJSONSchema)(properties)) {
      allOf.push(
        ...Object.entries(properties).map(
          ([key, schema]) => new PropertyAtomicSchema(key, schema),
        ),
      )
    }

    if (isRecordOf(isJSONSchema)(patternProperties)) {
      allOf.push(
        ...Object.entries(patternProperties).map(
          ([keyPattern, schema]) =>
            new PatternPropertyAtomicSchema(keyPattern, schema),
        ),
      )
    }

    if (isJSONSchema(additionalProperties)) {
      allOf.push(
        new AdditionalPropertiesAtomicSchema(
          additionalProperties,
          Object.keys(properties ?? {}),
          Object.keys(patternProperties ?? {}),
        ),
      )
    }

    if (isJSONSchema(propertyNames)) {
      allOf.push(new PropertyNamesAtomicSchema(propertyNames))
    }

    if (isRecordOf(isArrayOf(isString))(dependentRequired)) {
      allOf.push(
        ...Object.entries(dependentRequired).map(([ifRequired, thenRequired]) =>
          extractIfThenElse(
            split,
            { required: [ifRequired] },
            { required: thenRequired },
          ),
        ),
      )
    }

    if (isRecordOf(isJSONSchema)(dependentSchemas)) {
      allOf.push(
        ...Object.entries(dependentSchemas).map(([ifRequired, thenSchema]) =>
          extractIfThenElse(split, { required: [ifRequired] }, thenSchema),
        ),
      )
    }

    if (unevaluatedProperties !== undefined) {
      allOf.push(new UnevaluatedPropertiesAtomicSchema())
    }

    return allOf.length === 0 || new AllOfSchema(allOf)
  },
}

export function createGetPropertyValueSchemaByKey({
  validate,
  propertyNames,
  propertyAtomicSchemasByKey,
  patternPropertyAtomicSchemasByKeyPatternEntries,
  additionalPropertiesAtomicSchemas,
}: {
  validate: ValidateFunction
  propertyNames: JSONSchema
  propertyAtomicSchemasByKey: Record<string, JSONSchema[]>
  patternPropertyAtomicSchemasByKeyPatternEntries: [string, JSONSchema[]][]
  additionalPropertiesAtomicSchemas: AdditionalPropertiesAtomicSchema[]
}): (key: string) => JSONSchema {
  return createCachedFunction((key: string): JSONSchema => {
    if (!validate(propertyNames, key)) {
      return false
    }

    const allOf = [
      ...(propertyAtomicSchemasByKey[key] ?? []),
      /* `patternProperties` that match `key` */
      ...patternPropertyAtomicSchemasByKeyPatternEntries
        .filter(([pattern]) => validate({ pattern }, key))
        .flatMap(([, patternPropertySchemas]) => patternPropertySchemas),
      /* `additionalProperties` that would apply to `key` */
      ...additionalPropertiesAtomicSchemas
        .filter(
          ({ propertyKeys, propertyKeyPatterns }) =>
            !propertyKeys.includes(key) &&
            !propertyKeyPatterns.some((pattern) => validate({ pattern }, key)),
        )
        .flatMap(({ additionalProperties }) => additionalProperties),
    ]

    return allOf.length === 0 ? true : { allOf }
  })
}

export function createGetPropertyValueSchemaByKeyPattern({
  validate,
  schemaDescribesEmptySet,
  propertyNames,
  patternPropertyAtomicSchemasByKeyPattern,
  additionalPropertiesAtomicSchemas,
}: {
  validate: ValidateFunction
  schemaDescribesEmptySet: (schema: JSONSchema) => boolean | null
  propertyNames: JSONSchema
  patternPropertyAtomicSchemasByKeyPattern: Record<string, JSONSchema[]>
  additionalPropertiesAtomicSchemas: AdditionalPropertiesAtomicSchema[]
}): (keyPattern: string) => JSONSchema {
  /**
   * Checks for pattern equality only. Overlapping patterns might result in a
   * false negative.
   */
  return createCachedFunction((keyPattern: string): JSONSchema => {
    if (
      schemaDescribesEmptySet({
        allOf: [propertyNames, { pattern: keyPattern }],
      })
    ) {
      return false
    }

    const allOf: JSONSchema[] = [
      ...(patternPropertyAtomicSchemasByKeyPattern[keyPattern] ?? []),
      /* `additionalProperties` that would apply to `keyPattern` */
      ...additionalPropertiesAtomicSchemas
        .filter(
          ({ propertyKeys, propertyKeyPatterns }) =>
            /* cannot have `propertyKeyPatterns`, because there is no
             * way to check for overlaps with `keyPattern` */
            propertyKeyPatterns.length === 0 &&
            /* if there is also no overlap with any of the `propertyKeys`,
             * `additionalProperties` applies */
            !propertyKeys.some((key) => validate({ pattern: keyPattern }, key)),
        )
        .flatMap(({ additionalProperties }) => additionalProperties)
        .filter(isJSONSchema),
    ]

    return allOf.length === 0 ? true : { allOf }
  })
}

export type ObjectConjunctionSchema = {
  properties?: Record<string, JSONSchema>
  patternProperties?: Record<string, JSONSchema>
  required?: string[]
  propertyNames?: JSONSchema
  minProperties?: number
  maxProperties?: number
  allOf?: (
    | { not: { const: Record<string, unknown> } }
    | AdditionalPropertiesAtomicSchemaJSON
    | {
        not: PatternPropertiesAtomicSchemaJSON
      }
    | { not: AdditionalPropertiesAtomicSchemaJSON }
    | { not: { propertyNames: JSONSchema } }
  )[]
}

export const objectSimplification = {
  appliesToJSONSchemaType: 'object',
  mergeableKeywords: [
    'properties',
    'patternProperties',
    'required',
    'propertyNames',
    'minProperties',
    'maxProperties',
  ],
  simplify({
    atomicSchemasByConstructor,
    /**
     * Might contain {@link PatternPropertyAtomicSchema}
     * {@link AdditionalPropertiesAtomicSchema} or
     * {@link PropertyNamesAtomicSchema}, everything else can be negated without
     * using {@link NotSchema}
     */
    negatedAtomicSchemasByConstructor,
    schemaDescribesEmptySet,
    options,
    splitToRawDNF,
    validateConst,
  }): ConjunctionSchema<ObjectConjunctionSchema> {
    const validate = options.validate

    const minProperties = Math.ceil(
      Math.max(
        0,
        ...atomicSchemasByConstructor
          .get(MinPropertiesAtomicSchema)
          .map(({ minProperties }) => minProperties),
      ),
    )

    const maxProperties = Math.floor(
      Math.min(
        ...atomicSchemasByConstructor
          .get(MaxPropertiesAtomicSchema)
          .map(({ maxProperties }) => maxProperties),
      ),
    )

    if (minProperties > maxProperties) {
      return false
    }

    if (maxProperties <= 0) {
      return validateConst({})
    }

    const propertyNamesAllOf = atomicSchemasByConstructor
      .get(PropertyNamesAtomicSchema)
      .map(({ propertyNames }) => propertyNames)
    const propertyNames: { allOf: JSONSchema[] } = {
      allOf: [...propertyNamesAllOf, { type: 'string' }],
    }

    const propertyAtomicSchemasByKey = groupByAndMap(
      atomicSchemasByConstructor.get(PropertyAtomicSchema),
      ({ key }) => key,
      ({ schema }) => schema,
    )

    const patternPropertyAtomicSchemasByKeyPattern = groupByAndMap(
      atomicSchemasByConstructor.get(PatternPropertyAtomicSchema),
      ({ keyPattern }) => keyPattern,
      ({ schema }) => schema,
    )
    const patternPropertyAtomicSchemasByKeyPatternEntries = Object.entries(
      patternPropertyAtomicSchemasByKeyPattern,
    )

    const additionalPropertiesAtomicSchemas = atomicSchemasByConstructor.get(
      AdditionalPropertiesAtomicSchema,
    )

    const getPropertyValueSchemaByKey = createGetPropertyValueSchemaByKey({
      validate,
      propertyNames,
      additionalPropertiesAtomicSchemas,
      patternPropertyAtomicSchemasByKeyPatternEntries,
      propertyAtomicSchemasByKey,
    })
    const getPropertyValueSchemaByKeyPattern =
      createGetPropertyValueSchemaByKeyPattern({
        validate,
        schemaDescribesEmptySet,
        propertyNames,
        additionalPropertiesAtomicSchemas,
        patternPropertyAtomicSchemasByKeyPattern,
      })

    let requiredCount = 0
    function incrementRequiredCount(amount: number = 1): boolean {
      requiredCount += amount
      return requiredCount > maxProperties
    }

    const requiredPropertySchemas: [JSONSchema, JSONSchema][] = []
    /**
     * Pushes to {@link requiredPropertySchemas} and updates
     * {@link requiredCount}. Returns true if a contradiction was found.
     */
    function pushRequiredPropertySchema(
      keySchema: JSONSchema,
      valueSchema: JSONSchema,
    ): boolean {
      const extendedKeySchema = { allOf: [keySchema, propertyNames] }

      if (schemaDescribesEmptySet(extendedKeySchema)) {
        return true
      }

      if (schemaDescribesEmptySet(valueSchema)) {
        return true
      }

      const hasNoOverlapWithPreviousRequiredPropertySchemas =
        requiredPropertySchemas.every(
          ([previousKeySchema, previousValueSchema]) =>
            schemaDescribesEmptySet({
              allOf: [previousKeySchema, keySchema, propertyNames],
            }) ||
            schemaDescribesEmptySet({
              allOf: [previousValueSchema, valueSchema],
            }),
        )
      requiredPropertySchemas.push([keySchema, valueSchema])

      return (
        hasNoOverlapWithPreviousRequiredPropertySchemas &&
        incrementRequiredCount()
      )
    }

    const required = uniq(
      atomicSchemasByConstructor
        .get(RequiredAtomicSchema)
        .map(({ requiredKey }) => requiredKey),
    )
    if (incrementRequiredCount(required.length)) {
      return false
    }
    for (const key of required) {
      const valueSchema = getPropertyValueSchemaByKey(key)
      if (schemaDescribesEmptySet(valueSchema)) {
        /* cannot satisfy required key */
        return false
      }
      requiredPropertySchemas.push([{ const: key }, valueSchema])
    }

    const negatedPropertyNamesAtomicSchemas =
      negatedAtomicSchemasByConstructor.get(PropertyNamesAtomicSchema)

    for (const {
      propertyNames: propertyNamesNegated,
    } of negatedPropertyNamesAtomicSchemas) {
      const keySchema = { not: propertyNamesNegated }
      const { isStringWithConstsOrPatterns, consts, patterns } =
        retrieveStringSchemaConstsAndPatterns({
          schema: keySchema,
          options,
          splitToRawDNF,
        })
      const valueSchema = isStringWithConstsOrPatterns
        ? {
            anyOf: [
              ...consts.map(getPropertyValueSchemaByKey),
              ...patterns.map(getPropertyValueSchemaByKeyPattern),
            ],
          }
        : true
      if (pushRequiredPropertySchema(keySchema, valueSchema)) {
        return false
      }
    }

    const negatedPatternPropertyAtomicSchema =
      negatedAtomicSchemasByConstructor.get(PatternPropertyAtomicSchema)

    /* check negated `patternProperties` */
    const negatedPatternPropertyAtomicSchemasByKeyPattern = groupByAndMap(
      negatedPatternPropertyAtomicSchema,
      ({ keyPattern }) => keyPattern,
      ({ schema }) => schema,
    )
    /* negated patternProperty implies that there has to be a property whose
     * key matches the pattern, but whose value doesn't satisfy the schema
     * ⇒ return false if that's not possible */
    for (const [keyPattern, negatedPatternPropertySchemas] of Object.entries(
      negatedPatternPropertyAtomicSchemasByKeyPattern,
    )) {
      const valueSchema = {
        allOf: [
          /* if a key matches any of the keys of
           * negatedPatternPropertySchemas it will match all of them
           * ⇒ value must not satisfy any of the
           * negatedPatternPropertySchemas */
          ...negatedPatternPropertySchemas.map((schema) => ({
            not: schema,
          })),
          getPropertyValueSchemaByKeyPattern(keyPattern),
        ],
      }

      if (pushRequiredPropertySchema({ pattern: keyPattern }, valueSchema)) {
        return false
      }
    }

    const negatedAdditionalPropertiesAtomicSchemas =
      negatedAtomicSchemasByConstructor.get(AdditionalPropertiesAtomicSchema)

    /* check negated `additionalProperties` */
    for (const {
      additionalProperties: additionalPropertiesNegated,
      propertyKeyPatterns: propertyKeyPatternsNegated,
      propertyKeys: propertyKeysNegated,
    } of negatedAdditionalPropertiesAtomicSchemas) {
      /* For this schema to be invalid there would need to be
       * a property whose key would not match any of `patternProperties`
       * keys or `properties` keys and whose value is unsatisfiable.
       *
       * Can there be a property whose key is not included in
       * `propertyKeysNegated` and doesn't match any of
       * `patternPropertiesNegated`? If not, then there is no contradiction
       * ⇒ continue. If yes, can that property's value be satisfied?
       */

      const allOf: JSONSchema[] = [{ not: additionalPropertiesNegated }]

      for (const {
        additionalProperties: additionalPropertiesNotNegated,
        propertyKeys: propertyKeysNotNegated,
        propertyKeyPatterns: propertyKeyPatternsNotNegated,
      } of additionalPropertiesAtomicSchemas) {
        const overlappingPropertyKeys = difference(
          propertyKeysNotNegated,
          propertyKeysNegated,
        )

        const overlappingPropertyKeyPatterns = difference(
          propertyKeyPatternsNotNegated,
          propertyKeyPatternsNegated,
        )

        allOf.push({
          anyOf: [
            additionalPropertiesNotNegated,
            ...overlappingPropertyKeys.map((key) =>
              getPropertyValueSchemaByKey(key),
            ),
            ...overlappingPropertyKeyPatterns.map((keyPattern) =>
              getPropertyValueSchemaByKeyPattern(keyPattern),
            ),
          ],
        })
      }

      const keySchemas = [
        ...propertyKeysNegated.map((key) => ({ const: key })),
        ...propertyKeyPatternsNegated.map((pattern) => ({
          pattern,
        })),
      ]

      if (
        pushRequiredPropertySchema(
          keySchemas.length > 0 ? { not: { anyOf: keySchemas } } : true,
          { allOf },
        )
      ) {
        return false
      }
    }

    const totalMinPropertiesCount = Math.max(requiredCount, minProperties)

    if (schemaDescribesEmptySet(propertyNames) && totalMinPropertiesCount > 0) {
      return false
    }

    /* check for `additionalProperties` that would need to apply to at least
     * one property, because the number of relevant properties is less than
     * `totalMinPropertiesCount` */
    if (
      schemaDescribesEmptySet({
        allOf: additionalPropertiesAtomicSchemas
          .filter(
            ({ propertyKeys, propertyKeyPatterns }) =>
              /* if there are `patternProperties`, there's no way to tell,
               * whether `additionalProperties` applies to something or not */
              propertyKeyPatterns.length === 0 &&
              /* if the minimum number of properties exceeds the number of
               * properties that do not apply to `additionalProperties`, there needs
               * to be at least one value that satisfies `additionalProperties` */
              propertyKeys.filter(
                (key) =>
                  /* Negating the result of `schemaDescribesEmptySet` is okay,
                   * even if it might be a false negative.
                   * In case of false negative more propertyKeys are considered. */
                  !schemaDescribesEmptySet(getPropertyValueSchemaByKey(key)),
              ).length < totalMinPropertiesCount,
          )
          .map(({ additionalProperties }) => additionalProperties),
      })
    ) {
      return false
    }

    const propertiesEntries = Object.keys(propertyAtomicSchemasByKey).map<
      [string, JSONSchema]
    >((key) => [key, getPropertyValueSchemaByKey(key)])

    const patternPropertiesEntries =
      patternPropertyAtomicSchemasByKeyPatternEntries.map<[string, JSONSchema]>(
        ([keyPattern]) => [
          keyPattern,
          getPropertyValueSchemaByKeyPattern(keyPattern),
        ],
      )

    const unevaluatedPropertiesAtomicSchema =
      atomicSchemasByConstructor.get(UnevaluatedPropertiesAtomicSchema)[0] ??
      negatedAtomicSchemasByConstructor.get(
        UnevaluatedPropertiesAtomicSchema,
      )[0]

    if (unevaluatedPropertiesAtomicSchema !== undefined) {
      throw new UnsupportedKeywordError('unevaluatedProperties')
    }

    return {
      ...(propertiesEntries.length > 0
        ? { properties: Object.fromEntries(propertiesEntries) }
        : {}),
      ...(patternPropertiesEntries.length > 0
        ? { patternProperties: Object.fromEntries(patternPropertiesEntries) }
        : {}),
      ...(totalMinPropertiesCount > 0
        ? { minProperties: totalMinPropertiesCount }
        : {}),
      ...(maxProperties < Infinity ? { maxProperties } : {}),
      // propertyNames includes a `{type: 'string'}` which is actually redundant
      ...(propertyNames.allOf.length > 1 ? { propertyNames } : {}),
      ...(required.length > 0 ? { required } : {}),
      allOf: [
        ...additionalPropertiesAtomicSchemas.map((atomicSchema) =>
          atomicSchema.toJSONSchema(),
        ),
        ...negatedAdditionalPropertiesAtomicSchemas.map((atomicSchema) => ({
          not: atomicSchema.toJSONSchema(),
        })),
        ...negatedPropertyNamesAtomicSchemas.map((atomicSchema) => ({
          not: atomicSchema.toJSONSchema(),
        })),
        ...negatedPatternPropertyAtomicSchema.map((atomicSchema) => ({
          not: atomicSchema.toJSONSchema(),
        })),
        ...getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor(
          schemaDescribesEmptySet,
          negatedAtomicSchemasByConstructor,
          isNonArrayObject,
        ),
      ],
      // TODO: unevaluatedProperties
    }
  },
} as const satisfies SimplificationPlugin
