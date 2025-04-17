import _addFormats, { type FormatName } from 'ajv-formats'
import intersection from 'lodash/intersection.js'

import {
  AllOfSchema,
  AtomicSchemaObject,
  NotSchema,
  type LogicalCombination,
  type LogicalCombinationOfLiterals,
} from '../../atomic-schema/index.js'
import {
  MultipleOfAtomicSchema,
  TypeAtomicSchema,
} from '../../built-in-plugins/type.js'
import type {
  ConjunctionSchema,
  ExtractionPlugin,
  SimplificationPlugin,
  ValidationPlugin,
} from '../../plugin/index.js'
import {
  MaximumAtomicSchema,
  MinimumAtomicSchema,
} from '../../built-in-plugins/index.js'
import type {
  toDNF, // eslint-disable-line @typescript-eslint/no-unused-vars
} from '../../dnf/index.js'

// workaround (https://github.com/microsoft/TypeScript/issues/50058#issuecomment-1297806160)
const addFormats = _addFormats as unknown as typeof _addFormats.default

export const stringFormatNames = [
  'date',
  'time',
  'date-time',
  'iso-time',
  'iso-date-time',
  'duration',
  'uri-reference',
  'uri-template',
  'uri',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'regex',
  'uuid',
  'json-pointer',
  'relative-json-pointer',
  'byte',
  /* there are no checks for 'password' or 'binary' => no need to add them */
  // 'password',
  // 'binary',
] as const satisfies FormatName[]

export type StringFormatName = (typeof stringFormatNames)[number]

export class StringFormatAtomicSchema<
  FormatName_ extends StringFormatName = StringFormatName,
> extends AtomicSchemaObject {
  constructor(readonly format: FormatName_) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('string'),
    ])
  }

  toJSONSchema(): { format: FormatName_ } {
    return { format: this.format }
  }
}

// TODO: derive further atomic schemas from format, e. g. `minLength`
export const stringFormatLogicalCombinations: Record<
  StringFormatName,
  LogicalCombination
> = Object.fromEntries([
  ...stringFormatNames.map((formatName) => [
    formatName,
    new StringFormatAtomicSchema(formatName),
  ]),
])

export const numberFormatLogicalCombinations = {
  // number formats according to the checks in ajv-formats => no need to add
  // `'float'` or `'double'` as format
  int32: new AllOfSchema([
    new MultipleOfAtomicSchema(1),
    new MinimumAtomicSchema(-(2 ** 31)),
    new MaximumAtomicSchema(2 ** 31 - 1),
  ]),
  int64: new MultipleOfAtomicSchema(1),
} as const satisfies Partial<Record<FormatName, LogicalCombination>>

const formatLogicalCombinations: Record<string, LogicalCombination> = {
  ...stringFormatLogicalCombinations,
  ...numberFormatLogicalCombinations,
}

export const formatExtractionPlugin: ExtractionPlugin = {
  extract: ({ schema }): LogicalCombination => {
    return (
      typeof schema.format !== 'string' ||
      (formatLogicalCombinations[schema.format] ?? true)
    )
  },
}

export const formatValidationPlugin: ValidationPlugin = {
  modifyAjv(ajv): void {
    addFormats(ajv, {
      formats: Object.keys(formatLogicalCombinations) as FormatName[],
      mode: 'full',
      keywords: false, // currently no support for ranges
    })
  },
}

export type FormatConjunctionSchema<FormatName extends string = string> = {
  allOf?: (
    | {
        format: FormatName
      }
    | { not: { format: FormatName } }
  )[]
}

export type FormatSimplificationPlugin = SimplificationPlugin<
  'string',
  FormatConjunctionSchema<StringFormatName>,
  never
>

export const formatSimplificationPlugin: FormatSimplificationPlugin = {
  appliesToJSONSchemaType: 'string',
  mergeableKeywords: [],
  simplify({
    atomicSchemasByConstructor,
    negatedAtomicSchemasByConstructor,
  }): ConjunctionSchema<FormatConjunctionSchema<StringFormatName>> {
    const formats = atomicSchemasByConstructor
      .get(StringFormatAtomicSchema)
      .map(({ format }) => format)
    const negatedFormats = negatedAtomicSchemasByConstructor
      .get(StringFormatAtomicSchema)
      .map(({ format }) => format)

    if (intersection(formats, negatedFormats).length > 0) {
      return false
    }

    return {
      allOf: [
        ...formats.map((format) => ({ format })),
        ...negatedFormats.map((format) => ({ not: { format } })),
      ],
    }
  },
}

export type FormatPlugin = [
  ValidationPlugin,
  ExtractionPlugin,
  FormatSimplificationPlugin,
]

/**
 * Adds support for the `format` values provided by
 * [`ajv-formats`](https://ajv.js.org/packages/ajv-formats.html).
 *
 * `format`s that apply to strings are only compared for equality, so that only
 * schemas like
 *
 * ```json
 * {
 *   "allOf": [
 *     { "format": "email" },
 *     { "not": { "format": "email" } }
 *   ]
 * }
 * ```
 *
 * include a [contradiction](/src/documents/contradictions.md).
 *
 * `format`s that apply to numbers are transformed to equivalent
 * {@link AtomicSchemaObject}s like {@link MultipleOfAtomicSchema},
 * {@link MinimumAtomicSchema} or {@link MaximumAtomicSchema}.
 *
 * @example
 *
 * {@includeCode ./examples/snapshots/format-plugin-0.example.ts}
 *
 * @privateRemarks
 * TODO: return type of {@link toDNF}
 */
export const formatPlugin: FormatPlugin = [
  formatValidationPlugin,
  formatExtractionPlugin,
  formatSimplificationPlugin,
]
