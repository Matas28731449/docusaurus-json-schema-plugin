import React from "react"

import {
  CreateObject,
  CreateArray,
  CreateString,
  CreateBoolean,
  CreateNumber,
  CreateInteger,
  CreateNull,
} from "@theme/JSONSchemaViewer/JSONSchemaElements"

import type { JSX } from "react"
import type {
  JSONSchema,
  JSONSchemaNS,
  TypeValues,
} from "@theme/JSONSchemaViewer/types"

// Utily function to render a specific type
type RenderProvidedTypeProps = {
  schema: Exclude<JSONSchema, true | false>
  type: TypeValues
  nullable?: boolean
  onInsert?: (jsonPointer: string) => void
}

export default function RenderProvidedType({
  schema,
  type,
  nullable,
  onInsert,
}: RenderProvidedTypeProps): JSX.Element {
  const commonProps = { description: schema.description, nullable }

  switch (type) {
    case "array":
      return (
        <CreateArray schema={schema as JSONSchemaNS.Array} {...commonProps} onInsert={onInsert} />
      )
    case "object":
      return (
        <CreateObject schema={schema as JSONSchemaNS.Object} {...commonProps} onInsert={onInsert} />
      )
    case "string":
      return (
        <CreateString schema={schema as JSONSchemaNS.String} {...commonProps} />
      )
    case "boolean":
      return (
        <CreateBoolean
          schema={schema as JSONSchemaNS.Boolean}
          {...commonProps}
        />
      )
    case "number":
      return (
        <CreateNumber schema={schema as JSONSchemaNS.Number} {...commonProps} />
      )
    case "integer":
      return (
        <CreateInteger
          schema={schema as JSONSchemaNS.Integer}
          {...commonProps}
        />
      )
    default:
      return (
        <CreateNull schema={schema as JSONSchemaNS.Null} {...commonProps} />
      )
  }
}