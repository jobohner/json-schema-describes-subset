# "subschema", "subset schema" and "superset schema"

It might appear natural to refer to a schema that describes the subset of the
set described by another schema as "subschema". This project however sticks to
the terminology of the
[JSON Schema specification](https://json-schema.org/draft/2020-12/json-schema-core#section-4.3.5),
where "subschema" refers to a schema that is contained in a surrounding parent
schema. Instead "subset schema" or "superset schema" might be used to express
the relation between the sets of data values that satisfy the respective
schemas.
