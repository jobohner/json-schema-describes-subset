import path from 'path'

import { getRootRelativeURLFromFilename } from './scripts/utils/url.js'

export const rootDirname = import.meta.dirname
export const srcDirname = path.join(rootDirname, 'src')

export const tmpDocsDirname = path.join(rootDirname, 'docs-tmp')
export const tmpDocsRootRelativeURL = getRootRelativeURLFromFilename(
  rootDirname,
  tmpDocsDirname,
)

export const reflectionsJSONFilename = path.join(
  tmpDocsDirname,
  'reflections.json',
)

export const projectDocumentsDirname = path.join(srcDirname, 'documents')
export const projectDocumentsRootRelativeURL = getRootRelativeURLFromFilename(
  rootDirname,
  projectDocumentsDirname,
)

export const tsConfigFilename = path.join(rootDirname, 'tsconfig.json')

export const tsConfigBuildFilename = path.join(
  rootDirname,
  'tsconfig-build.json',
)

export const docsDirname = path.join(rootDirname, 'docs')

export const readmeFilename: string = path.join(docsDirname, 'README.md')
