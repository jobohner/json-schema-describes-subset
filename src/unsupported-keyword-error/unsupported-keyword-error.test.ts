import { describe, it, expect } from 'vitest'
import { UnsupportedKeywordError } from './unsupported-keyword-error.js'

describe(UnsupportedKeywordError, () => {
  it('has the expected message', () => {
    expect(() => {
      throw new UnsupportedKeywordError('abc', 'def')
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'abc' with value 'def'. This currently cannot be transformed to a dnf.]`,
    )

    expect(() => {
      throw new UnsupportedKeywordError('abc')
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'abc'. This currently cannot be transformed to a dnf.]`,
    )

    expect(() => {
      throw new UnsupportedKeywordError('abc', undefined)
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported keyword 'abc'. This currently cannot be transformed to a dnf.]`,
    )
  })
})
