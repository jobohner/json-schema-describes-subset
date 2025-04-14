export function splitToLines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').replaceAll('\r', '\n').split('\n')
}

export function mapLines(
  text: string,
  mapFunction: (line: string) => string,
): string {
  return splitToLines(text).map(mapFunction).join('\n')
}

export function makeWhitespacesPlain(text: string): string {
  return text.replace(/\s+/g, ' ')
}

export function removePrefix(
  string: string,
  prefix: string,
  offset: number = 0,
): string | null {
  return string.startsWith(prefix)
    ? string.substring(prefix.length + offset)
    : null
}
