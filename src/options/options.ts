import includes from 'lodash/includes.js'

import type { JSONSchema } from '../json-schema/index.js'
import {
  getBuiltInExtractionPlugins,
  getBuiltInSimplificationPlugins,
  type BuiltInExtractionPluginOverrides,
  type BuiltInSimplificationPlugin,
  type BuiltInSimplificationPluginOverrides,
} from '../built-in-plugins/index.js'
import {
  pluginIsExtractionPlugin,
  pluginIsSimplificationPlugin,
  pluginIsValidationPlugin,
  type ExtractionPlugin,
  type SimplificationPlugin,
  type SimplificationPluginWithType,
  type ValidationPlugin,
  type Plugin,
} from '../plugin/index.js'
import { createValidate, type ValidateFunction } from '../validate/index.js'
import type { JSONSchemaType } from '../json-schema-type/index.js'
import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schemaDescribesSubset,
} from '../schema-describes-subset/index.js'
import type {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  schemasAreEquivalent,
} from '../derived/index.js'
import type {
  formatPlugin, // eslint-disable-line @typescript-eslint/no-unused-vars
} from '../custom-plugins/index.js'

export type Options = {
  /**
   * If a schema does not have an `$id` or the `$id` is a relative URI, a
   * `baseURI` can be provided in the `Options` object. For example, this could
   * be the schema's retrieval URI.
   *
   * Providing a non relative baseURI (either as part of the `Options` object or
   * `$id`) is important if the schema contains relative `$ref`s.
   *
   * In functions that accept more than one schema as arguments (like
   * {@link schemaDescribesSubset} or {@link schemasAreEquivalent}) `baseURI`
   * can be an array of strings which correspond to each schema.
   */
  baseURI?: string | (string | null | undefined)[] | undefined
  /**
   * Referenced schema resources (`$ref`) are not retrieved via their url. If a
   * referenced resource is not part of the schema itself, it needs to be
   * provided here.
   *
   * TODO: make this also accept an object with retrieval urls as keys. This
   * would also support referenced to boolean schemas better.
   */
  definitions?: /* Awkward `Exclude` on purpose instead of simply using
   * JSONSchemaObject. This will generate a better documentation,
   * since JSONSchema is well documented */
  Exclude<JSONSchema, boolean>[] | undefined
  /**
   * Support non standard custom keywords by adding {@link Plugin | plugins}.
   * There is one predefined custom plugin: {@link formatPlugin}.
   */
  plugins?: Plugin[] | undefined
}

export type OptionsPlugin<Options_ extends Options | undefined> =
  | OptionsSimplificationPlugin<Options_>
  | ExtractionPlugin
  | ValidationPlugin

export function getOptionsPlugins<const Options_ extends Options | undefined>(
  options: Options_,
): OptionsPlugin<Options_>[] {
  return (options?.plugins ?? []).flat() as OptionsPlugin<Options_>[]
}

export type ExtractSimplificationPlugin<Plugins> = Plugins extends
  | Plugin[]
  | undefined
  ? Extract<FlatArray<Exclude<Plugins, undefined>, 1>, SimplificationPlugin>
  : SimplificationPlugin

export type OptionsSimplificationPlugin<Options_> = Options_ extends undefined
  ? never
  : Options_ extends { plugins?: Plugin[] | undefined } | undefined
    ? ExtractSimplificationPlugin<Exclude<Options_, undefined>['plugins']>
    : SimplificationPlugin

export function getOptionsSimplificationPlugins<
  const Options_ extends Options | undefined,
>(options: Options_): OptionsSimplificationPlugin<Options_>[] {
  return getOptionsPlugins(options).filter(pluginIsSimplificationPlugin)
}

export type OptionsSimplificationPluginOverrides<Options_ extends Options> =
  Options_ extends {
    builtInPluginOverrides: {
      simplifications: infer SimplificationPluginOverrides extends
        BuiltInSimplificationPluginOverrides
    }
  }
    ? SimplificationPluginOverrides
    : object

/**
 * An internally used, differently structured version of {@link Options}.
 */
export interface InternalOptions<
  SimplificationPlugin_ extends SimplificationPlugin = SimplificationPlugin,
> {
  validate: ValidateFunction
  plugins: {
    extractions: ExtractionPlugin[]
    simplifications: (BuiltInSimplificationPlugin | SimplificationPlugin_)[]
  }
}

export function toInternalOptions<Options_ extends Options | undefined>(
  options: Options_,
): InternalOptions<OptionsSimplificationPlugin<Options_>> {
  return {
    validate: createValidate(
      (options?.plugins ?? []).flat().filter(pluginIsValidationPlugin),
      options?.definitions ?? [],
    ),
    plugins: {
      extractions: getBuiltInAndOptionsExtractionPlugins(options),
      simplifications: getBuiltInAndOptionsSimplificationPlugins(options),
    },
  }
}

export function getBuiltInAndOptionsExtractionPlugins(
  options: Options | undefined,
): ExtractionPlugin[] {
  const extractionPluginOverrides: BuiltInExtractionPluginOverrides = {}

  const extractionPlugins = getOptionsPlugins(options)
    .filter(pluginIsExtractionPlugin)
    .filter((plugin) => {
      if (plugin.overrides === undefined) {
        return true
      }

      extractionPluginOverrides[plugin.overrides] = plugin
      return false
    })

  return [
    ...getBuiltInExtractionPlugins(extractionPluginOverrides),
    ...extractionPlugins,
  ]
}

export type BuiltInOrOptionsSimplificationPlugin<
  Options_ extends Options | undefined,
> = BuiltInSimplificationPlugin | OptionsSimplificationPlugin<Options_>

export function getBuiltInAndOptionsSimplificationPlugins<
  Options_ extends Options | undefined,
>(options: Options_): BuiltInOrOptionsSimplificationPlugin<Options_>[] {
  const simplificationPluginOverrides: BuiltInSimplificationPluginOverrides = {}

  const simplificationPlugins = getOptionsSimplificationPlugins(options).filter(
    (plugin) => {
      if (plugin.overrides === undefined) {
        return true
      }

      simplificationPluginOverrides[plugin.overrides] = plugin
      return false
    },
  )

  const builtInSimplificationPlugins = getBuiltInSimplificationPlugins(
    simplificationPluginOverrides,
  )

  return [
    ...builtInSimplificationPlugins,
    ...simplificationPlugins,
  ] as BuiltInOrOptionsSimplificationPlugin<Options_>[]
}

export function getSimplificationPluginsForTypeFromInternalOptions<
  Type extends JSONSchemaType,
  SimplificationPlugin_ extends SimplificationPlugin,
>(
  options: InternalOptions<SimplificationPlugin_>,
  type: Type,
): SimplificationPluginWithType<SimplificationPlugin_, Type>[] {
  const simplificationPlugins = options.plugins.simplifications

  return simplificationPlugins.filter(
    (
      simplificationPlugin,
    ): simplificationPlugin is SimplificationPluginWithType<
      SimplificationPlugin_,
      Type
    > =>
      simplificationPlugin.appliesToJSONSchemaType === undefined ||
      simplificationPlugin.appliesToJSONSchemaType === type ||
      (Array.isArray(simplificationPlugin.appliesToJSONSchemaType) &&
        includes(simplificationPlugin.appliesToJSONSchemaType, type)),
  )
}
