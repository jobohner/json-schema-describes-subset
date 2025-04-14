import type {
  ExtractionPlugin,
  SimplificationPlugin,
  ConjunctionSchema,
} from '../plugin/index.js'
import {
  AnyOfSchema,
  AtomicSchemaObject,
  NotSchema,
  type LogicalCombinationOfLiterals,
} from '../atomic-schema/index.js'

export class ConstAtomicSchema<Type = unknown> extends AtomicSchemaObject {
  readonly const: Type

  constructor(constValue: Type) {
    super()
    this.const = constValue
  }

  negate(): LogicalCombinationOfLiterals {
    return new NotSchema(this)
  }

  toJSONSchema(): { const: unknown } {
    return { const: this.const }
  }
}

export const constExtraction: ExtractionPlugin = {
  extract: ({ schema: { const: constValue, enum: enumValues } }) => {
    if (constValue !== undefined) {
      if (
        !enumValues ||
        (Array.isArray(enumValues) && enumValues.includes(constValue))
      ) {
        return new ConstAtomicSchema(constValue)
      }

      return false
    }

    if (Array.isArray(enumValues)) {
      return new AnyOfSchema(
        enumValues.map((value) => new ConstAtomicSchema(value)),
      )
    }

    return true
  },
}

export const constSimplification = {
  appliesToJSONSchemaType: undefined,
  mergeableKeywords: [],
  simplify({
    atomicSchemasByConstructor,
    validateConst,
  }): ConjunctionSchema<{ allOf?: never[] }> {
    const [constSchema] = atomicSchemasByConstructor.get(ConstAtomicSchema)
    if (constSchema !== undefined) {
      return validateConst(constSchema.const)
    }

    return true
  },
} as const satisfies SimplificationPlugin
