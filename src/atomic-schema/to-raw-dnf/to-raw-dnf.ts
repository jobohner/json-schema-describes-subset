import {
  isLogicLiteral,
  AllOfSchema,
  AnyOfSchema,
  type LogicLiteral,
  type LogicalCombination,
  type LogicalCombinationOfLiterals,
  negateAtomicSchema,
  isAtomicSchema,
  NotSchema,
} from '../atomic-schema.js'

export type ConjunctionOfLiterals = AllOfSchema<LogicLiteral>

/** DNF without simplifications using the internal {@link LogicLiteral} */
export type RawDNF = AnyOfSchema<ConjunctionOfLiterals>

export function negate(
  schema: LogicalCombination,
): LogicalCombinationOfLiterals {
  if (isAtomicSchema(schema)) {
    /* this shoulf be called only once */
    return negateAtomicSchema(schema)
  }

  if (schema instanceof AllOfSchema) {
    return new AnyOfSchema(schema.allOf.map(negate))
  }

  if (schema instanceof AnyOfSchema) {
    return new AllOfSchema(schema.anyOf.map(negate))
  }

  // => schema instanceof NotSchema
  return moveNotsToLiterals(schema.not)
}

/**
 * Makes all the `not`s move down, so that `NOT`s are exclusively in the
 * literals. `NOT`s are then resolved by applying {@link negateAtomicSchema}.
 */
export function moveNotsToLiterals(
  schema: LogicalCombination,
): LogicalCombinationOfLiterals {
  if (schema instanceof AllOfSchema) {
    return new AllOfSchema(schema.allOf.map(moveNotsToLiterals))
  }

  if (schema instanceof AnyOfSchema) {
    return new AnyOfSchema(schema.anyOf.map(moveNotsToLiterals))
  }

  if (schema instanceof NotSchema) {
    return negate(schema.not)
  }

  // schema is AtomicSchema
  return schema
}

/**
 * Also considered DNF but is not complete as the type {@link RawDNF} which is
 * always an `OR` of `AND`s of `LogicLiteral`s.
 */
type RawDNFPart = RawDNF | ConjunctionOfLiterals | LogicLiteral

/** Moves `AND`s down and `OR`s up to create the RawDNF. */
export function logicalCombinationOfLiteralsToRawDNFPart(
  schema: LogicalCombinationOfLiterals,
): RawDNFPart {
  if (schema instanceof AnyOfSchema) {
    return new AnyOfSchema(
      schema.anyOf
        .map(logicalCombinationOfLiteralsToRawDNFPart)
        .map((subschema): ConjunctionOfLiterals[] => {
          if (subschema instanceof AnyOfSchema) {
            /* anyOf as child of anyOf => flat */
            return [...subschema.anyOf]
          }

          if (isLogicLiteral(subschema)) {
            /* logicLiteral as child of anyOf => insert allOf */
            return [new AllOfSchema([subschema])]
          }

          /* subschema is already a ConjunctionOfLiterals */
          return [subschema]
        })
        .flat(),
    )
  }

  if (schema instanceof AllOfSchema) {
    const children = schema.allOf.map(logicalCombinationOfLiteralsToRawDNFPart)

    const dnfs: RawDNF[] = []
    const logicLiterals: LogicLiteral[] = []
    for (const child of children) {
      if (child instanceof AllOfSchema) {
        logicLiterals.push(...child.allOf)
      } else if (child instanceof AnyOfSchema) {
        dnfs.push(child)
      } else {
        logicLiterals.push(child)
      }
    }

    if (dnfs.length === 0) {
      return new AllOfSchema(logicLiterals)
    }

    /* apply distributive property */

    type PlainArrayDNF = LogicLiteral[][]
    const plainArrayDNF: PlainArrayDNF = dnfs.reduce<PlainArrayDNF>(
      (acc, { anyOf }): PlainArrayDNF => {
        const result: PlainArrayDNF = []
        for (const { allOf } of anyOf) {
          for (const accItem of acc) {
            result.push([...allOf, ...accItem])
          }
        }
        return result
      },
      [logicLiterals],
    )

    return new AnyOfSchema(
      plainArrayDNF.map(
        (plainArrayConjunctionOfLiterals) =>
          new AllOfSchema(plainArrayConjunctionOfLiterals),
      ),
    )
  }

  // schema is LogicLiteral
  return schema
}

export function dnfPartToRawDNF(dnfPart: RawDNFPart): RawDNF {
  if (isLogicLiteral(dnfPart)) {
    return new AnyOfSchema([new AllOfSchema([dnfPart])])
  }

  if (dnfPart instanceof AllOfSchema) {
    return new AnyOfSchema([dnfPart])
  }

  return dnfPart
}

export function toRawDNF(schema: LogicalCombination): RawDNF {
  return dnfPartToRawDNF(
    logicalCombinationOfLiteralsToRawDNFPart(moveNotsToLiterals(schema)),
  )
}
