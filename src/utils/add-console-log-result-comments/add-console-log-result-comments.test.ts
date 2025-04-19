import path from 'path'

import { describe, it, expect, vi, afterAll, afterEach } from 'vitest'

import { addConsoleLogResultComments } from './add-console-log-result-comments.js'
import { tsConfigFilename } from '../../../filenames.js'

describe(addConsoleLogResultComments, () => {
  const consoleLogMock = vi
    .spyOn(console, 'log')
    .mockImplementation(() => undefined)

  afterEach(() => {
    consoleLogMock.mockClear()
  })

  afterAll(() => {
    consoleLogMock.mockReset()
  })

  it('creates the expected result', async () => {
    const testFilenameBase = 'test-file-0'
    const testFilename = `${testFilenameBase}.ts`
    await import(`./test-files/${testFilenameBase}.ts`)

    await expect(
      await addConsoleLogResultComments(
        path.join(import.meta.dirname, 'test-files', testFilename),
        consoleLogMock.mock.calls,
        tsConfigFilename,
      ),
    ).toMatchFileSnapshot(
      path.join(import.meta.dirname, 'snapshots', testFilename),
    )

    await expect(
      addConsoleLogResultComments(
        path.join(import.meta.dirname, 'test-files', testFilename),
        [...consoleLogMock.mock.calls, [0]],
        tsConfigFilename,
      ),
    ).rejects.toMatchInlineSnapshot(`[Error: Unexpected undefined statement]`)
  }, 20000)
})
