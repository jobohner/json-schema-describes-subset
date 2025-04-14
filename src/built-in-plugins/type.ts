import type { JSONSchema } from '../json-schema/index.js'
import isString from 'lodash/isString.js'

import {
  AllOfSchema,
  AtomicSchemaObject,
  NotSchema,
  type LogicalCombination,
  type LogicalCombinationOfLiterals,
} from '../atomic-schema/index.js'
import { type ExtractionPlugin } from '../plugin/index.js'
import {
  allJSONSchemaTypes,
  filterJSONSchemaTypes,
  isJSONSchemaType,
  getOtherJSONSchemaTypes,
  type JSONSchemaType,
} from '../json-schema-type/index.js'

export class MultipleOfAtomicSchema extends AtomicSchemaObject {
  constructor(public readonly multipleOf: number) {
    super()
  }

  negate(): LogicalCombinationOfLiterals {
    return new AllOfSchema([
      new NotSchema(this),
      /* actually redundant, but makes checking for contradictions easier */
      new TypeAtomicSchema('number'),
    ])
  }

  toJSONSchema(): { multipleOf: number } {
    return { multipleOf: this.multipleOf }
  }
}

export class TypeAtomicSchema extends AtomicSchemaObject {
  readonly type: readonly JSONSchemaType[]

  constructor(type?: string | string[] | undefined) {
    super()

    if (Array.isArray(type)) {
      const validTypes = filterJSONSchemaTypes(type)

      if (validTypes.length === 0) {
        /* invalid input => no restriction */
        this.type = allJSONSchemaTypes
      } else {
        this.type = validTypes
      }
    } else if (isJSONSchemaType(type)) {
      this.type = [type]
    } else {
      /* invalid input => no restriction */
      this.type = allJSONSchemaTypes
    }
  }

  negate(): false | TypeAtomicSchema {
    const otherTypes = getOtherJSONSchemaTypes(this.type)
    if (otherTypes.length === 0) {
      return false
    }
    return new TypeAtomicSchema(otherTypes)
  }

  toJSONSchema(): { type: JSONSchemaType[] } {
    return { type: [...this.type] }
  }
}

export function getTypeArray(schema: JSONSchema & object): string[] {
  if (Array.isArray(schema.type)) {
    return schema.type.filter(isString)
  } else if (typeof schema.type === 'string') {
    return [schema.type]
  } else {
    return []
  }
}

export function typeArrayToLogicalCombination(
  typeArray: string[],
): LogicalCombination {
  if (typeArray.length === 0) {
    return true
  }

  if (typeArray.includes('integer')) {
    return new AllOfSchema([
      new TypeAtomicSchema([...typeArray, 'number']),
      new MultipleOfAtomicSchema(1),
    ])
  }

  return new TypeAtomicSchema(typeArray)
}

export const typeExtraction: ExtractionPlugin = {
  extract: ({ schema }) => {
    const typeArray = getTypeArray(schema)

    /* This feature used to be a separate plugin, and it doesn't feel  right to
     * always include it, but since this project currently uses ajv under the
     * hood, it should behave the same way, even if `nullable` is non standard.
     */
    if (schema.nullable === true) {
      typeArray.push('null')
    }

    return typeArrayToLogicalCombination(typeArray)
  },
}
