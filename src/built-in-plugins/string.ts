import isString from 'lodash/isString.js'

import {
  AtomicSchemaObject,
  type LogicalCombinationOfLiterals,
  AllOfSchema,
  type AtomicSchema,
  NotSchema,
} from '../atomic-schema/index.js'
import { TypeAtomicSchema } from './type.js'
import {
  negateIntegerMaximum,
  negateIntegerMinimum,
} from '../utils/negate-integer-min-max/index.js'
import type {
  ConjunctionSchema,
  ExtractionPlugin,
  SimplificationPlugin,
  SimplificationPluginArguments,
} from '../plugin/index.js'
import { getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor } from './negated-const-helpers.js'

export class PatternAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly pattern: string) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('string'),
    ])
  }

  toJSONSchema(): { pattern: string } {
    return { pattern: this.pattern }
  }
}

export class MinLengthAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly minLength: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new MaxLengthAtomicSchema(negateIntegerMinimum(this.minLength)),
      new TypeAtomicSchema('string'),
    ])
  }

  toJSONSchema(): { minLength: number } {
    return { minLength: this.minLength }
  }
}

export class MaxLengthAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly maxLength: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new MinLengthAtomicSchema(negateIntegerMaximum(this.maxLength)),
      new TypeAtomicSchema('string'),
    ])
  }

  toJSONSchema(): { maxLength: number } {
    return { maxLength: this.maxLength }
  }
}

export const stringExtraction: ExtractionPlugin = {
  extract: ({ schema }) => {
    const schemas: AtomicSchema[] = []

    if (typeof schema.pattern === 'string') {
      schemas.push(new PatternAtomicSchema(schema.pattern))
    }

    if (typeof schema.minLength === 'number') {
      schemas.push(new MinLengthAtomicSchema(schema.minLength))
    }

    if (typeof schema.maxLength === 'number') {
      schemas.push(new MaxLengthAtomicSchema(schema.maxLength))
    }

    if (schemas.length === 0) {
      return true
    }

    return new AllOfSchema(schemas)
  },
}

export type StringConjunctionSchema = {
  minLength?: number
  maxLength?: number
  allOf?: (
    | { pattern: string }
    | { not: { pattern: string } }
    | { not: { const: string } }
  )[]
}

export const stringSimplification = {
  appliesToJSONSchemaType: 'string',
  mergeableKeywords: ['minLength', 'maxLength'],
  simplify({
    schemaDescribesEmptySet,
    atomicSchemasByConstructor,
    negatedAtomicSchemasByConstructor,
    validateConst,
  }: SimplificationPluginArguments): ConjunctionSchema<StringConjunctionSchema> {
    const minLength = Math.ceil(
      Math.max(
        0,
        ...atomicSchemasByConstructor
          .get(MinLengthAtomicSchema)
          .map(({ minLength }) => minLength),
      ),
    )

    const maxLength = Math.floor(
      Math.min(
        ...atomicSchemasByConstructor
          .get(MaxLengthAtomicSchema)
          .map(({ maxLength }) => maxLength),
      ),
    )

    if (minLength > maxLength) {
      return false
    }

    if (maxLength <= 0) {
      return validateConst('')
    }

    const patternAtomicSchemas =
      atomicSchemasByConstructor.get(PatternAtomicSchema)
    const negatedPatternAtomicSchemas =
      negatedAtomicSchemasByConstructor.get(PatternAtomicSchema)

    for (const { pattern } of patternAtomicSchemas) {
      if (
        negatedPatternAtomicSchemas.some(
          (notSchema) => pattern === notSchema.pattern,
        )
      ) {
        return false
      }
    }

    return {
      ...(minLength > 0 ? { minLength } : {}),
      ...(maxLength < Infinity ? { maxLength } : {}),
      allOf: [
        ...patternAtomicSchemas.map(({ pattern }) => ({ pattern })),
        ...negatedPatternAtomicSchemas.map(({ pattern }) => ({
          not: { pattern },
        })),
        ...getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor(
          schemaDescribesEmptySet,
          negatedAtomicSchemasByConstructor,
          isString,
        ),
      ],
    }
  },
} as const satisfies SimplificationPlugin
