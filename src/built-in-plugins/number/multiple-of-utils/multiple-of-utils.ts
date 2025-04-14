import uniq from 'lodash/uniq.js'
import { multipleOfEpsilon } from '../../../validate/index.js'

/** Returns whether the given value is (almost) zero. */
export function isCloseToZero(value: number): boolean {
  return Math.abs(value) < multipleOfEpsilon
}

/**
 * Returns the (rounded) value if it is (almost) an integer. Otherwise returns
 * `null`.
 */
export function assertInteger(value: number): number | null {
  const rounded = Math.round(value)
  return isCloseToZero(rounded - value) ? rounded : null
}

export function isInteger(value: number): boolean {
  return assertInteger(value) !== null
}

export function floor(value: number): number {
  return assertInteger(value) ?? Math.floor(value)
}

export function ceil(value: number): number {
  return assertInteger(value) ?? Math.ceil(value)
}

/**
 * Finds the greatest common divisor using the Euclidean algorithm
 *
 * @param a A non negative finite integer
 * @param b Another non negative finite integer
 * @returns The greatest common divisor of a and b
 */
export function gcd(a: number, b: number): number {
  /* checking against a large epsilon is sufficient, because the arguments are
   * supposed to be integers anyway */
  if (b < 0.1) {
    return a
  }

  /* Use `Math.round` to prevent rounding errors introduced by `%` */
  return gcd(b, Math.round(a % b))
}

/**
 * Finds the least common multiple
 *
 * @param a A non negative integer
 * @param b Another non negative integer
 * @returns The least common multiple of a and b
 */
export function lcm(a: number, b: number): number {
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return NaN
  }
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return Infinity
  }

  /* checking against a large epsilon is sufficient, because the arguments are
   * supposed to be integers anyway */
  if (a < 0.1 || b < 0.1) {
    return 0
  }
  return Math.round((a * b) / gcd(Math.round(a), Math.round(b)))
}

/**
 * @param a A non negative real number
 * @param b Another non negative real number
 * @returns The non negative least common multiple of a and b
 */
export function nonNegativeRealLCM(a: number, b: number): number {
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return NaN
  }
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return Infinity
  }

  if (isInteger(a) && isInteger(b)) {
    return lcm(a, b)
  }

  return nonNegativeRealLCM(a * 10, b * 10) / 10
}

/**
 * @param a A real number
 * @param b Another real number
 * @returns The non negative least common multiple of a and b
 */
export function realLCM(a: number, b: number): number {
  return nonNegativeRealLCM(Math.abs(a), Math.abs(b))
}

export function multiRealLCM(...values: number[]): number | undefined {
  const [valueA, valueB, ...restValues] = values
  if (valueA === undefined) {
    return undefined
  }
  if (valueB === undefined) {
    return valueA
  }

  return multiRealLCM(realLCM(valueA, valueB), ...restValues)
}

export function isValidMultiple(
  multipleOf: number,
  minimum: number = -Infinity,
  maximum: number = Infinity,
) {
  return function (value: unknown): value is number {
    if (typeof value !== 'number') {
      return false
    }

    if (value < minimum || value > maximum) {
      return false
    }

    if (multipleOf === 0) {
      return value === 0
    }

    return isInteger(value / multipleOf)
  }
}

/**
 * Finds the cardinality of
 *
 * ```
 * { x |
 *   x ≥ `minimum` AND
 *   x ≤ `maximum` AND
 *   x is multiple of `multipleOf`
 * }
 * ```
 */
export function findMultipleOfCardinality(
  multipleOf: number,
  minimum: number,
  maximum: number,
): { cardinality: number; singleElement?: number | undefined } {
  if (multipleOf === 0) {
    if (minimum <= 0 && maximum >= 0) {
      return { cardinality: 1, singleElement: 0 }
    } else {
      return { cardinality: 0 }
    }
  }

  const absMultipleOf = Math.abs(multipleOf)

  const minFactor = ceil(minimum / absMultipleOf)
  const maxFactor = floor(maximum / absMultipleOf)

  const cardinality = Math.max(0, maxFactor - minFactor + 1)

  if (cardinality === 1) {
    return { cardinality, singleElement: minFactor * absMultipleOf }
  }

  return { cardinality }
}

/**
 * Finds the cardinality of
 *
 * ```
 * { x |
 *   x ≥ minimum AND
 *   x ≤ maximum AND
 *   (
 *     x is multiple of one of the values in multipleUnionOf OR
 *     x is one of the values in constUnion
 *   )
 * }
 * ```
 */
export function findMultipleOfUnionCardinality(
  minimum: number,
  maximum: number,
  multipleOfUnion: number[],
  constUnion: number[],
): number {
  const [multipleOf, ...otherMultipleOfs] = multipleOfUnion
  if (multipleOf === undefined) {
    return uniq(constUnion).filter(
      (constValue) => constValue >= minimum && constValue <= maximum,
    ).length
  }

  // recursively apply |A ∪ B| = |A| + |B| - |A ∩ B|
  return (
    findMultipleOfCardinality(multipleOf, minimum, maximum).cardinality +
    findMultipleOfUnionCardinality(
      minimum,
      maximum,
      otherMultipleOfs,
      constUnion,
    ) -
    findMultipleOfUnionCardinality(
      minimum,
      maximum,
      otherMultipleOfs.map((otherMultipleOf) =>
        realLCM(otherMultipleOf, multipleOf),
      ),
      constUnion.filter(isValidMultiple(multipleOf, minimum, maximum)),
    )
  )
}
