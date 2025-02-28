import React from "react"

import { CreateTypes } from "@theme/JSONSchemaViewer/components"

import {
  SchemaComposition,
  SchemaConditional,
} from "@theme/JSONSchemaViewer/JSONSchemaElements"

import { CreateValidOrInvalid } from "@theme/JSONSchemaViewer/components"

import {
  isSchemaComposition,
  isSchemaConditional,
} from "@theme/JSONSchemaViewer/utils"

import type { JSONSchema } from "@theme/JSONSchemaViewer/types"
import type { JSX } from "react"

type Props = {
  [x: string]: any
  schema: JSONSchema
  onInsert?: (jsonPointer: string) => void
}

// Entry point
export default function CreateNodes(props: Props): JSX.Element {
  const { schema, onInsert } = props

  if (typeof schema === "boolean") {
    return <CreateValidOrInvalid schema={schema} />
  }

  // Type Checks
  const isComposition = isSchemaComposition(schema)
  const isConditional = isSchemaConditional(schema)

  return (
    <>
      {/* Handle standard types */}
      <CreateTypes schema={schema} onInsert={onInsert} />
      {/* handle anyOf / allOf / oneOf / not  */}
      {isComposition && <SchemaComposition schema={schema} onInsert={onInsert} />}
      {/* Conditional part of the schema */}
      {isConditional && <SchemaConditional schema={schema} onInsert={onInsert} />}
    </>
  )
}
