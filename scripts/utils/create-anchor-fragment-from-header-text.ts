import anchor from 'anchor-markdown-header'

const regexp = /\[.*\]\(#([^)]*)\)$/

export function getFragmentFromRegExpExecArray(
  array: RegExpExecArray | null,
  headerText: string,
): string {
  const fragment = (array ?? [])[1]
  if (fragment === undefined) {
    throw new Error(`couldn't create anchor fragment for '${headerText}'`)
  }
  return fragment
}

export function createAnchorFragmentFromHeaderText(headerText: string): string {
  return getFragmentFromRegExpExecArray(
    regexp.exec(anchor(headerText)),
    headerText,
  )
}
