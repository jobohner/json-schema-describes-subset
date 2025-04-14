import { AllOfSchema } from '../atomic-schema/index.js'
import { isJSONSchema } from '../json-schema/index.js'
import type { ExtractionPlugin } from '../plugin/index.js'
import { isArrayOf } from '../utils/type-guards/index.js'

export const allOfExtraction: ExtractionPlugin = {
  extract: ({ schema: { allOf }, split }) => {
    if (!isArrayOf(isJSONSchema)(allOf) || allOf.length === 0) {
      return true
    }

    return new AllOfSchema(allOf.map((schema) => split(schema)))
  },
}
