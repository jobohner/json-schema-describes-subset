import { schemaDescribesEmptySet } from 'json-schema-describes-subset'

console.log(schemaDescribesEmptySet(false))

console.log(
  schemaDescribesEmptySet(
    // this schema will accept anything that is not a number
    { minimum: 2, maximum: 1 },
  ),
)

console.log(
  schemaDescribesEmptySet({
    type: 'number',
    minimum: 2,
    maximum: 1,
  }),
)
