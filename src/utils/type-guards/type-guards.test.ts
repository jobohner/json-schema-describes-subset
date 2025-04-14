import isString from 'lodash/isString.js'

import { describe, it, expect, expectTypeOf } from 'vitest'

import {
  isOneOf,
  isNonArrayObject,
  isNonNullable,
  isNotNull,
  isRecordOf,
  isStringWithPrefix,
  throwError,
  assertType,
} from './type-guards.js'

describe(isNotNull, () => {
  it('returns the expected result', () => {
    expect(isNotNull(null)).toBe(false)
    expect(isNotNull(undefined)).toBe(true)
    expect(isNotNull(false)).toBe(true)
    expect(isNotNull(0)).toBe(true)
    expect(isNotNull('')).toBe(true)
    expect(isNotNull([])).toBe(true)
    expect(isNotNull({})).toBe(true)
  })
})

describe(isNonNullable, () => {
  it('returns the expected result', () => {
    expect(isNonNullable(null)).toBe(false)
    expect(isNonNullable(undefined)).toBe(false)
    expect(isNonNullable(false)).toBe(true)
    expect(isNonNullable(0)).toBe(true)
    expect(isNonNullable('')).toBe(true)
    expect(isNonNullable([])).toBe(true)
    expect(isNonNullable({})).toBe(true)
  })
})

describe(isNonArrayObject, () => {
  it('returns the expected result', () => {
    expect(isNonArrayObject({})).toBe(true)
    expect(isNonArrayObject({ a: 1, b: 2 })).toBe(true)

    expect(isNonArrayObject([])).toBe(false)
    expect(isNonArrayObject([{}])).toBe(false)
    expect(isNonArrayObject([1, 2, 3])).toBe(false)

    expect(isNonArrayObject(true)).toBe(false)
    expect(isNonArrayObject(null)).toBe(false)
    expect(isNonArrayObject(undefined)).toBe(false)
    expect(isNonArrayObject(false)).toBe(false)
    expect(isNonArrayObject(0)).toBe(false)
    expect(isNonArrayObject('')).toBe(false)
  })
})

describe(isRecordOf, () => {
  it('returns the expected result', () => {
    const isRecordOfString = isRecordOf(isString)
    expect(isRecordOfString({})).toBe(true)
    expect(isRecordOfString({ a: 'a' })).toBe(true)
    expect(isRecordOfString({ a: 5 })).toBe(false)
    expect(isRecordOfString({ a: 'a', [Symbol('b')]: 3 })).toBe(true)
    expectTypeOf({ a: 'a', [Symbol('b')]: 'b' }).toMatchTypeOf<
      Record<string, string>
    >()
    expectTypeOf({ a: 'a', [Symbol('b')]: 5 }).toMatchTypeOf<
      Record<string, string>
    >()
  })

  it('works with classes', () => {
    const isRecordOfString = isRecordOf(isString)

    class A {
      constructor(public x: string = 'x') {}
    }
    const a: Record<'x', string> = new A()
    expectTypeOf(a).toMatchTypeOf<Record<string, string>>()
    expect(isRecordOfString(new A())).toBe(true)
  })

  it('works with class inheritance', () => {
    const isRecordOfString = isRecordOf(isString)

    class A {
      constructor(public x: number = 0) {}
    }
    expect(isRecordOfString(new A())).toBe(false)

    class B extends A {
      constructor(public y: string = 'y') {
        super()
      }
    }
    expect(isRecordOfString(new B())).toBe(false)
  })

  it('works with class inheritance', () => {
    const isRecordOfString = isRecordOf(isString)

    class A {
      constructor(public x: string = 'x') {}
    }
    expect(isRecordOfString(new A())).toBe(true)

    class B extends A {
      constructor(public y: string = 'y') {
        super()
      }
    }
    expect(isRecordOfString(new B())).toBe(true)
  })

  it('returns the expected result with arrays', () => {
    const isRecordOfString = isRecordOf(isString)

    expect(isRecordOfString([])).toBe(false)
    expectTypeOf([]).not.toMatchTypeOf<Record<string, string>>()
  })
})

describe(isStringWithPrefix, () => {
  it('returns the expected result', () => {
    expect(isStringWithPrefix('$')(null)).toBe(false)
    expect(isStringWithPrefix('$')('abc')).toBe(false)
    expect(isStringWithPrefix('$')('$abc')).toBe(true)

    const testString: unknown = '$abc'
    if (isStringWithPrefix('$')(testString)) {
      expectTypeOf(testString).toEqualTypeOf<`$${string}`>()
    }
    if (isStringWithPrefix<`$${string}$`>('$$')(testString)) {
      expectTypeOf(testString).toEqualTypeOf<`$${string}$${string}`>()
    }
  })
})

describe(isOneOf, () => {
  it('returns the expected result', () => {
    expect(isOneOf([1, 2, 3])(2)).toBe(true)
    expect(isOneOf([1, 2, 3])(4)).toBe(false)

    const testValue: unknown = null
    if (isOneOf([])(testValue)) {
      expectTypeOf(testValue).toEqualTypeOf<never>()
    }
    if (isOneOf([1, 2, 3])(testValue)) {
      expectTypeOf(testValue).toEqualTypeOf<1 | 2 | 3>()
    }
    if (isOneOf([1, 2, 3])(testValue)) {
      expectTypeOf(testValue).toEqualTypeOf<1 | 2 | 3>()
    }
  })
})

describe(throwError, () => {
  it('throws the expected error', () => {
    const nullExpression: unknown = null

    expect(
      () => nullExpression ?? throwError(),
    ).toThrowErrorMatchingInlineSnapshot(`[Error]`)

    expect(
      () => nullExpression ?? throwError('test abc'),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: test abc]`)

    expect(
      () => nullExpression ?? throwError(new Error('test def')),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: test def]`)
  })
})

describe(assertType, () => {
  it('returns the expected result or throws', () => {
    const assertString = assertType(isString)

    const stringResult = assertString('string')
    expect(stringResult).toMatchInlineSnapshot(`"string"`)
    expectTypeOf(stringResult).toEqualTypeOf<string>()

    expect(() => assertString(5)).toThrowErrorMatchingInlineSnapshot(`[Error]`)

    expect(() =>
      assertType(isString, 'test Error 1')(5),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: test Error 1]`)

    expect(() =>
      assertType(isString, new Error('test Error 2'))(5),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: test Error 2]`)

    expect(() =>
      assertType(
        isString,
        (value) => new Error(`\`${value}\` is not a string`),
      )(5),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: \`5\` is not a string]`)
  })
})
