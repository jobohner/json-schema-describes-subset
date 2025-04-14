import { describe, expectTypeOf, it } from 'vitest'

import type {
  JSONSchemaObject,
  JSONSchema,
  GeneralJSONSchema,
} from './json-schema.js'

describe('JSONSchema', () => {
  it('is equivalent to GeneralJSONSchema', () => {
    expectTypeOf<JSONSchemaObject>().toMatchTypeOf<Record<string, unknown>>()
    expectTypeOf<Record<string, unknown>>().toMatchTypeOf<JSONSchemaObject>()

    expectTypeOf<JSONSchemaObject>().not.toMatchTypeOf<boolean>()
    expectTypeOf<boolean>().not.toMatchTypeOf<JSONSchemaObject>()

    expectTypeOf<JSONSchema>().toMatchTypeOf<GeneralJSONSchema>()
    expectTypeOf<GeneralJSONSchema>().toMatchTypeOf<JSONSchema>()
  })
})
