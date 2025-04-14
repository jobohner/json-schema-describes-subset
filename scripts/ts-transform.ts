import process from 'process'
import path from 'path'
import fs from 'fs/promises'

import { visit } from 'unist-util-visit'

import {
  Node as TSNode,
  Project as TSProject,
  type JSDocStructure,
} from 'ts-morph'

import { getPlainExtname } from '../src/utils/path/index.js'
import { wrapCodeBlock } from '../src/utils/markdown-utils/markdown-utils.js'

import {
  replaceIncludeTagsWithReplacerCallback,
  extractRegion,
} from './utils/doc-comment-include.js'
import {
  isResourceNode,
  fromMarkdown,
  toMarkdown,
} from './utils/mdast-utils.js'
import { makeRootRelativeURL as makeRootRelativeURL_ } from './utils/url.js'

import {
  projectDocumentsRootRelativeURL,
  rootDirname,
  srcDirname,
  tmpDocsRootRelativeURL,
  tsConfigBuildFilename,
} from '../filenames.js'

// this import will also generate documentation files
const { mapURLConstsAndToSrc, urlMap } = await import('./generate-docs.js')

// always also generate a publishable README.md, so that links will still work
const { repositoryURLPrefix } = await import('./generate-publishable-readme.js')

// TODO: move more of the functionality to utils and add tests for them

const project = new TSProject({
  tsConfigFilePath: tsConfigBuildFilename,
  skipFileDependencyResolution: true,
})

const sourceFiles = project.getSourceFiles()

async function visitTSNodeAsync(
  node: TSNode,
  callback: (node: TSNode) => Promise<void>,
): Promise<void> {
  await callback(node)

  for (const child of node.getChildren()) {
    await visitTSNodeAsync(child, callback)
  }
}

const distDirname = path.join(rootDirname, 'dist')

async function replaceIncludeTags(
  dirname: string,
  text: string,
): Promise<string> {
  return await replaceIncludeTagsWithReplacerCallback(
    text,
    async (isIncludeCode, filepath, region): Promise<string> => {
      const actualFilepath = path.join(
        srcDirname,
        path.relative(distDirname, path.join(dirname, filepath)),
      )

      const fileContent = await fs.readFile(actualFilepath, 'utf-8')

      const fileExtension = getPlainExtname(filepath)

      let fileContentRegion: string | null = null
      if (region !== undefined) {
        fileContentRegion = extractRegion(fileContent, fileExtension, region)
        if (fileContentRegion === null) {
          throw new Error(
            `Could not extract region "${region}" from file at ${actualFilepath}`,
          )
        }
      }

      // TODO: use remapURLs on included markdown files

      if (isIncludeCode) {
        return wrapCodeBlock(fileContentRegion ?? fileContent, fileExtension)
      } else {
        return fileContentRegion ?? fileContent
      }
    },
  )
}

function remapURLs(filename: string, mdText: string): string {
  const tree = fromMarkdown(mdText)

  const makeRootRelativeURL = makeRootRelativeURL_(rootDirname, filename)

  visit(tree, (node) => {
    if (!isResourceNode(node)) {
      return
    }

    if (URL.canParse(node.url)) {
      return
    }

    let rootRelativeURL = makeRootRelativeURL(node.url)

    if (rootRelativeURL.startsWith(projectDocumentsRootRelativeURL)) {
      rootRelativeURL = rootRelativeURL.replace(
        projectDocumentsRootRelativeURL + '/',
        tmpDocsRootRelativeURL + '/Document.',
      )
    }

    rootRelativeURL = urlMap[rootRelativeURL] ?? rootRelativeURL

    try {
      rootRelativeURL = mapURLConstsAndToSrc(rootRelativeURL)
    } catch {
      throw new Error(`Couldn't remap url '${node.url}' in file ${filename}`)
    }

    const absoluteURL = URL.canParse(rootRelativeURL)
      ? rootRelativeURL
      : repositoryURLPrefix + rootRelativeURL

    node.url = absoluteURL
  })

  return toMarkdown(tree)
}

async function modifyJSDocText(
  filename: string,
  mdText: { toString(): string } = '',
): Promise<string> {
  return remapURLs(
    filename,
    await replaceIncludeTagsInTextNodes(
      path.dirname(filename),
      mdText.toString(),
    ),
  )
}

async function replaceIncludeTagsInTextNodes(
  dirname: string,
  mdText: string,
): Promise<string> {
  const tree = fromMarkdown(mdText)

  /* visit first and modify later for 2 reasons:
   * - `visit` is not async
   * - modifications insert new markdown which is
   *   unnecessarily complicated in the tree
   */
  const textPositions: {
    startPosition: number
    endPosition: number
    text: string
  }[] = []

  visit(tree, 'text', ({ position, value }) => {
    if (position === undefined) {
      return
    }

    const {
      start: { offset: startPosition },
      end: { offset: endPosition },
    } = position

    if (startPosition === undefined || endPosition === undefined) {
      return
    }

    textPositions.unshift({ startPosition, endPosition, text: value })
  })

  let remainingText = mdText
  let resultText = ''

  for (const { startPosition, endPosition, text } of textPositions) {
    resultText =
      (await replaceIncludeTags(dirname, text)) +
      remainingText.slice(endPosition) +
      resultText

    remainingText = remainingText.slice(0, startPosition)
  }

  return resultText
}

for (const sourceFile of sourceFiles) {
  const filename = sourceFile.getFilePath()

  await visitTSNodeAsync(sourceFile, async (node) => {
    if (TSNode.isJSDocable(node)) {
      for (const jsDoc of node.getJsDocs()) {
        const jsDocStructure = jsDoc.getStructure()

        const newStructure: JSDocStructure = {
          ...jsDocStructure,
          description: await modifyJSDocText(
            filename,
            jsDocStructure.description,
          ),
          tags: await Promise.all(
            (jsDocStructure.tags ?? []).map(async (tag) => {
              const newTagStructure = {
                ...tag,
                text: await modifyJSDocText(filename, tag.text),
              }
              return newTagStructure
            }),
          ),
        }

        jsDoc.set(newStructure)
      }
    }
  })
}

const diagnostics = project.getPreEmitDiagnostics()

if (diagnostics.length > 0) {
  console.error(project.formatDiagnosticsWithColorAndContext(diagnostics))
  process.exit(1)
}

project.emit()
