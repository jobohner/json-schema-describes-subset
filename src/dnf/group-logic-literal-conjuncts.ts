import intersection from 'lodash/intersection.js'

import { TypeAtomicSchema } from '../built-in-plugins/type.js'
import { NotSchema, type LogicLiteral } from '../atomic-schema/index.js'
import { InstancesByConstructor } from '../utils/instances-by-constructor/index.js'
import {
  allJSONSchemaTypes,
  type JSONSchemaType,
} from '../json-schema-type/index.js'

type LogicLiteralsByConstructor =
  | {
      atomicSchemasByConstructor: InstancesByConstructor
      negatedAtomicSchemasByConstructor: InstancesByConstructor
      types: JSONSchemaType[]
      booleanSchema?: undefined
    }
  | {
      atomicSchemasByConstructor?: undefined
      negatedAtomicSchemasByConstructor?: undefined
      types?: undefined
      booleanSchema: boolean
    }

export function groupLogicLiteralConjuncts(
  literals: readonly LogicLiteral[],
): LogicLiteralsByConstructor {
  const atomicSchemasByConstructor = new InstancesByConstructor()
  const negatedAtomicSchemasByConstructor = new InstancesByConstructor()

  let hasOnlyBooleanLiterals = true

  for (const literal of literals) {
    if (literal === false) {
      return { booleanSchema: false }
    }

    if (literal === true) {
      continue
    }

    hasOnlyBooleanLiterals = false

    if (literal instanceof NotSchema) {
      negatedAtomicSchemasByConstructor.push(literal.not)
    } else {
      atomicSchemasByConstructor.push(literal)
    }
  }

  const typeSchemas = atomicSchemasByConstructor.get(TypeAtomicSchema)

  /* delete type schemas, since this is returned separately */
  atomicSchemasByConstructor.delete(TypeAtomicSchema)

  const types =
    typeSchemas.length === 0
      ? [...allJSONSchemaTypes]
      : intersection(...typeSchemas.map(({ type }) => type))
  if (types.length === 0) {
    /* no possible type */
    return { booleanSchema: false }
  }

  if (hasOnlyBooleanLiterals) {
    return { booleanSchema: true }
  }

  return {
    atomicSchemasByConstructor,
    negatedAtomicSchemasByConstructor,
    types,
  }
}
