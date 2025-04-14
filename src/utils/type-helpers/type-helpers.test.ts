import type isString from 'lodash/isString.js'

import { describe, it, expectTypeOf, expect } from 'vitest'

import type {
  TupleIndices,
  StringToNumber,
  ReadonlyDeep,
  RequiredKey,
  OptionalKey,
  FilteredTuple,
  RequiredDefined,
  RequiredDefinedDeep,
  UnknownProperties,
  Prettify,
  ObjectUnionKey,
  PredicateIsType,
} from './type-helpers.js'
import { mapTuple } from './type-helpers.js'

describe('ObjectUnionKey', () => {
  it('accepts any key of the union', () => {
    expectTypeOf<
      ObjectUnionKey<{ a: number } | { b: string } | Record<'b' | 'c', boolean>>
    >().toEqualTypeOf<'a' | 'b' | 'c'>()
  })
})

describe('RequiredKey', () => {
  it('extracts the expected required keys', () => {
    expectTypeOf<
      RequiredKey<{
        a: number
        b: string
        c?: boolean
        d: number | undefined
        e?: string | undefined
        // f?: never
      }>
    >().toEqualTypeOf<'a' | 'b' | 'd'>()
    expectTypeOf<
      RequiredKey<
        Partial<{
          a: number
          b: string
          c?: boolean
          d: number | undefined
          e?: string | undefined
          // f?: never
        }>
      >
    >().toEqualTypeOf<never>()
    expectTypeOf<
      RequiredKey<
        Required<{
          a: number
          b: string
          c?: boolean
          d: number | undefined
          e?: string | undefined
          // f?: never
        }>
      >
    >().toEqualTypeOf<'a' | 'b' | 'c' | 'd' | 'e'>()

    expectTypeOf<RequiredKey<Record<string, never>>>().toEqualTypeOf<never>()
    expectTypeOf<
      RequiredKey<Partial<Record<string, never>>>
    >().toEqualTypeOf<never>()
    expectTypeOf<RequiredKey<Record<string, number>>>().toEqualTypeOf<never>()
    expectTypeOf<
      RequiredKey<Partial<Record<string, number>>>
    >().toEqualTypeOf<never>()
    expectTypeOf<RequiredKey<Record<never, never>>>().toEqualTypeOf<never>()
    expectTypeOf<RequiredKey<object>>().toEqualTypeOf<never>()
  })
})

describe('OptionalKey', () => {
  it('extracts the expected required keys', () => {
    expectTypeOf<
      OptionalKey<{
        a: number
        b: string
        c?: boolean
        d: number | undefined
        e?: string | undefined
        // f?: never
      }>
    >().toEqualTypeOf<'c' | 'e'>()
    expectTypeOf<
      OptionalKey<
        Partial<{
          a: number
          b: string
          c?: boolean
          d: number | undefined
          e?: string | undefined
          // f?: never
        }>
      >
    >().toEqualTypeOf<'a' | 'b' | 'c' | 'd' | 'e'>()
    expectTypeOf<
      OptionalKey<
        Required<{
          a: number
          b: string
          c?: boolean
          d: number | undefined
          e?: string | undefined
          // f?: never
        }>
      >
    >().toEqualTypeOf<never>()

    expectTypeOf<OptionalKey<Record<string, never>>>().toEqualTypeOf<string>()
    expectTypeOf<
      OptionalKey<Partial<Record<string, never>>>
    >().toEqualTypeOf<string>()
    expectTypeOf<
      OptionalKey<Partial<Record<string, number>>>
    >().toEqualTypeOf<string>()
    expectTypeOf<OptionalKey<Record<string, number>>>().toEqualTypeOf<string>()
    expectTypeOf<OptionalKey<Record<never, never>>>().toEqualTypeOf<never>()
    expectTypeOf<OptionalKey<object>>().toEqualTypeOf<never>()
  })
})

describe('ReadonlyDeep', () => {
  it('creates the expected type', () => {
    const testObject = { a: [5, { b: 'test-string-b' }] } as const
    type expectedType = ReadonlyDeep<{ a: [5, { b: 'test-string-b' }] }>

    expectTypeOf(testObject).toEqualTypeOf<expectedType>()
  })

  it('creates the expected type', () => {
    interface TypeA {
      a?:
        | {
            a?: number | undefined
            b?: string | undefined
          }
        | undefined
    }
    const a: TypeA = {}
    expectTypeOf(a.a?.a).toEqualTypeOf<number | undefined>()

    type ReadonlyTypeA = ReadonlyDeep<TypeA>
    const readonlyA: ReadonlyTypeA = {}
    expectTypeOf(readonlyA.a?.a).toEqualTypeOf<number | undefined>()
  })

  it('works with functions', () => {
    interface TypeA {
      a: (a: boolean) => {
        a?: number | undefined
        b?: string | undefined
      }
    }
    type ReadonlyTypeA = ReadonlyDeep<TypeA>
    interface ExpectedReadonlyTypeA {
      readonly a: (a: boolean) => {
        a?: number | undefined
        b?: string | undefined
      }
    }
    expectTypeOf<ReadonlyTypeA>().toMatchTypeOf<ExpectedReadonlyTypeA>()
    expectTypeOf<ExpectedReadonlyTypeA>().toMatchTypeOf<ReadonlyTypeA>()

    interface TypeB {
      (a: boolean): {
        a?: number | undefined
        b?: string | undefined
      }
      b?: number | undefined
      c?: string | undefined
    }
    expectTypeOf<Parameters<TypeB>>().toEqualTypeOf<[boolean]>()
    expectTypeOf<ReturnType<TypeB>>().toEqualTypeOf<{
      a?: number | undefined
      b?: string | undefined
    }>()

    type ReadonlyTypeB = ReadonlyDeep<TypeB>
    interface ExpectedReadonlyTypeB {
      (a: boolean): {
        a?: number | undefined
        b?: string | undefined
      }
      readonly b?: number | undefined
      readonly c?: string | undefined
    }
    const testB: ReadonlyTypeB = () => ({})
    const testResultB = testB(true)
    expectTypeOf(testResultB).toEqualTypeOf<{
      a?: number | undefined
      b?: string | undefined
    }>()

    // @ts-expect-error readonly property b
    testB.b = 5
    type ReadonlyTypeB_b = ReadonlyTypeB['b']
    expectTypeOf<ReadonlyTypeB_b>().toEqualTypeOf<number | undefined>()

    // @ts-expect-error readonly property c
    testB.c = '5'
    type ReadonlyTypeB_c = ReadonlyTypeB['c']
    expectTypeOf<ReadonlyTypeB_c>().toEqualTypeOf<string | undefined>()

    expectTypeOf<ReadonlyTypeB>().toMatchTypeOf<ExpectedReadonlyTypeB>()
    expectTypeOf<ExpectedReadonlyTypeB>().toMatchTypeOf<ReadonlyTypeB>()

    interface TypeC {
      a: {
        (a: boolean): {
          a?: number | undefined
          b?: string | undefined
        }
        b?: number | undefined
        c?: string | undefined
        d: { a?: number | string | undefined }
      }
    }

    type ReadonlyTypeC = ReadonlyDeep<TypeC>
    interface ExpectedReadonlyTypeC {
      readonly a: {
        (a: boolean): {
          a?: number | undefined
          b?: string | undefined
        }
        readonly b?: number | undefined
        readonly c?: string | undefined
        readonly d: { readonly a?: number | string | undefined }
      }
    }
    expectTypeOf<ReadonlyTypeC>().toMatchTypeOf<ExpectedReadonlyTypeC>()
    expectTypeOf<ExpectedReadonlyTypeC>().toMatchTypeOf<ReadonlyTypeC>()

    const testC: ReadonlyTypeC = { a: () => ({}) } as unknown as ReadonlyTypeC
    const testResultC = testC.a(true)
    expectTypeOf(testResultC).toEqualTypeOf<{
      a?: number | undefined
      b?: string | undefined
    }>()

    // @ts-expect-error readonly property b
    testC.a.b = 5
    expectTypeOf(testC.a.b).toEqualTypeOf<number>()
    expectTypeOf<ReadonlyTypeC['a']['b']>().toEqualTypeOf<number | undefined>()

    // @ts-expect-error readonly property d
    testC.a.d = {}
    expectTypeOf(testC.a.d).toEqualTypeOf<ExpectedReadonlyTypeC['a']['d']>()

    // @ts-expect-error readonly property a
    testC.a.d.a = 5
    expectTypeOf(testC.a.d.a).toEqualTypeOf<number>()
    expectTypeOf<ReadonlyTypeC['a']['d']['a']>().toEqualTypeOf<
      number | string | undefined
    >()
  })
})

describe('StringToNumber', () => {
  it('creates the expected numeric type', () => {
    expectTypeOf<StringToNumber<'5'>>().toEqualTypeOf<5>()
    expectTypeOf<StringToNumber<5>>().toEqualTypeOf<never>()
    expectTypeOf<StringToNumber<0 | 1 | '2' | '3' | 4 | '5'>>().toEqualTypeOf<
      2 | 3 | 5
    >()
    expectTypeOf<StringToNumber<number>>().toEqualTypeOf<never>()
    expectTypeOf<StringToNumber<string>>().toEqualTypeOf<never>()
    expectTypeOf<
      StringToNumber<'invalid' | 1 | '2' | 3 | 4 | '5'>
    >().toEqualTypeOf<2 | 5>()
    expectTypeOf<StringToNumber<'invalid'>>().toEqualTypeOf<never>()
  })
})

describe('TupleIndices', () => {
  it('creates the expected numeric literal union type', () => {
    expectTypeOf<TupleIndices<[]>>().toEqualTypeOf<never>()
    expectTypeOf<TupleIndices<[[], [], []]>>().toEqualTypeOf<0 | 1 | 2>()
  })
})

describe('FilteredTuple', () => {
  it('creates the expected type', () => {
    expectTypeOf<FilteredTuple<[], number>>().toEqualTypeOf<[]>()
    expectTypeOf<FilteredTuple<[1, 2, 3], number>>().toEqualTypeOf<[1, 2, 3]>()
    expectTypeOf<FilteredTuple<[1, '2', 3, '4'], number>>().toEqualTypeOf<
      [1, 3]
    >()
  })
})

describe(mapTuple, () => {
  it('returns the expected mapped tuple', () => {
    const resultA = mapTuple([1, 2, 3], (value) => value + 1)
    expect(resultA).toEqual([2, 3, 4])
    expectTypeOf(resultA).toEqualTypeOf<readonly [number, number, number]>()

    const resultB = mapTuple([1, 2, 3], String)
    expect(resultB).toEqual(['1', '2', '3'])
    expectTypeOf(resultB).toEqualTypeOf<readonly [string, string, string]>()

    const resultC = mapTuple([1, '2', 3], String)
    expect(resultC).toEqual(['1', '2', '3'])
    expectTypeOf(resultC).toEqualTypeOf<readonly [string, string, string]>()

    // const resultD = mapTuple([1, '2', 3], (value) => value)
    // expect(resultD).toEqual([1, '2', 3])
    // expectTypeOf(resultD).toEqualTypeOf<[1, '2', 3]>()
  })
})

describe('RequiredDefined', () => {
  it('creates the expected type', () => {
    expectTypeOf<
      RequiredDefined<{
        a?: number | undefined
        b?: number
        c: number | undefined
        d: number
        e?:
          | {
              a?: number | undefined
              b?: number
              c: number | undefined
              d: number
            }
          | undefined
      }>
    >().toEqualTypeOf<{
      a: number
      b: number
      c: number
      d: number
      e: {
        a?: number | undefined
        b?: number
        c: number | undefined
        d: number
      }
    }>()
  })
})

describe('RequiredDefinedDeep', () => {
  it('creates the expected type', () => {
    expectTypeOf<
      RequiredDefinedDeep<{
        a?: number | undefined
        b?: number
        c: number | undefined
        d: number
        e?:
          | {
              a?: number | undefined
              b?: number
              c: number | undefined
              d: number
            }
          | undefined
      }>
    >().toEqualTypeOf<{
      a: number
      b: number
      c: number
      d: number
      e: {
        a: number
        b: number
        c: number
        d: number
      }
    }>()
  })
})

describe('UnknownProperties', () => {
  it('returns the expected type', () => {
    expectTypeOf<
      Prettify<
        UnknownProperties<{
          a: number
          b?: string
          c: boolean | undefined
        }>
      >
    >().toEqualTypeOf<{
      a: unknown
      b?: unknown
      c: unknown
      [x: string]: unknown
    }>()
  })
})

// describe(objectFromEntries, () => {
//   it('returns the expected type', () => {
//     const resultA = objectFromEntries([
//       ['a', 1],
//       ['b', 2],
//       ['c', 3],
//     ])
//     expect(resultA).toEqual({ a: 1, b: 2, c: 3 })
//     expectTypeOf(resultA).toEqualTypeOf<{ a?: 1; b?: 2; c?: 3 }>()

//     const resultB = objectFromEntries([
//       ['a', '1'],
//       ['b', '2'],
//       ['c', '3'],
//     ])
//     expect(resultB).toEqual({ a: '1', b: '2', c: '3' })
//     expectTypeOf(resultB).toEqualTypeOf<{ a?: '1'; b?: '2'; c?: '3' }>()

//     const resultC = objectFromEntries([
//       ['a', 1],
//       ['b', '2'],
//       ['c', '3'],
//     ])
//     expect(resultC).toEqual({ a: 1, b: '2', c: '3' })
//     expectTypeOf(resultC).toEqualTypeOf<{ a?: 1; b?: '2'; c?: '3' }>()

//     const resultD = objectFromEntries<['a', 1] | ['b', '2'] | ['c', '3']>([
//       ['a', 1],
//       ['b', '2'],
//     ])
//     expect(resultD).toEqual({ a: 1, b: '2' })
//     expectTypeOf(resultD).toEqualTypeOf<{ a?: 1; b?: '2'; c?: '3' }>()

//     const resultE = objectFromEntries([
//       ['a', 1],
//       ['b', '2'],
//       ['c', '3'],
//       ['a', 4],
//     ])
//     expect(resultE).toEqual({ a: 4, b: '2', c: '3' })
//     expectTypeOf(resultE).toEqualTypeOf<{ a?: 1 | 4; b?: '2'; c?: '3' }>()

//     const resultF = objectFromEntries<['a' | 'b', 1 | 2] | ['c', 3]>([
//       ['a', 1],
//       ['b', 2],
//       ['c', 3],
//     ])
//     expect(resultF).toEqual({ a: 1, b: 2, c: 3 })
//     expectTypeOf(resultF).toEqualTypeOf<{ a?: 1 | 2; b?: 1 | 2; c?: 3 }>()

//     const resultG = objectFromEntries<['a' | 'b', number] | ['c', boolean]>([
//       ['a', 1],
//       ['b', 2],
//       ['c', true],
//     ])
//     expect(resultG).toEqual({ a: 1, b: 2, c: true })
//     expectTypeOf(resultG).toEqualTypeOf<{
//       a?: number
//       b?: number
//       c?: boolean
//     }>()

//     const resultH = objectFromEntries<[string, number] | ['c', boolean]>([
//       ['a', 1],
//       ['b', 2],
//       ['c', true],
//     ])
//     expect(resultH).toEqual({ a: 1, b: 2, c: true })
//     expectTypeOf(resultH).toEqualTypeOf<{ a?: 1 | 2; b?: 1 | 2; c?: 3 }>()
//   })
// })

describe('PredicateIsType', () => {
  it('creates the expected type', () => {
    expectTypeOf<PredicateIsType<typeof isString>>().toEqualTypeOf<string>()
  })
})
