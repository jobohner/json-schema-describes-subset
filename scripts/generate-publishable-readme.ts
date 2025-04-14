/**
 * @file
 *
 *   Generates a Readme.md at the project root, which doesn't contain any relative
 *   urls. That file will not be committed, but is intended to be published to
 *   npm.
 */

import path from 'path'
import fs from 'fs/promises'

import isString from 'lodash/isString.js'
import isObject from 'lodash/isObject.js'

import { visit } from 'unist-util-visit'

import { assertType } from '../src/utils/type-guards/type-guards.js'
import { writeFormattedFile } from '../src/utils/format/format.js'

import {
  isResourceNode,
  fromMarkdown,
  toMarkdown,
} from './utils/mdast-utils.js'
import { isRootRelativeURL } from './utils/url.js'

import { readmeFilename, rootDirname } from '../filenames.js'

const packageJSON = JSON.parse(
  await fs.readFile(path.join(rootDirname, 'package.json'), 'utf-8'),
)

function extractVersionString(packageJSON: Record<string, unknown>): string {
  const versionString = assertType(
    isString,
    `couldn't extract version`,
  )(packageJSON.version)

  return versionString.startsWith('v') ? versionString : `v${versionString}`
}

function extractRepositoryURL(packageJSON: Record<string, unknown>): string {
  const repositoryData = assertType(
    isObject,
    `couldn't extract repository url`,
  )(packageJSON.repository)

  return assertType(
    isString,
    `couldn't extract repository url`,
  )((repositoryData as Record<string, unknown>).url)
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
}

const readmeRoot = await fromMarkdown(
  await fs.readFile(readmeFilename, 'utf-8'),
)

export const repositoryURLPrefix = `${extractRepositoryURL(packageJSON)}/blob/${extractVersionString(packageJSON)}`

visit(readmeRoot, (node) => {
  if (!isResourceNode(node)) {
    return
  }

  if (isRootRelativeURL(node.url)) {
    node.url = repositoryURLPrefix + node.url
  }
})

await writeFormattedFile(
  path.join(rootDirname, 'README.md'),
  toMarkdown(readmeRoot),
)
