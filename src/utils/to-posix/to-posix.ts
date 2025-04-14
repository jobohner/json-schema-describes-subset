import path from 'path'

export function toPosix(pathname: string): string {
  return pathname.replaceAll(path.sep, '/')
}
