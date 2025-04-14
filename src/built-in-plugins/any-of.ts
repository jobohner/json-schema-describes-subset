import { AnyOfSchema } from '../atomic-schema/index.js'
import { isJSONSchema } from '../json-schema/index.js'
import type { ExtractionPlugin } from '../plugin/index.js'
import { isArrayOf } from '../utils/type-guards/index.js'

export const anyOfExtraction: ExtractionPlugin = {
  extract: ({ schema: { anyOf }, split }) => {
    if (!isArrayOf(isJSONSchema)(anyOf) || anyOf.length === 0) {
      return true
    }

    return new AnyOfSchema(anyOf.map((schema) => split(schema)))
  },
}
