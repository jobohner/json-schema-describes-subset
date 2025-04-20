# Contributing

Any kind of
[feedback](https://github.com/jobohner/json-schema-describes-subset/issues) and
code contribution is appreciated.

## Pull requests

In order to keep the
[`main`](https://github.com/jobohner/json-schema-describes-subset) branch in
sync with the latest release, there is a
[`development`](https://github.com/jobohner/json-schema-describes-subset/tree/development)
branch. Make sure to choose this branch as base for pull requests.

The documentation files in [`/docs`](/docs/) are automatically generated. Do not
modify them manually. Change the respective source files instead. See
[`generate-docs.ts`](/scripts/generate-docs.ts).

Run `npm run build` or `npm run build:fix` for all checks, tests and the
generation of documentation files. Make sure that it terminates without error.
