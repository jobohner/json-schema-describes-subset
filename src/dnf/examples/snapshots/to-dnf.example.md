```typescript
import { toDNF } from 'json-schema-describes-subset'

console.log(
  toDNF({
    anyOf: [{ minimum: 2 }, { exclusiveMinimum: 1 }],
  }),
)
```

logs:

```json
{
  "anyOf": [
    { "const": null },
    { "const": true },
    { "const": false },
    { "type": "number", "minimum": 1, "allOf": [{ "not": { "const": 1 } }] },
    { "type": "string" },
    { "type": "array" },
    { "type": "object" }
  ]
}
```

---

```typescript
import { toDNF } from 'json-schema-describes-subset'

console.log(
  toDNF({
    anyOf: [{ multipleOf: 2 }, { multipleOf: 3 }, { multipleOf: 4 }],
  }),
)
```

logs:

```json
{
  "anyOf": [
    { "const": null },
    { "const": true },
    { "const": false },
    { "type": "number", "multipleOf": 2 },
    { "type": "number", "multipleOf": 3 },
    { "type": "string" },
    { "type": "array" },
    { "type": "object" }
  ]
}
```
