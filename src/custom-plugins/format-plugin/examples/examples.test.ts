import path from 'path'

import { test, expect, describe, vi, afterEach, afterAll } from 'vitest'

import { tsConfigFilename } from '../../../../filenames.js'
import { addConsoleLogResultComments } from '../../../utils/add-console-log-result-comments/index.js'

describe('format-plugin examples', () => {
  const consoleLogMock = vi
    .spyOn(console, 'log')
    .mockImplementation(() => undefined)

  afterEach(() => {
    consoleLogMock.mockClear()
  })

  afterAll(() => {
    consoleLogMock.mockReset()
  })

  const example0FilenameBase = 'format-plugin-0.example'
  const example0Filename = `${example0FilenameBase}.ts`
  test(`'${example0Filename}' logs the expected results`, async () => {
    await import(`./example-files/${example0FilenameBase}.ts`)

    await expect(
      await addConsoleLogResultComments(
        path.join(import.meta.dirname, 'example-files', example0Filename),
        consoleLogMock.mock.calls,
        tsConfigFilename,
      ),
    ).toMatchFileSnapshot(
      path.join(import.meta.dirname, 'snapshots', example0Filename),
    )
  }, 20000)
})
