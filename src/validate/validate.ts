import { Ajv2020 as Ajv, type Schema } from 'ajv/dist/2020.js'
import isObject from 'lodash/isObject.js'

import type { JSONSchema, JSONSchemaObject } from '../json-schema/index.js'
import type { ValidationPlugin } from '../plugin/plugin.js'

/**
 * Setting for {@link Ajv}'s options. Fixed opinionated value, that should work
 * for the vast majority of cases. Rounding errors should usually be smaller
 * than this. Setting this option in ajv will have a minor influence on
 * performance, but since this tool is designed for static schema analysis, this
 * is tolerable.
 */
export const multipleOfPrecision = 7
export const multipleOfEpsilon = 10 ** -multipleOfPrecision

export type ValidateFunction = (schema: JSONSchema, data: unknown) => boolean

export function enhanceSchema(
  schema: JSONSchema,
  definitions: JSONSchemaObject[],
): JSONSchema {
  if (typeof schema === 'boolean') {
    return schema
  }

  const $defs: Record<string, JSONSchema> = isObject(schema.$defs)
    ? { ...schema.$defs }
    : {}

  const defaultKeyBase = 'def'
  const startIndex = 0

  for (const definition of definitions) {
    let keyBase: string = defaultKeyBase

    if (typeof definition.$id === 'string') {
      keyBase = definition.$id
    }

    // eslint-disable-next-line no-constant-condition
    for (let i = startIndex; true; i++) {
      const key =
        i === startIndex && keyBase !== defaultKeyBase
          ? keyBase
          : `${keyBase} ${String(i)}`

      if (!(key in $defs)) {
        $defs[key] = definition
        break
      }
    }
  }

  return { ...schema, $defs }
}

export function createValidate(
  plugins: ValidationPlugin[],
  definitions: JSONSchemaObject[],
): ValidateFunction {
  return function (schema: JSONSchema, data: unknown): boolean {
    /* always create a new Ajv instance so that previous calls
     * don't save any schema data that might be invalid with
     * later calls */
    const ajv = new Ajv({
      strict: false,
      multipleOfPrecision,
      validateSchema: false,
    })

    plugins.forEach((plugin: ValidationPlugin): void => plugin.modifyAjv(ajv))

    const validationSchema = (
      definitions.length === 0 ? schema : enhanceSchema(schema, definitions)
    ) as Schema

    return ajv.validate(validationSchema, data)
  }
}
