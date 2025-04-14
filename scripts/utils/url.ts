import path from 'path'

import { isStringWithPrefix } from '../../src/utils/type-guards/index.js'
import { toPosix } from '../../src/utils/to-posix/index.js'

export type RootRelativeURL = `/${string}`
export const isRootRelativeURL = isStringWithPrefix('/')
export function isRootRelativeURLIntoDir<
  RootRelativeURL_ extends RootRelativeURL,
>(
  rootRelativeURLToDir: RootRelativeURL_,
): (string: unknown) => string is `${RootRelativeURL_}/${string}` {
  return isStringWithPrefix(`${rootRelativeURLToDir}/`)
}

export function getURLFromFilepath(filepath: string): string {
  return toPosix(filepath)
}

export function getRootRelativeURLFromFilename(
  rootDirname: string,
  filename: string,
): RootRelativeURL {
  return `/${getURLFromFilepath(path.relative(rootDirname, filename))}`
}

export function makeRootRelativeURL(rootDirname: string, filename: string) {
  const placeholderBaseURL = getDummyURLFromFile(rootDirname)(filename)

  return function (url: string): string {
    if (URL.canParse(url)) {
      // absolute url (including `mailto:` or `tel:`) => nothing to do here
      return url
    }

    const urlData = new URL(url, placeholderBaseURL)
    return urlData.href.substring(urlData.origin.length)
  }
}

export function getDummyURLFromRootRelativeURL(
  rootRelativeURL: RootRelativeURL,
): string {
  return 'http://localhost' + rootRelativeURL
}

export function decomposeRootRelativeURL(rootRelativeURL: RootRelativeURL): {
  pathname: string
  fragment: string
} {
  const { pathname, hash } = new URL(
    getDummyURLFromRootRelativeURL(rootRelativeURL),
  )

  return {
    pathname: pathname,
    fragment: hash.substring(1),
  }
}

export function getDummyURLFromFile(rootDirname: string) {
  return function (filename: string): string {
    return getDummyURLFromRootRelativeURL(
      getRootRelativeURLFromFilename(rootDirname, filename),
    )
  }
}
