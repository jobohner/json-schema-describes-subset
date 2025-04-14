export function wrapBackTicks(text: string): string {
  return `\`${text}\``
}

export function wrapCodeBlock(code: string, language: string = ''): string {
  // remove trailing empty line
  const lines = code.split('\n')
  const lastLine = lines.pop()
  if (lastLine !== undefined && lastLine.trim() !== '') {
    lines.push(lastLine)
  }

  const tripleBacktick = '```'

  return `${tripleBacktick}${language}\n${lines.join('\n')}\n${tripleBacktick}`
}
