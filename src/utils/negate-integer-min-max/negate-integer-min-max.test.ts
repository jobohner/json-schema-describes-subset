import { describe, it, expect } from 'vitest'

import {
  negateIntegerMinimum,
  negateIntegerMaximum,
} from './negate-integer-min-max.js'

describe(negateIntegerMinimum, () => {
  it('works with non integer', () => {
    expect(negateIntegerMinimum(0.8392)).toBe(0)
  })

  it('works with integers', () => {
    expect(negateIntegerMinimum(12)).toBe(11)
  })
})

describe(negateIntegerMaximum, () => {
  it('works with non integer', () => {
    expect(negateIntegerMaximum(0.8392)).toBe(1)
  })

  it('works with integers', () => {
    expect(negateIntegerMaximum(12)).toBe(13)
  })
})
