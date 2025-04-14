export class UnsupportedKeywordError extends Error {
  constructor(keyword: string, value?: unknown) {
    super(
      `Unsupported keyword '${keyword}'${value === undefined ? '' : ` with value '${String(value)}'`}. This currently cannot be transformed to a dnf.`,
    )
  }
}
