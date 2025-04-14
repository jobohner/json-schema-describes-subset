/**
 * Returns the maximum when the given minimum is negated. The given minimum does
 * not need to be an integer, but the returned maximum will be and the set of
 * numbers the minimum/maximum applies to is expected to contain integers only.
 * Can be used to respective value for `maxLength`, `maxProperties` or
 * `maxItems` when negating `minLength`, `minProperties` or `minItems`.
 */
export function negateIntegerMinimum(minimum: number): number {
  return Math.ceil(minimum) - 1
}

/**
 * Returns the minimum when the given maximum is negated. The given maximum does
 * not need to be an integer, but the returned minimum will be and the set of
 * numbers the minimum/maximum applies to is expected to contain integers only.
 * Can be used to respective value for `minLength`, `minProperties` or
 * `minItems` when negating `maxLength`, `maxProperties` or `maxItems`.
 */
export function negateIntegerMaximum(maximum: number): number {
  return Math.floor(maximum) + 1
}
