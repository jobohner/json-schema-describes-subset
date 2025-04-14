import { describe, it, expect } from 'vitest'

import { getPlainExtname } from './path.js'

describe(getPlainExtname, () => {
  it('returns the expected plain extension', () => {
    expect(getPlainExtname('a.b')).toMatchInlineSnapshot(`"b"`)

    expect(getPlainExtname('a.ts')).toMatchInlineSnapshot(`"ts"`)

    expect(getPlainExtname('a')).toMatchInlineSnapshot(`""`)
  })
})
