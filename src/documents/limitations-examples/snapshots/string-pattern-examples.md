```typescript
schemaDescribesSubset(
  // potentialSubsetSchema:
  { pattern: '^[abc]{3}$' },
  // potentialSupersetSchema:
  { pattern: '^[abc]{2,3}$' },
) // returns `null`
```

This returns **`null`** even though the schema `{ pattern: '^[abc]{3}$' }` does
in fact describe a subset of the set of values that satisfy
`{ pattern: '^[abc]{2,3}$' }`, but this is not determined by
`schemaDescribesSubset`, since unequal patterns aren't analyzed any further.

In some cases it is possible to receive an unambiguous result by creating the
schemas in a way where equal patterns appear in both schemas:

```typescript
schemaDescribesSubset(
  // potentialSubsetSchema:
  { pattern: '^[abc]{3}$' },
  // potentialSupersetSchema:
  { anyOf: [{ pattern: '^[abc]{2}$' }, { pattern: '^[abc]{3}$' }] },
) // returns `true`
```

This `potentialSupersetSchema` is equivalent to the one in the previous example,
but shares a pattern with the `potentialSubsetSchema` and therefore `true` can
be determined as the result.

Also, constant values might be tested against patterns, so that the following
returns `true`:

```typescript
schemaDescribesSubset(
  // potentialSubsetSchema:
  { required: ['a', 'aa'], maxProperties: 2 },
  // potentialSupersetSchema:
  { propertyNames: { pattern: '^a+$' } },
) // returns `true`
```
