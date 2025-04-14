import { describe, it, expect } from 'vitest'

import {
  getFragmentFromRegExpExecArray,
  createAnchorFragmentFromHeaderText,
} from './create-anchor-fragment-from-header-text.js'

describe(createAnchorFragmentFromHeaderText, () => {
  it('returns the expected fragment', () => {
    expect(createAnchorFragmentFromHeaderText('')).toMatchInlineSnapshot(`""`)

    expect(
      createAnchorFragmentFromHeaderText('Test ABC'),
    ).toMatchInlineSnapshot(`"test-abc"`)

    expect(
      createAnchorFragmentFromHeaderText('Test [ABC]'),
    ).toMatchInlineSnapshot(`"test-abc"`)

    expect(
      createAnchorFragmentFromHeaderText('Test (ABC)'),
    ).toMatchInlineSnapshot(`"test-abc"`)
  })
})

describe(getFragmentFromRegExpExecArray, () => {
  it('throws on null', () => {
    expect(() =>
      getFragmentFromRegExpExecArray(null, 'header text'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: couldn't create anchor fragment for 'header text']`,
    )
  })
})
