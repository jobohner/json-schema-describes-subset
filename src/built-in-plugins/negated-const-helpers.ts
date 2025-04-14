import type { JSONSchema } from '../json-schema/index.js'
import type { InstancesByConstructor } from '../utils/instances-by-constructor/index.js'
import { ConstAtomicSchema } from './const.js'

export function getNegatedConstValuesFromNegatedAtomicSchemasByConstructor<
  ConstType,
>(
  negatedAtomicSchemasByConstructor: InstancesByConstructor,
  filterPredicate: (
    value: unknown,
    index: number,
    array: unknown[],
  ) => value is ConstType,
): ConstType[] {
  return negatedAtomicSchemasByConstructor
    .get(ConstAtomicSchema)
    .map((schema) => schema.const)
    .filter(filterPredicate)
}

export function getUniqueNegatedConstSchemas<ConstType>(
  schemaDescribesEmptySet: (schema: JSONSchema) => boolean | null,
  negatedConstValues: ConstType[],
): { not: { const: ConstType } }[] {
  return negatedConstValues
    .filter((constValue, index, array) => {
      const previousConstValues = array.slice(0, index)

      const constValuesAreEqual = previousConstValues.some(
        (previousConstValue) =>
          schemaDescribesEmptySet({
            const: constValue,
            not: { const: previousConstValue },
          }),
      )

      return !constValuesAreEqual
    })
    .map((constValue) => ({
      not: { const: constValue },
    }))
}

export function getUniqueNegatedConstSchemasFromNegatedAtomicSchemasByConstructor<
  ConstType,
>(
  schemaDescribesEmptySet: (schema: JSONSchema) => boolean | null,
  negatedAtomicSchemasByConstructor: InstancesByConstructor,
  filterPredicate: (
    value: unknown,
    index: number,
    array: unknown[],
  ) => value is ConstType,
): { not: { const: ConstType } }[] {
  return getUniqueNegatedConstSchemas(
    schemaDescribesEmptySet,
    getNegatedConstValuesFromNegatedAtomicSchemasByConstructor(
      negatedAtomicSchemasByConstructor,
      filterPredicate,
    ),
  )
}
