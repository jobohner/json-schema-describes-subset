import isNumber from 'lodash/isNumber.js'

import {
  AllOfSchema,
  AtomicSchemaObject,
  type LogicalCombination,
  type LogicalCombinationOfLiterals,
  NotSchema,
} from '../../atomic-schema/index.js'
import { MultipleOfAtomicSchema, TypeAtomicSchema } from '../type.js'
import { ConstAtomicSchema } from '../const.js'
import type {
  ExtractionPlugin,
  SimplificationPlugin,
  ConjunctionSchema,
  SimplificationPluginArguments,
} from '../../plugin/index.js'
import {
  findMultipleOfCardinality,
  findMultipleOfUnionCardinality,
  isInteger,
  isValidMultiple,
  multiRealLCM,
  realLCM,
} from './multiple-of-utils/index.js'
import { getNegatedConstValuesFromNegatedAtomicSchemasByConstructor } from '../negated-const-helpers.js'

export class MinimumAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly minimum: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new MaximumAtomicSchema(this.minimum),
      new NotSchema(new ConstAtomicSchema(this.minimum)),
      new TypeAtomicSchema('number'),
    ])
  }

  toJSONSchema(): { minimum: number } {
    return { minimum: this.minimum }
  }
}

export class MaximumAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly maximum: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new MinimumAtomicSchema(this.maximum),
      new NotSchema(new ConstAtomicSchema(this.maximum)),
      new TypeAtomicSchema('number'),
    ])
  }

  toJSONSchema(): { maximum: number } {
    return { maximum: this.maximum }
  }
}

export const numberExtraction: ExtractionPlugin = {
  extract: ({ schema }) => {
    const schemas: LogicalCombination[] = []

    if (typeof schema.minimum === 'number') {
      schemas.push(new MinimumAtomicSchema(schema.minimum))
    }

    if (typeof schema.maximum === 'number') {
      schemas.push(new MaximumAtomicSchema(schema.maximum))
    }

    if (typeof schema.multipleOf === 'number') {
      schemas.push(
        schema.multipleOf === 0
          ? // 0 would actually not be valid json schema, but just in case
            new ConstAtomicSchema(0)
          : new MultipleOfAtomicSchema(schema.multipleOf),
      )
    }

    if (typeof schema.exclusiveMinimum === 'number') {
      schemas.push(
        new AllOfSchema([
          new MinimumAtomicSchema(schema.exclusiveMinimum),
          new NotSchema(new ConstAtomicSchema(schema.exclusiveMinimum)),
        ]),
      )
    }

    if (typeof schema.exclusiveMaximum === 'number') {
      schemas.push(
        new AllOfSchema([
          new MaximumAtomicSchema(schema.exclusiveMaximum),
          new NotSchema(new ConstAtomicSchema(schema.exclusiveMaximum)),
        ]),
      )
    }

    if (schemas.length === 0) {
      return true
    }

    return new AllOfSchema(schemas)
  },
}

export type NumberConjunctionSchema = {
  minimum?: number
  maximum?: number
  multipleOf?: number
  allOf?: ({ not: { multipleOf: number } } | { not: { const: number } })[]
}

export const numberSimplification = {
  appliesToJSONSchemaType: 'number',
  mergeableKeywords: ['minimum', 'maximum', 'multipleOf'],
  simplify({
    atomicSchemasByConstructor,
    negatedAtomicSchemasByConstructor,
    validateConst,
  }: SimplificationPluginArguments): ConjunctionSchema<NumberConjunctionSchema> {
    const minimum = Math.max(
      ...atomicSchemasByConstructor
        .get(MinimumAtomicSchema)
        .map(({ minimum }) => minimum),
    )

    const maximum = Math.min(
      ...atomicSchemasByConstructor
        .get(MaximumAtomicSchema)
        .map(({ maximum }) => maximum),
    )

    if (minimum > maximum) {
      return false
    }

    if (minimum === maximum) {
      return validateConst(minimum)
    }

    const negatedConsts =
      getNegatedConstValuesFromNegatedAtomicSchemasByConstructor(
        negatedAtomicSchemasByConstructor,
        isNumber,
      )

    const negatedMultipleOfs = negatedAtomicSchemasByConstructor
      .get(MultipleOfAtomicSchema)
      .map(({ multipleOf }) => multipleOf)

    const multipleOf = multiRealLCM(
      ...atomicSchemasByConstructor
        .get(MultipleOfAtomicSchema)
        .map(({ multipleOf }) => multipleOf),
    )

    if (multipleOf !== undefined) {
      if (
        negatedMultipleOfs.some((negatedMultipleOf) =>
          isInteger(multipleOf / negatedMultipleOf),
        )
      ) {
        return false
      }

      const { cardinality: possibleValuesCount, singleElement } =
        findMultipleOfCardinality(multipleOf, minimum, maximum)

      if (singleElement !== undefined) {
        return validateConst(singleElement)
      }

      if (possibleValuesCount === 0) {
        return false
      }

      if (Number.isFinite(possibleValuesCount)) {
        /**
         * Applying de Morgan's theorem to {@link negatedMultipleOfs} and
         * {@link negatedConsts} makes a negated union of multipleOfs or consts.
         * If these (negated) multipeOfs or consts are intersected with
         * {@link mulitpleOf} first, that union is a subset of the elements
         * described by {@link mulitpleOf}. If {@link impossibleValuesCount} is
         * the same as {@link possibleValuesCount}, there are no elements in this
         * set => return true
         */

        const impossibleValuesCount = findMultipleOfUnionCardinality(
          minimum,
          maximum,
          negatedMultipleOfs.map((negatedMultipleOf) =>
            realLCM(negatedMultipleOf, multipleOf),
          ),
          negatedConsts.filter(isValidMultiple(multipleOf, minimum, maximum)),
        )

        if (impossibleValuesCount >= possibleValuesCount) {
          return false
        }
      }
    }

    return {
      ...(minimum > -Infinity ? { minimum } : {}),
      ...(maximum < Infinity ? { maximum } : {}),
      ...(multipleOf !== undefined ? { multipleOf } : {}),
      allOf: [
        ...negatedConsts.map((constValue) => ({ not: { const: constValue } })),
        ...negatedMultipleOfs.map((multipleOf) => ({ not: { multipleOf } })),
      ],
    }
  },
} as const satisfies SimplificationPlugin
