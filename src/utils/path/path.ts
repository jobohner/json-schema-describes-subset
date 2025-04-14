import path from 'path'

/** @returns Extension without leading period */
export function getPlainExtname(filename: string): string {
  return path.extname(filename).replace(/^\./, '')
}
