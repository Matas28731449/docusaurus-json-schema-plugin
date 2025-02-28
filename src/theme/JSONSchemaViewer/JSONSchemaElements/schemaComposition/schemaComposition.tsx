import React from "react"

import {
  AllOfSchema,
  AnyOfSchema,
  NotSchema,
  OneOfSchema,
} from "@theme/JSONSchemaViewer/JSONSchemaElements/schemaComposition"

import type { JSX } from "react"
import type { JSONSchema } from "@theme/JSONSchemaViewer/types"

type Props = {
  schema: Exclude<JSONSchema, true | false>
  onInsert?: (jsonPointer: string) => void
  [x: string]: any
}

// To handle Schema Composition (anyOf, oneOf, not, allOf)
export default function SchemaComposition(props: Props): JSX.Element {
  const { schema, onInsert } = props

  return (
    <>
      {schema.oneOf !== undefined && <OneOfSchema schema={schema} onInsert={onInsert} />}
      {schema.anyOf !== undefined && <AnyOfSchema schema={schema} onInsert={onInsert} />}
      {schema.allOf !== undefined && <AllOfSchema schema={schema} onInsert={onInsert} />}
      {schema.not !== undefined && <NotSchema schema={schema} onInsert={onInsert} />}
    </>
  )
}
