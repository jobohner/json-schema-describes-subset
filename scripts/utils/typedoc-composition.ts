/**
 * Utilities for processing files previously generated with typedoc
 *
 * @module
 */

import path from 'path'

import { is } from 'unist-util-is'
import { visit } from 'unist-util-visit'
import { filter } from 'unist-util-filter'
import type {
  Definition,
  Image,
  Link,
  Root,
  RootContent,
  List,
  PhrasingContent,
} from 'mdast'

import { ReflectionKind, type TypeDocOptions } from 'typedoc'
import { glob } from 'glob'

import {
  dropTextBeforeHeading,
  findHeading,
  isResourceNode,
  MarkdownComposition,
  type MarkdownCompositionAppendOptions,
  type MarkdownCompositionConstructorArgs,
  type PreprocessNewRootContents,
  type RootNodesByFilename,
  toMarkdown,
} from './mdast-utils.js'
import {
  decomposeRootRelativeURL,
  getRootRelativeURLFromFilename,
  isRootRelativeURL,
  isRootRelativeURLIntoDir,
  type RootRelativeURL,
} from './url.js'
import { toPosix } from '../../src/utils/to-posix/index.js'
import { throwError } from '../../src/utils/type-guards/index.js'
import { makeWhitespacesPlain } from '../../src/utils/string/index.js'
import { getElementsBetween } from '../../src/utils/array/index.js'

export function createTypeDocOptions(
  rootDirname: string,
  tmpDocsDirname: string,
  reflectionsJSONFilename: string,
): TypeDocOptions {
  return {
    outputs: [
      { name: 'markdown', path: tmpDocsDirname },
      { name: 'json', path: reflectionsJSONFilename },
    ],
    sourceLinkTemplate: '/{path}#L{line}',
    /* TODO: treatWarningsAsErrors doesn't seem to work. E. g. when
     * {@include <invalid-path>} */
    treatWarningsAsErrors: true,
    jsDocCompatibility: false,
    plugin: ['typedoc-plugin-markdown'],
    readme: 'none',
    excludeExternals: true,
    externalPattern: [path.join(rootDirname, 'node_modules', '**', '*')].map(
      toPosix,
    ),
    // @ts-expect-error markdown plugin option
    flattenOutputFiles: true,
    hideGroupHeadings: true,
    hideBreadcrumbs: true,
    parametersFormat: 'table',
    expandParameters: false,
    expandObjects: false,
  }
}

export function extractDescriptionForPackageJSON(root: Root): string {
  const packageJSONDescription: Root = {
    type: 'root',
    children: getElementsBetween(
      root.children,
      (node) =>
        is(node, {
          type: 'html',
          value: '<!-- package-json-description-start -->',
        }),
      (node) =>
        is(node, {
          type: 'html',
          value: '<!-- package-json-description-end -->',
        }),
    )
      .flat()
      .map((rootContent) => filter(rootContent)),
  }

  visit(packageJSONDescription, (node) => {
    if (!('children' in node)) {
      return
    }

    node.children = node.children
      .map((child) => (is(child, 'link') ? child.children : [child]))
      .flat() as (typeof node)['children']
  })

  return makeWhitespacesPlain(toMarkdown(packageJSONDescription)).trim()
}

export function extractDescriptionForPackageJSONThrow(root: Root): string {
  return (
    extractDescriptionForPackageJSON(root) ||
    throwError(`couldn't extract description for package.json`)
  )
}

export function decomposeTypeDocFilename(filename: string): {
  moduleName: string
  reflectionKind: ReflectionKind
  reflectionName: string
} {
  const fileBasename = path.basename(filename)

  const [moduleName, reflectionKindString, reflectionName, fileExtension] =
    fileBasename.split('.')

  if (
    typeof moduleName !== 'string' ||
    typeof reflectionKindString !== 'string' ||
    typeof reflectionName !== 'string' ||
    fileExtension !== 'md'
  ) {
    throw new Error(`could not decompose ${fileBasename}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reflectionKind = ReflectionKind[reflectionKindString as any] as
    | ReflectionKind
    | undefined

  if (reflectionKind === undefined) {
    throw new Error(`could not decompose ${fileBasename}`)
  }

  return { moduleName, reflectionKind, reflectionName }
}

export type TypeDocFilenamesByModuleNameAndReflectionName = Record<
  string,
  Record<string, string>
>

export function removeModulePrefixFromLinkText(
  rootContents: RootContent[],
): void {
  for (const rootContent of rootContents) {
    visit(rootContent, 'link', (link) => {
      try {
        const { moduleName, reflectionName } = decomposeTypeDocFilename(
          link.url,
        )

        const [child, ...rest] = link.children
        if (is(child, 'text') && rest.length === 0) {
          if (child.value === `${moduleName}!${reflectionName}`) {
            child.value = reflectionName
          }
        }
      } catch {
        //
      }
    })
  }
}

/**
 * Links pointing to a reflection not contained in the final
 * documentation are remapped to point to the respective line in the source code
 * file.
 */
export function remapURLToSrc({
  tmpDocsRootRelativeURL,
  reflectionsJSON,
}: {
  tmpDocsRootRelativeURL: RootRelativeURL
  reflectionsJSON: { children: Record<string, unknown>[] }
}): (url: string) => string {
  return function (url: string): string {
    if (!isRootRelativeURL(url)) {
      return url
    }

    const { pathname } = decomposeRootRelativeURL(url)

    // if url references tmp docs => try to instead link to source file

    if (!isRootRelativeURLIntoDir(tmpDocsRootRelativeURL)(pathname)) {
      return url
    }

    const { moduleName, reflectionKind, reflectionName } =
      decomposeTypeDocFilename(pathname)

    function throwError(): never {
      throw new Error(`Unexpected link to tmp docs: ${url}`)
    }

    const reflectionsModules: Record<string, unknown>[] =
      reflectionsJSON.children
    const reflectionsModule =
      reflectionsModules.find(({ name }) => name === moduleName) ?? throwError()

    const reflections = reflectionsModule.children
    if (!Array.isArray(reflections)) {
      throwError()
    }

    const reflection = reflections.find(
      ({ name, kind }) => name === reflectionName && kind === reflectionKind,
    )

    const newURL = reflection.sources[0].url

    if (!isRootRelativeURL(newURL)) {
      throwError()
    }

    return newURL
  }
}

class Links extends Map<string, Link> {
  set(url: string, link: Link): this {
    if (!(URL.canParse(url) || isRootRelativeURL(url))) {
      throw new Error(
        `Unexpected url '${url}'. Only absolute urls and root references are accepted.`,
      )
    }

    super.set(url, link)
    return this
  }

  add(resource: Definition | Image | Link, fileURL: string): this {
    const url = resource.url.startsWith('#')
      ? fileURL + resource.url
      : resource.url

    this.set(url, {
      type: 'link',
      url,
      children: [{ type: 'text', value: url }],
    })

    return this
  }
}

export function createListOfAllLinks(
  rootDirname: string,
  rootNodesByFilename: RootNodesByFilename,
): List {
  const allURLs = new Links()

  for (const [filename, root] of Object.entries(rootNodesByFilename)) {
    const fileURL = getRootRelativeURLFromFilename(rootDirname, filename)

    visit(root, (node) => {
      if (isResourceNode(node)) {
        allURLs.add(node, fileURL)
      }
    })
  }

  return {
    type: 'list',
    children: [...allURLs.values()].map((link) => ({
      type: 'listItem',
      children: [
        {
          type: 'paragraph',
          children: [link],
        },
      ],
    })),
  }
}

export function overrideTitle(
  title: PhrasingContent[],
): PreprocessNewRootContents {
  return function (nodes): void {
    const heading = findHeading(nodes)

    if (heading) {
      heading.children = title
    } else {
      nodes.unshift({
        type: 'heading',
        depth: 1,
        children: title,
      })
    }
  }
}

export async function retrieveTypeDocFilenames(
  dirname: string,
): Promise<TypeDocFilenamesByModuleNameAndReflectionName> {
  const filenames = await glob(`${toPosix(dirname)}/*.*.*.md`)

  const result: TypeDocFilenamesByModuleNameAndReflectionName = {}

  for (const filename of filenames) {
    const { moduleName, reflectionName } = decomposeTypeDocFilename(filename)
    const moduleFilenames = result[moduleName] ?? (result[moduleName] = {})
    if (moduleFilenames[reflectionName]) {
      throw new Error(`Unexpected duplicate refection '${reflectionName}'`)
    }
    moduleFilenames[reflectionName] = filename
  }

  return result
}

/** string or Function */
export type ReflectionRef = string | { name: string }

export function getReflectionNameFromRef(reflectionRef: ReflectionRef): string {
  return typeof reflectionRef === 'string' ? reflectionRef : reflectionRef.name
}

export type GetTypeDocFilename = (
  moduleName: string,
  reflectionRef: ReflectionRef,
) => string

export async function getTypeDocFilename(
  dirname: string,
): Promise<GetTypeDocFilename> {
  const filenames = await retrieveTypeDocFilenames(dirname)

  return function (moduleName: string, reflectionRef: ReflectionRef): string {
    const reflectionName = getReflectionNameFromRef(reflectionRef)

    return (
      filenames[moduleName]?.[reflectionName] ??
      throwError(
        `There's no typedoc file for '${reflectionName}' in module '${moduleName}'.`,
      )
    )
  }
}

export class MarkdownCompositionTypeDoc extends MarkdownComposition {
  readonly getTypeDocFilename: GetTypeDocFilename
  readonly defaultModuleName: undefined | string

  constructor(
    args: MarkdownCompositionConstructorArgs & {
      getTypeDocFilename: GetTypeDocFilename
      defaultModuleName?: undefined | string
    },
  ) {
    super(args)
    this.getTypeDocFilename = args.getTypeDocFilename
    this.defaultModuleName = args.defaultModuleName
  }

  appendTypeDocFile(
    filename: string,
    options?:
      | undefined
      | ({
          title?: undefined | PhrasingContent[]
        } & Omit<MarkdownCompositionAppendOptions, 'filename'>),
  ): this {
    this.appendMarkdownFile(filename, {
      ...options,
      preprocessNewRootContents: [
        removeModulePrefixFromLinkText,
        dropTextBeforeHeading,
        ...(options?.title ? [overrideTitle(options.title)] : []),
        ...(options?.preprocessNewRootContents ?? []),
      ],
    })

    return this
  }

  appendReflectionDocFile(
    reflectionRef: ReflectionRef,
    options?:
      | undefined
      | ({
          title?: undefined | PhrasingContent[]
          moduleName?: undefined | string
        } & Omit<MarkdownCompositionAppendOptions, 'filename'>),
  ): this {
    const moduleName =
      options?.moduleName ??
      this.defaultModuleName ??
      throwError('missing module name')

    const filename = this.getTypeDocFilename(moduleName, reflectionRef)

    const title = options?.title ?? [
      { type: 'inlineCode', value: getReflectionNameFromRef(reflectionRef) },
    ]

    this.appendTypeDocFile(filename, { ...options, title })

    return this
  }
}
