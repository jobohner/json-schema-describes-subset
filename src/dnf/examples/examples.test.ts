import fs from 'fs/promises'
import path from 'path'

import { describe, test, expect, vi, afterAll, afterEach } from 'vitest'

import { wrapCodeBlock } from '../../utils/markdown-utils/index.js'
import { formatFileContent } from '../../utils/format/index.js'
import { schemaDescribesEmptySet, toDNF } from '../dnf.js'
import { addConsoleLogResultComments } from '../../utils/add-console-log-result-comments/index.js'
import { tsConfigFilename } from '../../../filenames.js'

describe('dnf examples', async () => {
  const consoleLogMock = vi
    .spyOn(console, 'log')
    .mockImplementation(() => undefined)

  afterEach(() => {
    consoleLogMock.mockClear()
  })

  afterAll(() => {
    consoleLogMock.mockReset()
  })

  test(`${toDNF.name} logs as expected`, async () => {
    const exampleStrings: string[] = []

    for (const filenameBase of ['to-dnf-0', 'to-dnf-1']) {
      consoleLogMock.mockClear()

      const importFilename = path.join(
        import.meta.dirname,
        'example-files',
        `${filenameBase}.example.js`,
      )

      await import(importFilename)

      const logCalls = consoleLogMock.mock.calls

      expect(logCalls.length).toBe(1)

      const logged = JSON.stringify((logCalls[0] as unknown[])[0])

      const exampleFileContent = await fs.readFile(
        path.join(
          import.meta.dirname,
          'example-files',
          `${filenameBase}.example.ts`,
        ),
        'utf-8',
      )

      exampleStrings.push(
        `${wrapCodeBlock(exampleFileContent, 'typescript')}\n\nlogs:\n\n${wrapCodeBlock(logged, 'json')}`,
      )
    }

    const snapshotFilename = path.join(
      import.meta.dirname,
      'snapshots',
      'to-dnf.example.md',
    )

    await expect(
      await formatFileContent(
        snapshotFilename,
        exampleStrings.join('\n\n---\n\n'),
      ),
    ).toMatchFileSnapshot(snapshotFilename)
  })

  test(`${schemaDescribesEmptySet.name} logs as expected`, async () => {
    const example0FilenameBase = 'schema-describes-empty-set-0.example'
    const example0Filename = `${example0FilenameBase}.ts`
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
