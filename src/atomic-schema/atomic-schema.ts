import type { JSONSchema } from '../json-schema/index.js'

export abstract class AtomicSchemaObject {
  abstract negate(): LogicalCombinationOfLiterals

  abstract toJSONSchema(): JSONSchema
}

export type AtomicSchema = boolean | AtomicSchemaObject

export function isAtomicSchema(schema: unknown): schema is AtomicSchema {
  return typeof schema === 'boolean' || schema instanceof AtomicSchemaObject
}

export type LogicLiteral = AtomicSchema | NotSchema<AtomicSchemaObject>

export function isLogicLiteral(schema: unknown): schema is LogicLiteral {
  return (
    isAtomicSchema(schema) ||
    (schema instanceof NotSchema && isAtomicSchema(schema.not))
  )
}

export type LogicalCombination =
  | AtomicSchema
  | NotSchema
  | AllOfSchema
  | AnyOfSchema

export function toJSONSchema(schema: LogicalCombination): JSONSchema {
  if (typeof schema === 'boolean') return schema
  return schema.toJSONSchema()
}

/** Like {@link LogicalCombination}, but `NOT`s are exclusively in the literals */
export type LogicalCombinationOfLiterals =
  | LogicLiteral
  | AllOfSchema<LogicalCombinationOfLiterals>
  | AnyOfSchema<LogicalCombinationOfLiterals>

export function negateAtomicSchema(
  schema: AtomicSchema,
): LogicalCombinationOfLiterals {
  if (typeof schema === 'boolean') {
    return !schema
  }

  return schema.negate()
}

export class NotSchema<Schema extends LogicalCombination = LogicalCombination> {
  constructor(public readonly not: Schema) {}

  toJSONSchema(): { not: JSONSchema } {
    return { not: toJSONSchema(this.not) }
  }
}

export class AllOfSchema<
  Schema extends LogicalCombination = LogicalCombination,
> {
  public readonly allOf: readonly Schema[]

  constructor(allOf: Schema[]) {
    this.allOf = [...allOf]
  }

  toJSONSchema(): { allOf: JSONSchema[] } {
    return { allOf: this.allOf.map(toJSONSchema) }
  }
}

export class AnyOfSchema<
  Schema extends LogicalCombination = LogicalCombination,
> {
  public readonly anyOf: readonly Schema[]

  constructor(anyOf: Schema[]) {
    this.anyOf = [...anyOf]
  }

  toJSONSchema(): { anyOf: JSONSchema[] } {
    return { anyOf: this.anyOf.map(toJSONSchema) }
  }
}
