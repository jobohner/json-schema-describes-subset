import type { JSONSchema } from '../../../json-schema/index.js'

import type { InternalOptions } from '../../../options/index.js'
import type { SplitToRawDNF } from '../../../atomic-schema/split/index.js'
import type { RawDNF } from '../../../atomic-schema/to-raw-dnf/index.js'
import { ConstAtomicSchema } from '../../const.js'
import { TypeAtomicSchema } from '../../type.js'
import { PatternAtomicSchema } from '../../string.js'
import { groupLogicLiteralConjuncts } from '../../../dnf/group-logic-literal-conjuncts.js'

const validAtomicSchemaConstructors: object['constructor'][] = [
  TypeAtomicSchema,
  PatternAtomicSchema,
]

export type IsStringWithConstsOrPatternsResult =
  | {
      isStringWithConstsOrPatterns: true
      consts: string[]
      patterns: string[]
    }
  | {
      isStringWithConstsOrPatterns: false
      consts?: undefined
      patterns?: undefined
    }

/**
 * Returns constant values and patterns that will satisfy the provided string
 * schema. Returns null if the schema if such constant values or patterns could
 * not be found.
 */
export function retrieveStringSchemaConstsAndPatterns({
  schema,
  options,
  splitToRawDNF,
}: {
  schema: JSONSchema
  options: InternalOptions
  splitToRawDNF: SplitToRawDNF
}): IsStringWithConstsOrPatternsResult {
  return retrieveStringSchemaConstsAndPatternsFromRawDNF(
    splitToRawDNF(schema, options),
    options,
  )
}

export function retrieveStringSchemaConstsAndPatternsFromRawDNF(
  dnf: RawDNF,
  options: InternalOptions,
): IsStringWithConstsOrPatternsResult {
  const consts = new Set<string>()
  const patterns = new Set<string>()

  const validate = options.validate

  for (const conjunction of dnf.anyOf) {
    const {
      booleanSchema,
      atomicSchemasByConstructor,
      negatedAtomicSchemasByConstructor,
      types,
    } = groupLogicLiteralConjuncts(conjunction.allOf)

    if (booleanSchema !== undefined) {
      return { isStringWithConstsOrPatterns: false }
    }

    const constSchema = atomicSchemasByConstructor.get(ConstAtomicSchema)[0]
    if (constSchema !== undefined) {
      if (
        validate(conjunction.toJSONSchema(), constSchema.const) &&
        typeof constSchema.const === 'string'
      ) {
        consts.add(constSchema.const)
        continue
      } else {
        return { isStringWithConstsOrPatterns: false }
      }
    }

    if ([...negatedAtomicSchemasByConstructor.getConstructors()].length > 0) {
      return { isStringWithConstsOrPatterns: false }
    }

    if (
      [...atomicSchemasByConstructor.getConstructors()].some(
        (constructor) => !validAtomicSchemaConstructors.includes(constructor),
      )
    ) {
      return { isStringWithConstsOrPatterns: false }
    }

    if (types.length !== 1 || types[0] !== 'string') {
      return { isStringWithConstsOrPatterns: false }
    }

    const patternSchemas = atomicSchemasByConstructor.get(PatternAtomicSchema)
    const patternSchema = patternSchemas[0]
    if (patternSchema && patternSchemas.length === 1) {
      patterns.add(patternSchema.pattern)
      continue
    }

    return { isStringWithConstsOrPatterns: false }
  }

  if (consts.size === 0 && patterns.size === 0) {
    return { isStringWithConstsOrPatterns: false }
  }

  const patternsArray = [...patterns]

  return {
    isStringWithConstsOrPatterns: true,
    consts: [...consts].filter((constValue) =>
      patternsArray.every((pattern) => !validate({ pattern }, constValue)),
    ),
    patterns: patternsArray,
  }
}
