import path from 'path'
import fs from 'fs/promises'

import { describe, it, expect } from 'vitest'

import { rimraf } from 'rimraf'

import { formatFileContent, writeFormattedFile } from './format.js'
import { createSameElementsArray } from '../array/array.js'

const testDirname = path.join(import.meta.dirname, 'test-files')
await rimraf(testDirname)
await fs.mkdir(testDirname)

describe(formatFileContent, () => {
  it('returns the expected formatted text', async () => {
    expect(
      await formatFileContent(
        path.join(import.meta.dirname, 'xyz.md'),
        '# title' + '\n\n\n' + createSameElementsArray(100, 'abcdef').join(' '),
      ),
    ).toMatchInlineSnapshot(`
      "# title

      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef abcdef
      abcdef
      "
    `)
  })
})

describe(writeFormattedFile, () => {
  it('writes the file with the expected formatted content', async () => {
    const testFilename = path.join(
      testDirname,
      `${writeFormattedFile.name}-result-a.json`,
    )

    await writeFormattedFile(testFilename, '{a:5,b:6}')

    expect(await fs.readFile(testFilename, 'utf-8')).toMatchInlineSnapshot(`
      "{ "a": 5, "b": 6 }
      "
    `)
  })
})
