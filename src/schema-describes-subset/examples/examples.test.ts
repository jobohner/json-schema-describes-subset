import path from 'path'

import { test, expect, describe, vi, afterEach, afterAll } from 'vitest'

import { tsConfigFilename } from '../../../filenames.js'
import { addConsoleLogResultComments } from '../../utils/add-console-log-result-comments/index.js'

describe('schema-describes-subset examples', () => {
  const consoleLogMock = vi
    .spyOn(console, 'log')
    .mockImplementation(() => undefined)

  afterEach(() => {
    consoleLogMock.mockClear()
  })

  afterAll(() => {
    consoleLogMock.mockReset()
  })

  const example0Filename = 'schema-describes-subset-0.example.ts'
  test(`'${example0Filename}' logs the expected results`, async () => {
    await import(`./${example0Filename}`)

    await expect(
      await addConsoleLogResultComments(
        path.join(import.meta.dirname, example0Filename),
        consoleLogMock.mock.calls,
        tsConfigFilename,
      ),
    ).toMatchFileSnapshot(
      path.join(import.meta.dirname, 'snapshots', example0Filename),
    )
  }, 20000)
})
