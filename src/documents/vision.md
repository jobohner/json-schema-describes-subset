# Vision

This project is under active development. The following tries to deliver an idea
of what future changes might (or might not) include.

## What this project does _not_ try to achieve

The following does not fall within this project's scope:

- Create a JSON Schema validation tool

  There already are good validation solutions. For this project
  [Ajv](https://ajv.js.org/json-schema.html#draft-2020-12) is used internally
  for validation. This is regarded by of this project's functions. For example,
  if {@link index!schemaDescribesEmptySet} returns true, there isn't any value
  that would satisfy the schema according to Ajv.

  (Technically it would actually be fairly easy to switch to another validation
  solution)

- Support of older JSON Schema drafts

  This project tries to always support the latest JSON Schema draft (currently
  2020-12). You could try to convert your schemas that are built according to an
  older draft before passing them to any of this project's functions using a
  tool like [alterschema](https://github.com/sourcemeta-research/alterschema).

## What this project _does_ try to achieve

The main focus of this project is its eponymous function {@link
index!schemaDescribesSubset}. A major goal is to minimize
[false negative (`null`) results](./limitations.md) while simultaneously making
sure that a boolean result is always true positive/true negative. One way to get
closer to that goal is to add or optimize support for
[standard keywords](./limitations.md#currently-unsupported-keywords).

Additional {@link custom-plugins predefined custom plugins} might be added to
support more non standard keywords, if they are very common.

Another goal is to increase the number of cases where a boolean result is
returned.
