import { describe, it, expect } from 'vitest'

import { wrapCodeBlock, wrapBackTicks } from './markdown-utils.js'

describe(wrapCodeBlock, () => {
  it('returns the expected result', () => {
    expect(wrapCodeBlock('abc')).toMatchInlineSnapshot(`
      "\`\`\`
      abc
      \`\`\`"
    `)

    expect(
      wrapCodeBlock(
        `
          console.log({
            a: 5
          })
        `,
        'ts',
      ),
    ).toMatchInlineSnapshot(`
      "\`\`\`ts

                console.log({
                  a: 5
                })
      \`\`\`"
    `)
  })
})

describe(wrapBackTicks, () => {
  it('returns the expected result', () => {
    expect(wrapBackTicks('abc')).toMatchInlineSnapshot(`"\`abc\`"`)
  })
})
