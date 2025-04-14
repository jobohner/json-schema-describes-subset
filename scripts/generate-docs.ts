/**
 * Generates documentation files from various sources.
 *
 * Links to entities that are not contained in the files outlined below point to
 * the respective position in the source code.
 *
 * @module
 */

import fs from 'fs/promises'
import path from 'path'

import endent_ from 'endent'
import { Application } from 'typedoc'
import { rimraf } from 'rimraf'
import includes from 'lodash/includes.js'

import packageJSON from '../package.json' with { type: 'json' }

import { writeFormattedFile } from '../src/utils/format/index.js'
import { throwError } from '../src/utils/type-guards/index.js'

import {
  schemaDescribesEmptySet,
  schemaDescribesSubset,
  schemaDescribesUniverse,
  schemasAreEquivalent,
  toDNF,
} from '../src/index.js'

import {
  builtInExtractionPlugins,
  builtInSimplificationPlugins,
} from '../src/built-in-plugins/index.js'
import * as builtInPluginExports from '../src/built-in-plugins-collection.js'

import { createContributorsSection } from './utils/contributors.js'
import {
  extractLeadTextThrow,
  MarkdownCompositions,
  fromMarkdown,
  toMarkdown,
} from './utils/mdast-utils.js'
import {
  createListOfAllLinks,
  createTypeDocOptions,
  MarkdownCompositionTypeDoc,
  extractDescriptionForPackageJSONThrow,
  remapURLToSrc as remapURLToSrc_,
  getTypeDocFilename as getTypeDocFilename_,
} from './utils/typedoc-composition.js'
import { toPosix } from '../src/utils/to-posix/index.js'
import {
  docsDirname,
  projectDocumentsDirname,
  readmeFilename,
  reflectionsJSONFilename,
  rootDirname,
  srcDirname,
  tmpDocsDirname,
  tmpDocsRootRelativeURL,
  tsConfigBuildFilename,
} from '../filenames.js'

// workaround (https://github.com/microsoft/TypeScript/issues/50058#issuecomment-1297806160)
// AND
// tsx seems to not to be able to resolve this correctly
const endent: typeof endent_.default = endent_.default ?? endent_

const indexModuleName = 'index'
const customPluginsModuleName = 'custom-plugins'
const builtInPluginsCollectionModuleName = 'built-in-plugins-collection'
const builtInPluginsCollectionModuleFilePath = path.join(
  srcDirname,
  `${builtInPluginsCollectionModuleName}.ts`,
)

// const moduleNames = [indexModuleName, customPluginsModuleName] as const

const app = await Application.bootstrapWithPlugins({
  ...createTypeDocOptions(rootDirname, tmpDocsDirname, reflectionsJSONFilename),
  entryPoints: [
    path.join(srcDirname, `${indexModuleName}.ts`),
    path.join(srcDirname, customPluginsModuleName, `index.ts`),
    builtInPluginsCollectionModuleFilePath,
  ].map(toPosix),
  tsconfig: tsConfigBuildFilename,
  projectDocuments: [path.join(projectDocumentsDirname, '*.md')].map(toPosix),
})

const project = (await app.convert()) ?? throwError(`Unable to convert app.`)

await app.generateOutputs(project)

const getTypeDocFilename = await getTypeDocFilename_(tmpDocsDirname)

await rimraf(docsDirname)
await fs.mkdir(docsDirname)

const readmeComposition = new MarkdownCompositionTypeDoc({
  rootDirname,
  targetFilename: readmeFilename,
  getTypeDocFilename,
  defaultModuleName: indexModuleName,
})
  .appendMarkdownText(
    endent`
    # ${packageJSON.name}

    \`${packageJSON.version}\`
    `,
  )
  .appendMarkdownFile(path.join(tmpDocsDirname, `${indexModuleName}.md`), {
    preprocessNewRootContents: [extractLeadTextThrow],
  })
  .appendMarkdownText(
    endent`
    # Installation

    \`\`\`console
    npm install ${packageJSON.name}
    \`\`\`
    `,
  )
  // TODO: merge into one terminology.md when fragment links are possible
  .appendMarkdownText('# Terminology')
  .appendTypeDocFile(
    path.join(tmpDocsDirname, 'Document.discriminative-functions.md'),
    { headingsDepthOffset: 1 },
  )
  .appendTypeDocFile(path.join(tmpDocsDirname, 'Document.contradictions.md'), {
    headingsDepthOffset: 1,
  })
  .appendTypeDocFile(path.join(tmpDocsDirname, 'Document.subschema.md'), {
    headingsDepthOffset: 1,
  })
  .appendReflectionDocFile(schemaDescribesSubset)
  .appendReflectionDocFile('JSONSchema')
  .appendReflectionDocFile('Options')
  .appendTypeDocFile(path.join(tmpDocsDirname, 'Document.limitations.md'))
  .appendReflectionDocFile(schemaDescribesEmptySet)
  .appendReflectionDocFile(toDNF)
  .appendReflectionDocFile(schemasAreEquivalent)
  .appendReflectionDocFile(schemaDescribesUniverse)
  .appendMarkdownText(
    endent`
    # Contributors

    ${createContributorsSection([
      packageJSON.author,
      // ...packageJSON.contributors,
    ])}

    # License

    [${packageJSON.license}](/LICENSE)
    `,
  )

function mapURLConsts(url: string): string {
  if (url === '/BUGS_URL') {
    return packageJSON.bugs.url
  }

  return url
}

const remapURLToSrc = remapURLToSrc_({
  tmpDocsRootRelativeURL,
  reflectionsJSON: JSON.parse(
    await fs.readFile(reflectionsJSONFilename, 'utf-8'),
  ),
})

export function mapURLConstsAndToSrc(url: string): string {
  return remapURLToSrc(mapURLConsts(url))
}

const customizationComposition = new MarkdownCompositionTypeDoc({
  rootDirname,
  targetFilename: path.join(docsDirname, 'customization.md'),
  getTypeDocFilename,
  defaultModuleName: indexModuleName,
})
  .appendMarkdownText(`# Customization with plugins`)
  .appendReflectionDocFile('Plugin')
  .appendReflectionDocFile('ValidationPlugin')
  .appendReflectionDocFile('ExtractionPlugin')
  .appendReflectionDocFile('SimplificationPlugin')
  .appendReflectionDocFile('SimplificationPluginArguments', {
    headingsDepthOffset: 1,
  })
  .appendMarkdownText(`# Predefined custom plugins`)
  .appendReflectionDocFile('formatPlugin', {
    moduleName: customPluginsModuleName,
    headingsDepthOffset: 1,
  })

const builtInPluginsComposition = new MarkdownCompositionTypeDoc({
  rootDirname,
  targetFilename: path.join(docsDirname, 'built-in-plugins.md'),
  remapURLFrom: path.join(
    tmpDocsDirname,
    `${builtInPluginsCollectionModuleName}.md`,
  ),
  getTypeDocFilename,
  defaultModuleName: indexModuleName,
})
  .appendMarkdownText(`# Built in plugins`)
  .appendMarkdownFile(
    path.join(tmpDocsDirname, `${builtInPluginsCollectionModuleName}.md`),
    {
      preprocessNewRootContents: [extractLeadTextThrow],
    },
  )

const builtInExtractionPluginsArray = Object.values(builtInExtractionPlugins)
builtInPluginsComposition.appendMarkdownText(`# Built in \`ExtractionPlugin\`s`)
for (const [name, value] of Object.entries(builtInPluginExports)) {
  if (includes(builtInExtractionPluginsArray, value)) {
    builtInPluginsComposition.appendReflectionDocFile(name, {
      headingsDepthOffset: 1,
    })
  }
}

const builtInSimplificationPluginsArray = Object.values(
  builtInSimplificationPlugins,
)
builtInPluginsComposition.appendMarkdownText(
  `# Built in \`SimplificationPlugin\`s`,
)
for (const [name, value] of Object.entries(builtInPluginExports)) {
  if (includes(builtInSimplificationPluginsArray, value)) {
    builtInPluginsComposition.appendReflectionDocFile(name, {
      headingsDepthOffset: 1,
    })
  }
}

const compositions = new MarkdownCompositions(
  [builtInPluginsComposition, customizationComposition, readmeComposition],
  mapURLConstsAndToSrc,
)

export const urlMap = await compositions.getURLMap()

const rootNodesByFilename = await compositions.getRootNodes()

await Promise.all([
  ...Object.entries(rootNodesByFilename).map(([filename, rootNode]) =>
    writeFormattedFile(filename, toMarkdown(rootNode)),
  ),

  writeFormattedFile(
    path.join(rootDirname, 'test', 'docs-urls-for-manual-review.md'),
    toMarkdown({
      type: 'root',
      children: [
        ...fromMarkdown(endent`
          # Docs urls for manual review
    
          The following is an automatically generated list of all urls linked in
          any of the documentation files, so they can be checked manually.
          `).children,
        createListOfAllLinks(rootDirname, rootNodesByFilename),
      ],
    }),
  ),

  writeFormattedFile(
    path.join(rootDirname, 'package.json'),
    JSON.stringify({
      ...packageJSON,
      description: extractDescriptionForPackageJSONThrow(
        await readmeComposition.getRootNode(),
      ),
    }),
  ),
])
