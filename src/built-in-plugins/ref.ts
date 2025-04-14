import {
  AllOfSchema,
  AtomicSchemaObject,
  NotSchema,
  type AtomicSchema,
  type LogicalCombinationOfLiterals,
} from '../atomic-schema/index.js'
import type {
  ExtractionPlugin,
  SimplificationPlugin,
  ConjunctionSchema,
} from '../plugin/index.js'
import { UnsupportedKeywordError } from '../unsupported-keyword-error/unsupported-keyword-error.js'

export const internalRefKey = Symbol('internalRefKey')

export abstract class RefAtomicSchemaBase extends AtomicSchemaObject {
  protected readonly [internalRefKey]: string

  constructor($ref: string) {
    super()
    /* This might throw. If the `$ref` is relative, there needs to be a valid
     * `baseURI` */
    this[internalRefKey] = new URL($ref).href
  }

  negate(): LogicalCombinationOfLiterals {
    return new NotSchema(this)
  }
}

export type RefAtomicSchemaJSON = { $ref: string }
export class RefAtomicSchema extends RefAtomicSchemaBase {
  get $ref(): string {
    return this[internalRefKey]
  }

  toJSONSchema(): RefAtomicSchemaJSON {
    return { $ref: this.$ref }
  }
}

export const refExtraction: ExtractionPlugin = {
  extract: ({ schema: { $ref, $dynamicRef, $dynamicAnchor } }) => {
    if ($dynamicAnchor !== undefined) {
      /* `$dynamicAnchor` might change how a referenced schema resource is
       * evaluated => throw immediately */
      throw new UnsupportedKeywordError('$dynamicAnchor', $dynamicAnchor)
    }

    if ($dynamicRef !== undefined) {
      /* `$dynamicRef` might change how a referenced schema resource is
       * evaluated => throw immediately */
      throw new UnsupportedKeywordError('$dynamicRef', $dynamicRef)
    }

    const schemas: AtomicSchema[] = []

    if (typeof $ref === 'string') {
      /* For the moment a simple comparison of non relative `$ref`s is sufficient.
       * In future versions this might be optimized here with special caution on
       * circular references. */
      schemas.push(new RefAtomicSchema($ref))
    }

    if (schemas.length === 0) {
      return true
    }

    return new AllOfSchema(schemas)
  },
}

export type RefConjunctionSchemaAllOfElement =
  | RefAtomicSchemaJSON
  | { not: RefAtomicSchemaJSON }

export type RefConjunctionSchemaAllOf = RefConjunctionSchemaAllOfElement[]

export type RefConjunctionSchema = {
  allOf?: RefConjunctionSchemaAllOf
}

export const refSimplification = {
  appliesToJSONSchemaType: undefined,
  mergeableKeywords: [],
  simplify({
    atomicSchemasByConstructor,
    negatedAtomicSchemasByConstructor,
  }): ConjunctionSchema<RefConjunctionSchema> {
    const refAtomicSchemas = atomicSchemasByConstructor.get(RefAtomicSchema)
    const negatedRefAtomicSchemas =
      negatedAtomicSchemasByConstructor.get(RefAtomicSchema)

    for (const { $ref } of refAtomicSchemas) {
      if (
        negatedRefAtomicSchemas.some(
          (negatedSchema) => negatedSchema.$ref === $ref,
        )
      ) {
        return false
      }
    }

    const allOf: RefConjunctionSchemaAllOf = [
      ...refAtomicSchemas.map((schema) => schema.toJSONSchema()),
      ...negatedRefAtomicSchemas.map((schema) => ({
        not: schema.toJSONSchema(),
      })),
    ]
    return allOf.length > 0 ? { allOf } : {}
  },
} as const satisfies SimplificationPlugin
