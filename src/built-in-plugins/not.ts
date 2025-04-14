import { NotSchema } from '../atomic-schema/index.js'
import { isJSONSchema } from '../json-schema/index.js'
import type { ExtractionPlugin } from '../plugin/index.js'

export const notExtraction: ExtractionPlugin = {
  extract: ({ schema: { not }, split }) => {
    if (!isJSONSchema(not)) {
      return true
    }

    return new NotSchema(split(not))
  },
}
