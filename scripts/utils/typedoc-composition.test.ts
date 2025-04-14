import { describe, it, expect } from 'vitest'

import endent_ from 'endent'

import { fromMarkdown, toMarkdown } from '../utils/mdast-utils.js'

import { extractDescriptionForPackageJSON } from './typedoc-composition.js'

// workaround (https://github.com/microsoft/TypeScript/issues/50058#issuecomment-1297806160)
const endent = endent_ as unknown as typeof endent_.default

describe(extractDescriptionForPackageJSON, () => {
  it('extracts the correct description without altering the original', () => {
    const mdText = endent`
      abc
      
      def
      
      <!-- package-json-description-start -->
      ghi
      
      jkl [link text](url)
      <!-- package-json-description-end -->
      
      mno
    `

    const root = fromMarkdown(mdText)

    expect(extractDescriptionForPackageJSON(root)).toMatchInlineSnapshot(
      `"ghi jkl link text"`,
    )

    expect(toMarkdown(root)).toMatchInlineSnapshot(`
      "abc

      def

      <!-- package-json-description-start -->

      ghi

      jkl [link text](url)

      <!-- package-json-description-end -->

      mno
      "
    `)
  })
})
