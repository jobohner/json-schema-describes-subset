import isObject from 'lodash/isObject.js'
import includes from 'lodash/includes.js'

export function isNotNull<Type>(value: Type): value is Exclude<Type, null> {
  return value !== null
}

export function isNonNullable<Type>(value: Type): value is NonNullable<Type> {
  return value != null
}

export function isArrayOf<ElementType>(
  isElementType: (element: unknown) => element is ElementType,
) {
  return function (value: unknown): value is ElementType[] {
    if (!Array.isArray(value)) return false

    return value.every(isElementType)
  }
}

export function isNonArrayObject(
  value: unknown,
): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value)
}

export function isRecordOf<ValueType>(
  isValueType: (value: unknown) => value is ValueType,
) {
  return function (value: unknown): value is Record<string, ValueType> {
    if (!isNonArrayObject(value)) return false

    return Object.values(value).every(isValueType)
  }
}

export function isStringWithPrefix<const Prefix extends string>(
  prefix: Prefix,
) {
  return function (string: unknown): string is `${Prefix}${string}` {
    return typeof string === 'string' && string.startsWith(prefix)
  }
}

export function isOneOf<const Type = never>(elements: readonly Type[]) {
  return function (value: unknown): value is Type {
    return includes(elements, value)
  }
}

/**
 * Allows convenient narrowing on nullish or falsy values.
 *
 * @example
 *
 * ```typescript
 * function testA(value: number | undefined | null): number {
 *   return numberValue ?? throwError() // asserts this is not undefined or null
 * }
 * ```
 *
 * ```typescript
 * function testB(value: number[] | false): number[] {
 *   return numberValue || throwError() // asserts this is not false
 * }
 * ```
 */
export function throwError(error?: Error | string | undefined): never {
  throw error instanceof Error ? error : new Error(error)
}

export function assertType<Type>(
  test: (value: unknown) => value is Type,
  error?: Error | string | ((value: unknown) => Error) | undefined,
) {
  return function (value: unknown): Type {
    if (!test(value)) {
      if (
        error instanceof Error ||
        typeof error === 'string' ||
        error === undefined
      ) {
        throwError(error)
      }

      throwError(error(value))
    }
    return value
  }
}
