import {
  AllOfSchema,
  AnyOfSchema,
  NotSchema,
  type LogicalCombination,
} from '../atomic-schema/index.js'
import { isJSONSchema } from '../json-schema/index.js'
import type { ExtractionPlugin } from '../plugin/index.js'
import { isArrayOf } from '../utils/type-guards/index.js'

export const oneOfExtraction: ExtractionPlugin = {
  extract: ({ schema: { oneOf }, split }) => {
    if (!isArrayOf(isJSONSchema)(oneOf)) return true

    const anyOf: LogicalCombination[] = []
    for (let i = 0; i < oneOf.length; i++) {
      anyOf.push(
        new AllOfSchema(
          oneOf.map((subschema, j) => {
            const atomicSubschema = split(subschema)
            return i === j ? atomicSubschema : new NotSchema(atomicSubschema)
          }),
        ),
      )
    }
    return new AnyOfSchema(anyOf)
  },
}
