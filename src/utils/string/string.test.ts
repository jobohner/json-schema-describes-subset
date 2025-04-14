import { describe, it, expect } from 'vitest'

import {
  splitToLines,
  mapLines,
  makeWhitespacesPlain,
  removePrefix,
} from './string.js'

describe(splitToLines, () => {
  it('returns the expected lines', () => {
    expect(splitToLines('')).toMatchInlineSnapshot(`
      [
        "",
      ]
    `)

    expect(splitToLines('abc')).toMatchInlineSnapshot(`
      [
        "abc",
      ]
    `)

    expect(splitToLines('abc\ndef ghi  \n  jkl \n')).toMatchInlineSnapshot(`
      [
        "abc",
        "def ghi  ",
        "  jkl ",
        "",
      ]
    `)
  })

  it('works with `\\r\\n`', () => {
    const text = 'abc\r\ndef ghi  \r\n  jkl \r\n'

    expect(text).toMatchInlineSnapshot(`
      "abc
      def ghi  
        jkl 
      "
    `)

    expect(splitToLines(text)).toMatchInlineSnapshot(`
      [
        "abc",
        "def ghi  ",
        "  jkl ",
        "",
      ]
    `)
  })

  it('works with `\\r`', () => {
    const text = 'abc\rdef ghi  \r  jkl \r'

    expect(text).toMatchInlineSnapshot(`
      "abc
      def ghi  
        jkl 
      "
    `)

    expect(splitToLines(text)).toMatchInlineSnapshot(`
      [
        "abc",
        "def ghi  ",
        "  jkl ",
        "",
      ]
    `)
  })

  it('works with different line breaks', () => {
    const text = 'abc\r\ndef ghi  \n\r  jkl \r\n\rmn  '

    expect(text).toMatchInlineSnapshot(`
      "abc
      def ghi  

        jkl 

      mn  "
    `)

    expect(splitToLines(text)).toMatchInlineSnapshot(`
      [
        "abc",
        "def ghi  ",
        "",
        "  jkl ",
        "",
        "mn  ",
      ]
    `)
  })
})

describe(mapLines, () => {
  it('returns the expected text', () => {
    expect(
      mapLines(['line a', ' line b', '  '].join('\n'), (line) =>
        line.trim().length === 0 ? line : `🦄 ${line}`,
      ),
    ).toMatchInlineSnapshot(`
      "🦄 line a
      🦄  line b
        "
    `)
  })
})

describe(makeWhitespacesPlain, () => {
  it('returns the expected result', () => {
    expect(
      makeWhitespacesPlain(`
        test
        
        content   
        x y   	z
        
        a  b  c
        
        
        `),
    ).toMatchInlineSnapshot(`" test content x y z a b c "`)
  })
})

describe(removePrefix, () => {
  it('returns the expected result', () => {
    expect(removePrefix('testabc', 'test')).toMatchInlineSnapshot(`"abc"`)
  })

  it('returns the expected result', () => {
    expect(removePrefix('testabc', 'abc')).toMatchInlineSnapshot(`null`)
  })

  it('returns the expected result', () => {
    expect(removePrefix('__abc', '__', 1)).toMatchInlineSnapshot(`"bc"`)
  })

  it('returns the expected result', () => {
    expect(removePrefix('__abc', '__', -1)).toMatchInlineSnapshot(`"_abc"`)
  })
})
