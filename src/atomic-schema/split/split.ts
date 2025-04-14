import type { JSONSchema } from '../../json-schema/index.js'
import { AllOfSchema, type LogicalCombination } from '../atomic-schema.js'
import { toRawDNF, type RawDNF } from '../to-raw-dnf/index.js'
import type { ExtractFunctionArguments } from '../../plugin/index.js'
import type { InternalOptions } from '../../options/index.js'

/**
 * Converts the provided schema to an `allOf`-schema containing only logical
 * combinations of atomic subschemas.
 */
export function split({
  schema,
  options,
}: {
  schema: JSONSchema
  options: InternalOptions
}): LogicalCombination {
  if (typeof schema === 'boolean') {
    return schema
  }

  const extractionArguments: ExtractFunctionArguments = {
    schema,
    split: (schema) => split({ schema, options }),
  }

  const subschemas = options.plugins.extractions
    .map(({ extract }) => extract(extractionArguments))
    .filter((schema) => schema !== true)

  if (subschemas.length === 0) {
    return true
  }

  return new AllOfSchema(subschemas)
}

export function splitToRawDNF(
  schema: JSONSchema,
  options: InternalOptions,
): RawDNF {
  return toRawDNF(split({ schema, options }))
}

export type SplitToRawDNF = typeof splitToRawDNF
