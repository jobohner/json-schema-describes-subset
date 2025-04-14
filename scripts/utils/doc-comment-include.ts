import replaceAsync from 'string-replace-async'

/**
 * Currently only #region_name is supported. No #region_name1,region_name2. No
 * line numbers.
 */
export const includeTagRegExp = /\{@include(Code)? ([^#\s}]+)(#[^#\s}]+)?\}/gm

export async function replaceIncludeTagsWithReplacerCallback(
  text: string,
  replacer: (
    isIncludeCode: boolean,
    filepath: string,
    region?: string | undefined,
  ) => Promise<string>,
): Promise<string> {
  return replaceAsync(text, includeTagRegExp, (_, code, filepath, region) => {
    return replacer(code === 'Code', filepath, region)
  })
}

/** Currently only supports `js` and `ts` files. */
export function getRegionMarkers(
  fileExtension: string,
  regionName: string,
): [string, string] {
  switch (fileExtension) {
    case 'js':
    case 'ts':
      return [`//#region ${regionName}`, `//#endregion ${regionName}`]
    default:
      throw new Error(`Unsupported file extension: "${fileExtension}"`)
  }
}

export function extractRegion(
  content: string,
  fileExtension: string,
  region: string,
): string | null {
  if (!region.startsWith('#')) {
    return null
  }

  const regionName = region.substring(1)
  const [startMarker, endMarker] = getRegionMarkers(fileExtension, regionName)

  const startMarkerIndex = content.indexOf(startMarker)

  if (startMarkerIndex < 0) {
    return null
  }

  const startIndex = startMarkerIndex + startMarker.length

  const endIndex = content.indexOf(endMarker, startIndex)

  if (endIndex < 0) {
    return null
  }

  return content.substring(startIndex, endIndex).trim()
}
