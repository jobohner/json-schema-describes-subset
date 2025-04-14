import { describe, it, expect } from 'vitest'

import {
  includeTagRegExp,
  replaceIncludeTagsWithReplacerCallback,
  getRegionMarkers,
  extractRegion,
} from './doc-comment-include.js'

describe('includeTagRegExp', () => {
  it('returns the expected match data', () => {
    expect(
      `
      test abc
          * {@include ./abc/def.md}
      `.match(includeTagRegExp),
    ).toMatchInlineSnapshot(`
      [
        "{@include ./abc/def.md}",
      ]
    `)

    expect(
      `
      test abc
          * {@include ./abc/def.md#region_name}
      `.match(includeTagRegExp),
    ).toMatchInlineSnapshot(`
      [
        "{@include ./abc/def.md#region_name}",
      ]
    `)

    expect(
      `
        test abc
            * {@includeCode ./abc/def.md}
        `.match(includeTagRegExp),
    ).toMatchInlineSnapshot(`
      [
        "{@includeCode ./abc/def.md}",
      ]
    `)

    expect(
      `
      test abc
          * {@includeCode ./abc/def.md#region_name}
      `.match(includeTagRegExp),
    ).toMatchInlineSnapshot(`
      [
        "{@includeCode ./abc/def.md#region_name}",
      ]
    `)

    expect(
      `
      test abc
          * {@include ./abc/def.md}
      
      test ghi
           * {@includeCode ./jkl/mno.md}
      
      test pqr
      * {@includeCode ./stu/vwx.md#test-region}
      `.replace(
        includeTagRegExp,
        (_, code, filepath, region) => `${code}---${filepath}---${region}`,
      ),
    ).toMatchInlineSnapshot(`
      "
            test abc
                * undefined---./abc/def.md---undefined
            
            test ghi
                 * Code---./jkl/mno.md---undefined
            
            test pqr
            * Code---./stu/vwx.md---#test-region
            "
    `)
  })
})

describe(replaceIncludeTagsWithReplacerCallback, () => {
  it('replaces using the expected replacement', async () => {
    expect(
      await replaceIncludeTagsWithReplacerCallback(
        `
        test abc
            * {@include ./abc/def.md}
        
        test ghi
            * {@includeCode ./jkl/mno.md}
        
        test pqr
        * {@includeCode ./stu/vwx.md#test-region}
        `,
        async (isIncludeCode, filepath, region) =>
          `${isIncludeCode}---${filepath}---${region}`,
      ),
    ).toMatchInlineSnapshot(`
      "
              test abc
                  * false---./abc/def.md---undefined
              
              test ghi
                  * true---./jkl/mno.md---undefined
              
              test pqr
              * true---./stu/vwx.md---#test-region
              "
    `)
  })
})

describe(getRegionMarkers, () => {
  it('returns the correct markers', () => {
    expect(getRegionMarkers('ts', '__region_name__')).toMatchInlineSnapshot(`
      [
        "//#region __region_name__",
        "//#endregion __region_name__",
      ]
    `)

    expect(getRegionMarkers('js', '__region_name__')).toMatchInlineSnapshot(`
      [
        "//#region __region_name__",
        "//#endregion __region_name__",
      ]
    `)
  })

  it('throws on unsupported file extension', () => {
    expect(() =>
      getRegionMarkers('unsupported', '__region_name__'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported file extension: "unsupported"]`,
    )
  })
})

describe(extractRegion, () => {
  it('returns the expected substring', () => {
    expect(
      extractRegion(
        '//#region __region_name__//#endregion __region_name__',
        'ts',
        '#__region_name__',
      ),
    ).toMatchInlineSnapshot(`""`)

    expect(
      extractRegion(
        '//#region __region_name__abc//#endregion __region_name__',
        'ts',
        '#__region_name__',
      ),
    ).toMatchInlineSnapshot(`"abc"`)

    expect(
      extractRegion(
        [
          '   //#region __region_name__',
          '  abc',
          'def',
          'xyz //#endregion __region_name__',
        ].join('\n'),
        'ts',
        '#__region_name__',
      ),
    ).toMatchInlineSnapshot(`
      "abc
      def
      xyz"
    `)
  })

  it('returns null on invalid input', () => {
    expect(
      extractRegion(
        '//#region __region_name__abc//#endregion __region_name__',
        'ts',
        '__region_name__',
      ),
    ).toBe(null)

    expect(
      extractRegion(
        'abc//#endregion __region_name__',
        'ts',
        '#__region_name__',
      ),
    ).toBe(null)

    expect(
      extractRegion('//#region __region_name__abc', 'ts', '#__region_name__'),
    ).toBe(null)
  })
})
