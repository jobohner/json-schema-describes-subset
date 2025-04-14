// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ObjectKey = keyof any

export type Prettify<Type> = {
  [Key in keyof Type]: Type[Key]
} & unknown

/** Any key in each union operand. */
export type ObjectUnionKey<Type> = Type extends unknown ? keyof Type : never

export type ReadonlyDeep<Type> = Type extends (
  ...args: infer Args
) => infer Result
  ? ((...args: Args) => Result) & NonFunctionReadonlyDeep<Type>
  : NonFunctionReadonlyDeep<Type>

type NonFunctionReadonlyDeep<Type> = {
  readonly [Key in keyof Type]: Type[Key] extends number | string | symbol
    ? Readonly<Type[Key]>
    : ReadonlyDeep<Type[Key]>
}

export type PartiallyUndefined<Type> = {
  [Key in keyof Type]?: Type[Key] | undefined
}

export type RequiredDefined<Type> = {
  [Key in keyof Type]-?: Exclude<Type[Key], undefined>
}

export type RequiredDefinedDeep<Type> = {
  [Key in keyof Type]-?: Exclude<Type[Key], undefined> extends
    | number
    | string
    | symbol
    ? Exclude<Type[Key], undefined>
    : RequiredDefinedDeep<Exclude<Type[Key], undefined>>
}

export type RequiredKey<ObjectType> = {
  [Key in keyof ObjectType]-?: object extends Pick<ObjectType, Key>
    ? never
    : string extends Key
      ? never
      : Key
}[keyof ObjectType]

export type OptionalKey<ObjectType> = {
  [Key in keyof ObjectType]-?: object extends Pick<ObjectType, Key>
    ? Key
    : string extends Key
      ? Key
      : never
}[keyof ObjectType]

export type StringToNumber<Value> =
  Extract<Value, `${number}`> extends `${infer N extends number}` ? N : never

export type TupleIndices<TupleType extends readonly unknown[]> = StringToNumber<
  keyof TupleType
>

export type FilteredTuple<
  TupleType extends readonly unknown[],
  FilteredType,
> = TupleType extends [infer First, ...infer Rest]
  ? First extends FilteredType
    ? [First, ...FilteredTuple<Rest, FilteredType>]
    : FilteredTuple<Rest, FilteredType>
  : []

export function mapTuple<
  const Tuple extends readonly unknown[],
  const CallbackFunction extends (
    value: Tuple[number],
    index: number,
    array: Tuple,
  ) => unknown,
>(
  tuple: Tuple,
  callbackFunction: CallbackFunction,
): { [Key in keyof Tuple]: ReturnType<CallbackFunction> } {
  return tuple.map((value, index) => callbackFunction(value, index, tuple)) as {
    [Key in keyof Tuple]: ReturnType<CallbackFunction>
  }
}

export type UnknownProperties<Type> = {
  [Key in keyof Type]: Type[Key] | unknown
} & Record<string, unknown>

// type Entry = [ObjectKey, unknown]

// type ObjectFromEntries<Entry_ extends Entry> = Prettify<{
//   [Key in Entry_[0]]?: Entry_ extends [infer EntryKey, infer EntryValue]
//     ? Key extends EntryKey
//       ? EntryValue
//       : never
//     : never
// }>

// export function objectFromEntries<const Entry_ extends Entry>(
//   entries: Entry_[],
// ): ObjectFromEntries<Entry_> {
//   return Object.fromEntries(entries) as ObjectFromEntries<Entry_>
// }

export type PredicateIsType<FunctionType> = FunctionType extends (
  value: unknown,
) => value is infer Type
  ? Type
  : never
