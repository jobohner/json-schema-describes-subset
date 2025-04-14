import {
  type JSONSchema,
  assertJSONSchema,
  isJSONSchema,
} from '../json-schema/index.js'
import {
  AllOfSchema,
  AnyOfSchema,
  NotSchema,
  type LogicalCombination,
} from '../atomic-schema/index.js'
import type {
  ExtractionPlugin,
  ExtractFunctionArguments,
} from '../plugin/index.js'

export function extractIfThenElse(
  split: ExtractFunctionArguments['split'],
  ifSchema: JSONSchema,
  thenSchema?: JSONSchema | undefined,
  elseSchema?: JSONSchema | undefined,
): LogicalCombination {
  const allOf: LogicalCombination[] = []

  if (thenSchema !== undefined) {
    allOf.push(
      new AnyOfSchema([new NotSchema(split(ifSchema)), split(thenSchema)]),
    )
  }

  if (elseSchema !== undefined) {
    allOf.push(new AnyOfSchema([split(ifSchema), split(elseSchema)]))
  }

  return new AllOfSchema(allOf)
}

export const ifThenElseExtraction: ExtractionPlugin = {
  extract: ({ schema, split }) => {
    const { if: ifValue, then: thenValue, else: elseValue } = schema

    if (!isJSONSchema(ifValue)) return true

    return extractIfThenElse(
      split,
      ifValue,
      assertJSONSchema(thenValue),
      assertJSONSchema(elseValue),
    )
  },
}
