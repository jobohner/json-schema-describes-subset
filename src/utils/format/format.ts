import fs from 'fs/promises'
import process from 'process'
import path from 'path'

import { resolveConfig, format, type Options } from 'prettier'
import { toPosix } from '../to-posix/index.js'

export async function formatFileContent(
  filepath: string,
  fileContent: string,
): Promise<string> {
  const options = await resolveConfig(filepath)

  return await format(fileContent, {
    ...(options?.default as Options), // seems to be a bug with tsx
    ...options,
    filepath,
  })
}

export async function writeFormattedFile(
  filepath: string,
  fileContent: string,
): Promise<void> {
  await fs.writeFile(
    filepath,
    await formatFileContent(filepath, fileContent),
    'utf-8',
  )

  // eslint-disable-next-line no-console
  console.log(
    `wrote formatted file ./${toPosix(path.relative(process.cwd(), filepath))}`,
  )
}
