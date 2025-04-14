/**
 * All internally used built in {@link ExtractionPlugin}s and
 * {@link SimplificationPlugin}s. They work just like the custom plugins which
 * are added to {@link Options.plugins}, but are used internally to create the
 * default behavior,
 *
 * There are no internally used built in {@link ValidationPlugin}s, because
 * without any custom plugins, default validation is desired.
 *
 * @module
 */

import {
  type ExtractionPlugin, // eslint-disable-line @typescript-eslint/no-unused-vars
  type SimplificationPlugin, // eslint-disable-line @typescript-eslint/no-unused-vars
  type ValidationPlugin, // eslint-disable-line @typescript-eslint/no-unused-vars
} from './plugin/index.js'
import {
  type Options, // eslint-disable-line @typescript-eslint/no-unused-vars
} from './options/index.js'

export {
  // extractions
  typeExtraction,
  notExtraction,
  allOfExtraction,
  anyOfExtraction,
  constExtraction,
  numberExtraction,
  stringExtraction,
  objectExtraction,
  arrayExtraction,
  ifThenElseExtraction,
  oneOfExtraction,
  refExtraction,
  // simplifications
  constSimplification,
  numberSimplification,
  stringSimplification,
  objectSimplification,
  arraySimplification,
  refSimplification,
} from './built-in-plugins/index.js'
