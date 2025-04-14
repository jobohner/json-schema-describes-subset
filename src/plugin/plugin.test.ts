import { describe, it, expectTypeOf, expect } from 'vitest'

import type { JSONSchema } from '../json-schema/index.js'

import {
  type AllOfElement,
  type NonConstConjunctionSchemaObject,
  type SimplificationPlugin,
  type SimplificationResultSchemaByType,
  type ConjunctionSchema,
  type SimplificationPluginType,
  type SimplificationResultSchemaForType,
  isConstSchema,
  type SimplificationPluginArguments,
  type NonConstConjunctionSchemaObjectSimplifyReturnType,
  type SimplificationPluginMergeableKeyword,
  type SimplificationPluginWithMergeableKeyword,
  type SimplificationPluginWithType,
  type SimplificationResultNonConstConjunctionSchemaObjectForType,
} from './plugin.js'
import type { OptionalKey, RequiredKey } from '../utils/type-helpers/index.js'
import type {
  AdditionalPropertiesAtomicSchemaJSON,
  arraySimplification,
  BuiltInSimplificationPluginId,
  constSimplification,
  numberSimplification,
  objectSimplification,
  PatternPropertiesAtomicSchemaJSON,
  stringSimplification,
} from '../built-in-plugins/index.js'
import type { JSONSchemaType } from '../json-schema-type/json-schema-type.js'

type StringConjunctionSchema = {
  minLength?: number
  maxLength?: number
  allOf?: ({ pattern: string } | { not: { pattern: string } })[]
}

expectTypeOf<StringConjunctionSchema>().toMatchTypeOf<NonConstConjunctionSchemaObject>()

type NumberConjunctionSchema = {
  minimum?: number
  maximum?: number
  multipleOf?: number
  allOf?: ({ not: { multipleOf: number } } | { not: { const: number } })[]
}

expectTypeOf<NumberConjunctionSchema>().toMatchTypeOf<NonConstConjunctionSchemaObject>()

type FantasyConjunctionSchema = {
  minimum?: string
  maximum: number
  multipleOf: string
  fantasyProp3: boolean
  allOf: { minimum: number }[]
}

expectTypeOf<FantasyConjunctionSchema>().toMatchTypeOf<NonConstConjunctionSchemaObject>()

type FantasyConjunctionSchema2 = {
  fantasyProp1?: string
  fantasyProp2: number
  allOf?: never[]
}

expectTypeOf<FantasyConjunctionSchema2>().toMatchTypeOf<NonConstConjunctionSchemaObject>()

type NumberSimplificationPlugin = {
  appliesToJSONSchemaType: 'number'
  mergeableKeywords: (keyof NumberConjunctionSchema)[]
  simplify: (
    args: SimplificationPluginArguments,
  ) => ConjunctionSchema<NumberConjunctionSchema>
  overrides?: BuiltInSimplificationPluginId | undefined
  extract?: undefined
}

expectTypeOf<NumberSimplificationPlugin>().toMatchTypeOf<SimplificationPlugin>()

export type FantasySimplificationPlugin = {
  appliesToJSONSchemaType: 'number'
  mergeableKeywords: (keyof FantasyConjunctionSchema)[]
  simplify: (
    args: SimplificationPluginArguments,
  ) => ConjunctionSchema<FantasyConjunctionSchema>
  overrides?: BuiltInSimplificationPluginId | undefined
  extract?: undefined
}

expectTypeOf<FantasySimplificationPlugin>().toMatchTypeOf<SimplificationPlugin>()

export type FantasySimplificationPlugin2 = {
  appliesToJSONSchemaType: ['number', 'string']
  mergeableKeywords: (keyof FantasyConjunctionSchema2)[]
  simplify: (
    args: SimplificationPluginArguments,
  ) => ConjunctionSchema<FantasyConjunctionSchema2>
  overrides?: BuiltInSimplificationPluginId | undefined
  extract?: undefined
}

expectTypeOf<FantasySimplificationPlugin2>().toMatchTypeOf<SimplificationPlugin>()

type StringSimplificationPlugin = {
  appliesToJSONSchemaType: 'string'
  mergeableKeywords: (keyof StringConjunctionSchema)[]
  simplify: (
    args: SimplificationPluginArguments,
  ) => ConjunctionSchema<StringConjunctionSchema>
  overrides?: BuiltInSimplificationPluginId | undefined
  extract?: undefined
}

expectTypeOf<StringSimplificationPlugin>().toMatchTypeOf<SimplificationPlugin>()

describe('NonConstConjunctionSchemaObject', () => {
  it('accepts correct types', () => {
    expectTypeOf<
      Record<string, never>
    >().toMatchTypeOf<NonConstConjunctionSchemaObject>()
    expectTypeOf<{
      allOf?: number
    }>().not.toMatchTypeOf<NonConstConjunctionSchemaObject>()
    expectTypeOf<{
      const?: number
    }>().not.toMatchTypeOf<NonConstConjunctionSchemaObject>()
    expectTypeOf<{
      not?: number
    }>().not.toMatchTypeOf<NonConstConjunctionSchemaObject>()
    expectTypeOf<{
      anyOf?: number
    }>().not.toMatchTypeOf<NonConstConjunctionSchemaObject>()
    expectTypeOf<{
      fantasyKeyword: number
    }>().toMatchTypeOf<NonConstConjunctionSchemaObject>()
  })

  it('has the expected required and optional keys', () => {
    expectTypeOf<
      RequiredKey<NonConstConjunctionSchemaObject>
    >().toEqualTypeOf<never>()
    expectTypeOf<
      OptionalKey<NonConstConjunctionSchemaObject>
    >().toEqualTypeOf<string>()
  })
})

describe('AllOfElement', () => {
  it('extracts the correct element type', () => {
    expectTypeOf<AllOfElement<{ allOf: string[] }>>().toEqualTypeOf<string>()
    expectTypeOf<AllOfElement<{ allOf?: number[] }>>().toEqualTypeOf<number>()
    expectTypeOf<AllOfElement<{ allOf?: never[] }>>().toEqualTypeOf<never>()
    expectTypeOf<AllOfElement<{ allOf: never[] }>>().toEqualTypeOf<never>()

    // @ts-expect-error `string` is not an array
    expectTypeOf<AllOfElement<{ allOf: string }>>().toEqualTypeOf<never>()
  })
})

describe(isConstSchema, () => {
  it('identifies const schemas correctly', () => {
    expect(isConstSchema({ const: 5 })).toBe(true)
    expect(isConstSchema({ const: false })).toBe(true)
    expect(isConstSchema({ const: '' })).toBe(true)
    expect(isConstSchema({ const: 'false' })).toBe(true)
    expect(isConstSchema({ const: null })).toBe(true)
    expect(isConstSchema({ const: undefined })).toBe(true)
    expect(isConstSchema({ const: [undefined] })).toBe(true)
    expect(isConstSchema({ const: [null] })).toBe(true)
    expect(isConstSchema({ const: [] })).toBe(true)

    expect(isConstSchema({})).toBe(false)
    expect(isConstSchema({ a: 5 })).toBe(false)
  })

  it('identifies non objects correctly', () => {
    expect(isConstSchema(true)).toBe(false)
    expect(isConstSchema(false)).toBe(false)
    expect(isConstSchema(5)).toBe(false)
    expect(isConstSchema(0)).toBe(false)
    expect(isConstSchema('string')).toBe(false)
    expect(isConstSchema('')).toBe(false)
    expect(isConstSchema(null)).toBe(false)
  })
})

describe('SimplificationResultSchema', () => {
  it('creates the expected result schema', () => {
    expectTypeOf<ConjunctionSchema<NumberConjunctionSchema>>().toEqualTypeOf<
      boolean | { const: unknown } | NumberConjunctionSchema
    >()
  })
})

describe('SimplificationPluginType', () => {
  it('extracts the expected type from a plugin', () => {
    expectTypeOf<
      SimplificationPluginType<NumberSimplificationPlugin>
    >().toEqualTypeOf<'number'>()

    expectTypeOf<
      SimplificationPluginType<FantasySimplificationPlugin>
    >().toEqualTypeOf<'number'>()

    expectTypeOf<
      SimplificationPluginType<FantasySimplificationPlugin2>
    >().toEqualTypeOf<'number' | 'string'>()

    expectTypeOf<
      SimplificationPluginType<StringSimplificationPlugin>
    >().toEqualTypeOf<'string'>()

    expectTypeOf<
      SimplificationPluginType<SimplificationPlugin>
    >().toEqualTypeOf<JSONSchemaType>()

    expectTypeOf<
      SimplificationPluginType<{
        type: undefined
        mergeableKeywords: string[]
        simplify: (
          args: SimplificationPluginArguments,
        ) => ConjunctionSchema<NonConstConjunctionSchemaObject> & {
          type?: never
        }
        overrides?: BuiltInSimplificationPluginId | undefined
        extract?: undefined
      }>
    >().toEqualTypeOf<JSONSchemaType>()

    expectTypeOf<
      SimplificationPluginType<{
        mergeableKeywords: string[]
        simplify: (
          args: SimplificationPluginArguments,
        ) => ConjunctionSchema<NonConstConjunctionSchemaObject> & {
          type?: never
        }
        overrides?: BuiltInSimplificationPluginId | undefined
        extract?: undefined
      }>
    >().toEqualTypeOf<JSONSchemaType>()

    expectTypeOf<
      SimplificationPluginType<{
        type: JSONSchemaType | JSONSchemaType[] | undefined
        mergeableKeywords: string[]
        simplify: (
          args: SimplificationPluginArguments,
        ) => ConjunctionSchema<NonConstConjunctionSchemaObject> & {
          type?: never
        }
        overrides?: BuiltInSimplificationPluginId | undefined
        extract?: undefined
      }>
    >().toEqualTypeOf<JSONSchemaType>()

    expectTypeOf<
      SimplificationPluginType<{
        type: JSONSchemaType[]
        mergeableKeywords: string[]
        simplify: (
          args: SimplificationPluginArguments,
        ) => ConjunctionSchema<NonConstConjunctionSchemaObject> & {
          type?: never
        }
        overrides?: BuiltInSimplificationPluginId | undefined
        extract?: undefined
      }>
    >().toEqualTypeOf<JSONSchemaType>()

    expectTypeOf<
      SimplificationPluginType<{
        appliesToJSONSchemaType: 'number' | ('string' | 'boolean')[]
        mergeableKeywords: string[]
        simplify: (
          args: SimplificationPluginArguments,
        ) => ConjunctionSchema<NonConstConjunctionSchemaObject> & {
          type?: never
        }
        overrides?: BuiltInSimplificationPluginId | undefined
        extract?: undefined
      }>
    >().toEqualTypeOf<'number' | 'string' | 'boolean'>()

    expectTypeOf<
      SimplificationPluginType<{
        appliesToJSONSchemaType: []
        mergeableKeywords: string[]
        simplify: (
          args: SimplificationPluginArguments,
        ) => ConjunctionSchema<NonConstConjunctionSchemaObject> & {
          type?: never
        }
        overrides?: BuiltInSimplificationPluginId | undefined
        extract?: undefined
      }>
    >().toEqualTypeOf<never>()
  })
})

describe('NonConstConjunctionSchemaObjectSimplifyReturnType', () => {
  it('creates the expected type', () => {
    type TypeA = NonConstConjunctionSchemaObjectSimplifyReturnType<
      NumberSimplificationPlugin | FantasySimplificationPlugin
    >

    expectTypeOf<TypeA>().toEqualTypeOf<
      NumberConjunctionSchema | FantasyConjunctionSchema
    >()

    type TypeB = NonConstConjunctionSchemaObjectSimplifyReturnType<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
    >

    expectTypeOf<TypeB>().toEqualTypeOf<
      | NumberConjunctionSchema
      | FantasyConjunctionSchema
      | FantasyConjunctionSchema2
    >()

    type TypeC =
      NonConstConjunctionSchemaObjectSimplifyReturnType<SimplificationPlugin>

    expectTypeOf<TypeC>().toEqualTypeOf<
      {
        type?: never
      } & {
        type?: JSONSchemaType
        const?: never
        anyOf?: never
        not?: never
        allOf?: JSONSchema[]
        [key: string]: unknown
      }
    >()

    type TypeD = NonConstConjunctionSchemaObjectSimplifyReturnType<never>
    expectTypeOf<TypeD>().toEqualTypeOf<never>()
  })
})

describe('SimplificationPluginMergeableKeyword', () => {
  it('creates the expected key union', () => {
    type TypeA =
      SimplificationPluginMergeableKeyword<NumberSimplificationPlugin>

    expectTypeOf<TypeA>().toEqualTypeOf<'minimum' | 'maximum' | 'multipleOf'>()

    type TypeB = SimplificationPluginMergeableKeyword<
      NumberSimplificationPlugin | FantasySimplificationPlugin
    >

    expectTypeOf<TypeB>().toEqualTypeOf<
      'minimum' | 'maximum' | 'multipleOf' | 'fantasyProp3'
    >()

    type TypeC = SimplificationPluginMergeableKeyword<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin
    >

    expectTypeOf<TypeC>().toEqualTypeOf<
      | 'maximum'
      | 'maxLength'
      | 'minimum'
      | 'minLength'
      | 'multipleOf'
      | 'fantasyProp3'
      | 'fantasyProp1'
      | 'fantasyProp2'
    >()

    type TypeD = SimplificationPluginMergeableKeyword<SimplificationPlugin>

    expectTypeOf<TypeD>().toEqualTypeOf<string>()

    type TypeE = SimplificationPluginMergeableKeyword<never>
    expectTypeOf<TypeE>().toEqualTypeOf<never>()

    type PluginF = {
      type: 'number'
      mergeableKeywords: []
      simplify: (args: SimplificationPluginArguments) => { test: number }
    }
    expectTypeOf<PluginF>().toMatchTypeOf<SimplificationPlugin>()
    type TypeF = SimplificationPluginMergeableKeyword<PluginF>
    expectTypeOf<TypeF>().toEqualTypeOf<never>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pluginG = {
      appliesToJSONSchemaType: 'number',
      mergeableKeywords: [],
      simplify: (): { test: number } => ({
        test: 5,
      }),
    } as const satisfies SimplificationPlugin
    type TypeG = SimplificationPluginMergeableKeyword<typeof pluginG>
    expectTypeOf<TypeG>().toEqualTypeOf<never>()
  })
})

describe('SimplificationPluginWithMergeableKeyword', () => {
  it('creates the expected type', () => {
    type TypeA = SimplificationPluginWithMergeableKeyword<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin,
      'minimum'
    >

    expectTypeOf<TypeA>().toEqualTypeOf<
      NumberSimplificationPlugin | FantasySimplificationPlugin
    >()

    type TypeB = SimplificationPluginWithMergeableKeyword<
      StringSimplificationPlugin,
      'minimum'
    >

    expectTypeOf<TypeB>().toEqualTypeOf<never>()

    type TypeC = SimplificationPluginWithMergeableKeyword<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin,
      string
    >

    expectTypeOf<TypeC>().toEqualTypeOf<never>()

    type TypeD = SimplificationPluginWithMergeableKeyword<
      SimplificationPlugin,
      string
    >

    expectTypeOf<TypeD>().toEqualTypeOf<SimplificationPlugin>()
  })
})

describe('SimplificationResultNonConstConjunctionSchemaObjectForType', () => {
  it('creates the expected type', () => {
    type TypeA = SimplificationResultNonConstConjunctionSchemaObjectForType<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin,
      'number'
    >

    expectTypeOf<TypeA>().toEqualTypeOf<
      {
        type: 'number'
      } & {
        minimum?: string | number
        maximum?: number
        multipleOf?: string | number
        fantasyProp3?: boolean
        fantasyProp1?: string
        fantasyProp2?: number
      } & {
        allOf?: (
          | { not: { multipleOf: number } }
          | { not: { const: number } }
          | { minimum: number }
        )[]
        const?: never
        anyOf?: never
        not?: never
      }
    >()

    type TypeB = SimplificationResultNonConstConjunctionSchemaObjectForType<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin,
      JSONSchemaType
    >

    expectTypeOf<TypeB>().toEqualTypeOf<
      {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
      } & {
        minimum?: string | number
        maximum?: number
        multipleOf?: string | number
        maxLength?: number
        minLength?: number
        fantasyProp3?: boolean
        fantasyProp1?: string
        fantasyProp2?: number
      } & {
        allOf?: (
          | { not: { multipleOf: number } }
          | { not: { const: number } }
          | { minimum: number }
          | { pattern: string }
          | { not: { pattern: string } }
        )[]
        const?: never
        anyOf?: never
        not?: never
      }
    >()

    type TypeC = SimplificationResultNonConstConjunctionSchemaObjectForType<
      SimplificationPlugin,
      'number'
    >

    expectTypeOf<TypeC>().toEqualTypeOf<
      {
        type: 'number'
      } & Record<string, unknown> & {
          allOf?: JSONSchema[]
          const?: never
          anyOf?: never
          not?: never
        }
    >()

    type TypeD = SimplificationResultNonConstConjunctionSchemaObjectForType<
      SimplificationPlugin,
      JSONSchemaType
    >

    expectTypeOf<TypeD>().toEqualTypeOf<
      {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
      } & Record<string, unknown> & {
          allOf?: JSONSchema[]
          const?: never
          anyOf?: never
          not?: never
        }
    >()
  })
})

describe('SimplificationPluginWithType', () => {
  it('creates the expected type', () => {
    type TypeA = SimplificationPluginWithType<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin,
      'number'
    >

    expectTypeOf<TypeA>().toEqualTypeOf<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
    >()

    type TypeB = SimplificationPluginWithType<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin,
      'string'
    >

    expectTypeOf<TypeB>().toEqualTypeOf<
      FantasySimplificationPlugin2 | StringSimplificationPlugin
    >()

    type TypeC = SimplificationPluginWithType<
      StringSimplificationPlugin,
      'number'
    >

    expectTypeOf<TypeC>().toEqualTypeOf<never>()

    type TypeD = SimplificationPluginWithType<
      StringSimplificationPlugin,
      'string'
    >

    expectTypeOf<TypeD>().toEqualTypeOf<StringSimplificationPlugin>()
  })
})

describe('SimplificationResultSchemaForType', () => {
  type GeneralSimplificationResultSchema = SimplificationResultSchemaForType<
    SimplificationPlugin,
    JSONSchemaType
  >

  it('creates the expected type for general `Plugin` type', () => {
    expectTypeOf<GeneralSimplificationResultSchema>().toEqualTypeOf<
      | boolean
      | {
          const: unknown
        }
      | {
          [x: string]: unknown
          type: JSONSchemaType
          allOf?: JSONSchema[]
          const?: never
          anyOf?: never
          not?: never
        }
    >()
  })

  it('creates the expected filtered merged type', () => {
    type MergedNumberResultSchema = SimplificationResultSchemaForType<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin,
      'number'
    >

    expectTypeOf<boolean>().toMatchTypeOf<MergedNumberResultSchema>()

    expectTypeOf<{ const: unknown }>().toMatchTypeOf<MergedNumberResultSchema>()

    expectTypeOf<{
      type: 'number'
      minimum?: number | string
      maximum?: number
      multipleOf?: number | string
      fantasyProp1?: string
      fantasyProp2?: number
      fantasyProp3?: boolean
      allOf: (
        | { not: { multipleOf: number } }
        | { not: { const: number } }
        | { minimum: number }
      )[]
    }>().toMatchTypeOf<MergedNumberResultSchema>()

    type ExpectedType =
      | boolean
      | {
          const: unknown
        }
      | {
          type: 'number'
          minimum?: number | string
          maximum?: number
          multipleOf?: number | string
          fantasyProp1?: string
          fantasyProp2?: number
          fantasyProp3?: boolean
          allOf?: (
            | { not: { multipleOf: number } }
            | { not: { const: number } }
            | { minimum: number }
          )[]
          const?: never
          anyOf?: never
          not?: never
        }

    expectTypeOf<MergedNumberResultSchema>().toEqualTypeOf<ExpectedType>()

    expectTypeOf<object>().not.toMatchTypeOf<MergedNumberResultSchema>()

    expectTypeOf<MergedNumberResultSchema>().toMatchTypeOf<GeneralSimplificationResultSchema>()
  })

  it('creates the expected filtered merged type', () => {
    type Plugin =
      | typeof constSimplification
      | typeof numberSimplification
      | typeof stringSimplification
      | typeof objectSimplification
      | typeof arraySimplification
      | {
          readonly type: 'number'
          mergeableKeywords: 'fantasyKeyword'[]
          readonly simplify: () => {
            fantasyKeyword: number
          }
        }

    type MergedNumberResultSchema = SimplificationResultSchemaForType<
      Plugin,
      'number'
    >

    expectTypeOf<MergedNumberResultSchema>().toEqualTypeOf<
      | boolean
      | {
          const: unknown
        }
      | {
          type: 'number'
          minimum?: number
          maximum?: number
          multipleOf?: number
          fantasyKeyword?: number
          allOf?: (
            | {
                not: {
                  multipleOf: number
                }
              }
            | {
                not: {
                  const: number
                }
              }
          )[]
          const?: never
          anyOf?: never
          not?: never
        }
    >()

    expectTypeOf<MergedNumberResultSchema>().toMatchTypeOf<GeneralSimplificationResultSchema>()
  })
})

describe('SimplificationResultSchemaByType', () => {
  it('creates the expected merged type', () => {
    type MergedSimplificationResultSchema = SimplificationResultSchemaByType<
      | NumberSimplificationPlugin
      | FantasySimplificationPlugin
      | FantasySimplificationPlugin2
      | StringSimplificationPlugin
    >

    expectTypeOf<MergedSimplificationResultSchema>().toMatchTypeOf<
      ConjunctionSchema<NonConstConjunctionSchemaObject>
    >()

    expectTypeOf<MergedSimplificationResultSchema>().toEqualTypeOf<
      | boolean
      | {
          const: unknown
        }
      | {
          type: 'string'
          maxLength?: number
          minLength?: number
          fantasyProp1?: string
          fantasyProp2?: number
          allOf?: (
            | {
                pattern: string
              }
            | {
                not: {
                  pattern: string
                }
              }
          )[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'number'
          minimum?: string | number
          maximum?: number
          multipleOf?: string | number
          fantasyProp3?: boolean
          fantasyProp1?: string
          fantasyProp2?: number
          allOf?: (
            | {
                not: {
                  multipleOf: number
                }
              }
            | {
                not: {
                  const: number
                }
              }
            | {
                minimum: number
              }
          )[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'boolean'
          allOf?: never[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'object'
          allOf?: never[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'array'
          allOf?: never[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'null'
          allOf?: never[]
          const?: never
          anyOf?: never
          not?: never
        }
    >()

    type MergedResultConjunctionSchema = Exclude<
      MergedSimplificationResultSchema,
      boolean | { const: unknown }
    >
    type MergedResultConjunctionSchemaType =
      MergedResultConjunctionSchema['type']
    expectTypeOf<MergedResultConjunctionSchemaType>().toEqualTypeOf<
      'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
    >()
  })

  it('creates the expected merged type', () => {
    type Plugin =
      | typeof constSimplification
      | typeof numberSimplification
      | typeof stringSimplification
      | typeof objectSimplification
      | typeof arraySimplification
      | {
          readonly appliesToJSONSchemaType: 'number'
          mergeableKeywords: 'fantasyKeyword'[]
          readonly simplify: () => {
            fantasyKeyword: number
          }
        }

    type MergedSimplificationResultSchema =
      SimplificationResultSchemaByType<Plugin>

    expectTypeOf<MergedSimplificationResultSchema>().toEqualTypeOf<
      | SimplificationResultSchemaForType<Plugin, 'null'>
      | SimplificationResultSchemaForType<Plugin, 'number'>
      | SimplificationResultSchemaForType<Plugin, 'string'>
      | SimplificationResultSchemaForType<Plugin, 'boolean'>
      | SimplificationResultSchemaForType<Plugin, 'array'>
      | SimplificationResultSchemaForType<Plugin, 'object'>
    >()

    expectTypeOf<MergedSimplificationResultSchema>().toEqualTypeOf<
      | boolean
      | {
          const: unknown
        }
      | {
          type: 'string'
          maxLength?: number
          minLength?: number
          allOf?: (
            | { not: { const: string } }
            | { pattern: string }
            | { not: { pattern: string } }
          )[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'number'
          minimum?: number
          maximum?: number
          multipleOf?: number
          fantasyKeyword?: number
          allOf?: (
            | { not: { multipleOf: number } }
            | { not: { const: number } }
          )[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'boolean'
          allOf?: never[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'array'
          items?: JSONSchema
          maxItems?: number
          minItems?: number
          prefixItems?: JSONSchema[]
          uniqueItems?: boolean
          allOf?: (
            | { not: { const: unknown[] } }
            | {
                contains: JSONSchema
                minContains?: number
                maxContains?: number
              }
            | {
                not: {
                  uniqueItems?: boolean
                }
              }
            | {
                not: {
                  prefixItems?: true[]
                  items?: JSONSchema
                }
              }
          )[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'object'
          maxProperties?: number
          minProperties?: number
          patternProperties?: Record<string, JSONSchema>
          properties?: Record<string, JSONSchema>
          propertyNames?: JSONSchema
          required?: string[]
          allOf?: (
            | { not: { const: Record<string, unknown> } }
            | AdditionalPropertiesAtomicSchemaJSON
            | {
                not: PatternPropertiesAtomicSchemaJSON
              }
            | { not: AdditionalPropertiesAtomicSchemaJSON }
            | { not: { propertyNames: JSONSchema } }
          )[]
          const?: never
          anyOf?: never
          not?: never
        }
      | {
          type: 'null'
          allOf?: never[]
          const?: never
          anyOf?: never
          not?: never
        }
    >()
  })
})
