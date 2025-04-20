import fs from 'fs/promises'

import minBy from 'lodash/minBy.js'

import { is } from 'unist-util-is'
import { visit, EXIT, type Test, type BuildVisitor } from 'unist-util-visit'
import { filter } from 'unist-util-filter'
import { fromMarkdown as fromMarkdown_ } from 'mdast-util-from-markdown'
import { toMarkdown as toMarkdown_ } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { toString } from 'mdast-util-to-string'
import type { Node, Nodes, Root, RootContent, Heading } from 'mdast'

import { splitArray } from '../../src/utils/array/index.js'
import { throwError } from '../../src/utils/type-guards/index.js'
import { removePrefix } from '../../src/utils/string/index.js'

import {
  makeRootRelativeURL,
  getRootRelativeURLFromFilename,
  isRootRelativeURL,
  decomposeRootRelativeURL,
} from './url.js'
import { createAnchorFragmentFromHeaderText } from './create-anchor-fragment-from-header-text.js'

export function fromMarkdown(text: Parameters<typeof fromMarkdown_>[0]): Root {
  return fromMarkdown_(text, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })
}

export function toMarkdown(tree: Nodes): string {
  return toMarkdown_(tree, {
    extensions: [gfmToMarkdown()],
  })
}

type Matches<
  Tree extends import('unist').Node,
  Check extends Test,
> = Parameters<BuildVisitor<Tree, Check>>[0]

/**
 * like 'unist-util-find' but with working types
 */
export function find<Tree extends import('unist').Node, Check extends Test>(
  tree: Tree | Tree[],
  check: Check,
): Matches<Tree, Check> | null {
  let result: Matches<Tree, Check> | null = null

  for (const treeNode of Array.isArray(tree) ? tree : [tree]) {
    visit(treeNode, (node) => {
      if (is(node, check)) {
        result = node as Matches<Tree, Check>
        return EXIT
      }
    })
    if (result !== null) {
      return result
    }
  }

  return null
}

export function findAll<Tree extends import('unist').Node, Check extends Test>(
  tree: Tree | Tree[],
  check: Check,
): Matches<Tree, Check>[] {
  const result: Matches<Tree, Check>[] = []

  for (const treeNode of Array.isArray(tree) ? tree : [tree]) {
    visit(treeNode, (node) => {
      if (is(node, check)) {
        result.push(node as Matches<Tree, Check>)
      }
    })
  }

  return result
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const isResourceNode = (node: unknown) =>
  is(node, 'link') || is(node, 'definition') || is(node, 'image')

export function dropTextBeforeHeading(nodes: RootContent[]): RootContent[] {
  const firstHeadingIndex = nodes.findIndex((node) => is(node, 'heading'))

  if (firstHeadingIndex === -1) {
    return nodes
  }

  return nodes.slice(firstHeadingIndex)
}

export function findHeading(nodes: Node[]): Heading | null {
  const headings = findAll(nodes, 'heading')
  return minBy(headings, 'depth') ?? null
}

export function extractLeadText(
  options: {
    throw?: boolean | undefined
    includeTitle?: boolean | undefined
  } = {},
) {
  return function extractLeadText(content: RootContent[]): RootContent[] {
    const [, leadText] = splitArray(content, (node) => is(node, 'heading'), {
      includeSplitterElement: options.includeTitle ? 'prefix' : null,
    })

    if (leadText === undefined) {
      return options.throw ? throwError(`couldn't extract lead text`) : []
    }

    return leadText
  }
}

export type RootNodesByFilename = Record<string, Root>

export type URLMap = Record<string, string | null>

export function remapURL({
  url,
  urlMap,
}: {
  urlMap: URLMap
  url: string
}): string | null {
  if (!isRootRelativeURL(url)) {
    return null
  }

  const { pathname, fragment } = decomposeRootRelativeURL(url)

  return (
    (fragment && urlMap[`${pathname}#${fragment}`]) || urlMap[pathname] || null
  )
}

/**
 * All descendant links, images and definitions are remapped according to
 * `urlMap`.
 */
export function remapURLs({
  rootDirname,
  urlMap,
  rootNodesByFilename,
  onUnRemappedURL,
}: {
  rootDirname: string
  urlMap: URLMap
  rootNodesByFilename: RootNodesByFilename
  onUnRemappedURL?: undefined | ((url: string) => string)
}): void {
  for (const [filename, rootNode] of Object.entries(rootNodesByFilename)) {
    const rootRelativeFilepathURL = getRootRelativeURLFromFilename(
      rootDirname,
      filename,
    )

    visit(rootNode, (node) => {
      if (!isResourceNode(node)) {
        return
      }

      if (URL.canParse(node.url)) {
        return
      }

      const remappedURL = remapURL({
        url: node.url,
        urlMap,
      })

      if (remappedURL !== null) {
        // keep only fragment if sufficient
        node.url =
          removePrefix(remappedURL, `${rootRelativeFilepathURL}#`, -1) ??
          removePrefix(remappedURL, `${rootRelativeFilepathURL}/#`, -1) ??
          remappedURL
      } else if (onUnRemappedURL) {
        node.url = onUnRemappedURL(node.url)
      }
    })
  }
}

/**
 * ⚠️ whenever this creates a new function, a new counting context starts from
 * 0
 */
function mapHeadingAnchor(
  map: Map<Heading, string> | WeakMap<Heading, string>,
): (heading: Heading) => void {
  const anchorCounts: Record<string, number> = {}

  return function (heading: Heading): void {
    let anchorText = createAnchorFragmentFromHeaderText(toString(heading))
    const anchorCount = anchorCounts[anchorText] ?? 0
    anchorCounts[anchorText] = anchorCount + 1
    if (anchorCount > 0) {
      anchorText += `-${anchorCount}`
    }
    map.set(heading, anchorText)
  }
}

// TODO: rename to sth that resembles lifecycle hooks?
export type PreprocessNewRootContents = (
  nodes: RootContent[],
) => RootContent[] | null | undefined | void

export interface MarkdownCompositionAppendOptions {
  filename?: string | undefined
  remapFilenameURL?: boolean | undefined
  headingsDepthOffset?: number | undefined
  preprocessNewRootContents?: PreprocessNewRootContents[] | undefined
}

export interface MarkdownCompositionConstructorArgs {
  rootDirname: string
  targetFilename: string
  remapURLFrom?: string | undefined
  preprocessNewRootContents?: PreprocessNewRootContents[] | undefined
}

export class MarkdownComposition {
  private readonly root: Root = { type: 'root', children: [] }
  private readonly fileHeadingsMap: Record<string, Heading[]> = {}
  private readonly originalHeadingAnchors = new WeakMap<Heading, string>()
  private hasTitle = false
  readonly rootDirname: string
  readonly targetFilename: string
  readonly remapURLFrom: string | undefined
  private readonly preprocessNewRootContents: PreprocessNewRootContents[]
  private promise: Promise<void> = Promise.resolve()

  constructor({
    rootDirname,
    targetFilename,
    preprocessNewRootContents,
    remapURLFrom,
  }: MarkdownCompositionConstructorArgs) {
    this.rootDirname = rootDirname
    this.targetFilename = targetFilename
    this.preprocessNewRootContents = preprocessNewRootContents ?? []
    this.remapURLFrom = remapURLFrom
  }

  private appendNodes(
    content: Root | RootContent[],
    options: MarkdownCompositionAppendOptions | undefined = {},
  ): void {
    const {
      preprocessNewRootContents = [],
      filename,
      remapFilenameURL = true,
    } = options

    let nodes = (Array.isArray(content) ? content : content.children).map(
      (node) => filter(node), // create copy
    )

    if (filename) {
      /*
       * make all relative urls root relative, so that they still
       * point to the same resource after appending
       */

      const makeRootRelativeURL_ = makeRootRelativeURL(
        this.rootDirname,
        filename,
      )

      for (const node of nodes) {
        visit(node, (descendantNode) => {
          if (!isResourceNode(descendantNode)) {
            return
          }

          descendantNode.url = makeRootRelativeURL_(descendantNode.url)
        })
      }
    }

    findAll(nodes, 'heading').forEach(
      mapHeadingAnchor(this.originalHeadingAnchors),
    )

    for (const preprocess of [
      ...this.preprocessNewRootContents,
      ...preprocessNewRootContents,
    ]) {
      nodes = preprocess(nodes) ?? nodes
    }

    const headings = findAll(nodes, 'heading')
    if (headings.length > 0) {
      const minDepth = Math.min(...headings.map(({ depth }) => depth))
      const diff =
        (this.hasTitle ? 2 : 1) + (options.headingsDepthOffset ?? 0) - minDepth
      headings.forEach((heading) => (heading.depth += diff))
      this.hasTitle = true
    }

    if (filename && remapFilenameURL) {
      this.fileHeadingsMap[filename] = headings
    }

    this.root.children.push(...nodes)
  }

  appendMarkdownText(
    text: string,
    options?: MarkdownCompositionAppendOptions | undefined,
  ): this {
    this.promise = this.promise.then(() => {
      this.appendNodes(fromMarkdown(text), options)
    })

    return this
  }

  appendMarkdownFile(
    filename: string,
    options?: Omit<MarkdownCompositionAppendOptions, 'filename'> | undefined,
  ): this {
    this.promise = Promise.all([
      fs.readFile(filename, 'utf-8'),
      this.promise,
    ]).then(([fileContent]) => {
      this.appendNodes(fromMarkdown(fileContent), { ...options, filename })
    })

    return this
  }

  async createURLMap(): Promise<URLMap> {
    await this.promise

    const targetFilenameURLWithoutFragment = getRootRelativeURLFromFilename(
      this.rootDirname,
      this.targetFilename,
    )

    const headingAnchorMap = new WeakMap<Heading, string>()
    visit(this.root, 'heading', mapHeadingAnchor(headingAnchorMap))

    const result = Object.fromEntries(
      Object.entries(this.fileHeadingsMap).flatMap(
        ([filename, headings]): [string, string][] => {
          const filenameURLWithoutFragment = getRootRelativeURLFromFilename(
            this.rootDirname,
            filename,
          )

          const resultMappings: [string, string][] = []

          // keep urls that pointed to anchors that are now valid
          for (const heading of headings) {
            const anchorText = headingAnchorMap.get(heading)
            if (anchorText) {
              resultMappings.push([
                `${filenameURLWithoutFragment}#${anchorText}`,
                `${targetFilenameURLWithoutFragment}#${anchorText}`,
              ])
            }
          }

          // remap former urls to anchors
          for (const heading of headings) {
            const originalAnchorText = this.originalHeadingAnchors.get(heading)
            const anchorText = headingAnchorMap.get(heading)
            if (originalAnchorText && anchorText) {
              resultMappings.push([
                `${filenameURLWithoutFragment}#${originalAnchorText}`,
                `${targetFilenameURLWithoutFragment}#${anchorText}`,
              ])
            }
          }

          const minDepthHeading = minBy(headings, 'depth')
          const minDepthAnchorText =
            minDepthHeading && headingAnchorMap.get(minDepthHeading)
          if (minDepthAnchorText) {
            resultMappings.push([
              filenameURLWithoutFragment,
              `${targetFilenameURLWithoutFragment}#${minDepthAnchorText}`,
            ])
          } else {
            resultMappings.push([
              filenameURLWithoutFragment,
              targetFilenameURLWithoutFragment,
            ])
          }

          return resultMappings
        },
      ),
    )

    if (this.remapURLFrom) {
      result[
        getRootRelativeURLFromFilename(this.rootDirname, this.remapURLFrom)
      ] = targetFilenameURLWithoutFragment
    }

    return result
  }

  async getRootNode(): Promise<Root> {
    await this.promise
    return this.root
  }
}

export class MarkdownCompositions {
  private readonly rootDirname: string

  constructor(
    private readonly compositions: MarkdownComposition[],
    private readonly onUnRemappedURL?: undefined | ((url: string) => string),
  ) {
    const rootDirname = compositions[0]?.rootDirname
    if (
      !rootDirname ||
      compositions.some(
        (composition) => composition.rootDirname !== rootDirname,
      )
    ) {
      throw new Error()
    }

    this.rootDirname = rootDirname
  }

  async getURLMap(): Promise<URLMap> {
    return Object.fromEntries(
      (
        await Promise.all(
          this.compositions.map(async (composition) =>
            Object.entries(await composition.createURLMap()),
          ),
        )
      ).flat(),
    )
  }

  async getRootNodes(): Promise<RootNodesByFilename> {
    const urlMap: URLMap = await this.getURLMap()

    const rootNodesByFilename = Object.fromEntries(
      await Promise.all(
        this.compositions.map(
          async (composition): Promise<[string, Root]> => [
            composition.targetFilename,
            await composition.getRootNode(),
          ],
        ),
      ),
    )

    remapURLs({
      rootDirname: this.rootDirname,
      urlMap,
      rootNodesByFilename,
      onUnRemappedURL: this.onUnRemappedURL,
    })

    return rootNodesByFilename
  }
}
