import type { JSONSchema } from 'json-schema-typed/draft-2020-12'
import intersection from 'lodash/intersection.js'
import difference from 'lodash/difference.js'

export const allJSONSchemaTypes = [
  'null',
  'number',
  /* no `'integer'` => will be represented as
   * `{ type: 'number', multipleOf: 1 }` */
  'string',
  'boolean',
  'array',
  'object',
] as const satisfies (JSONSchema.TypeValue & string)[]

export type AllJSONSchemaTypes = typeof allJSONSchemaTypes

export type JSONSchemaType = AllJSONSchemaTypes[number]

export function isJSONSchemaType(value: unknown): value is JSONSchemaType {
  const validValues: readonly unknown[] = allJSONSchemaTypes
  return validValues.includes(value)
}

/**
 * Returns an array of the provided elements that are {@link JSONSchemaType}s.
 * The elements of the returned array are unique.
 */
export function filterJSONSchemaTypes(strings: string[]): JSONSchemaType[] {
  return intersection(allJSONSchemaTypes, strings) as JSONSchemaType[]
}

export function getOtherJSONSchemaTypes(
  types: readonly JSONSchemaType[],
): JSONSchemaType[] {
  return difference(allJSONSchemaTypes, types)
}
