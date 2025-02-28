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
  showAddButton?: boolean
}

const NodeWithAddButton = ({ children }: { children: JSX.Element }): JSX.Element => {
  return (
    <div
      className="schema-node"
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "0.5rem",
      }}
    >
      {children}
      <button
        className="plus-button"
        style={{ marginLeft: "0.5rem" }}
        onClick={() => {}}
      >
        +
      </button>
    </div>
  )
}

// Entry point
export default function CreateNodes(props: Props): JSX.Element {
  const { schema, showAddButton } = props

  if (typeof schema === "boolean") {
    return <CreateValidOrInvalid schema={schema} />
  }

  // Type Checks
  const isComposition = isSchemaComposition(schema)
  const isConditional = isSchemaConditional(schema)

  return (
    <>
      {/* Handle standard types */}
      {showAddButton ? (
        <NodeWithAddButton>
          <CreateTypes schema={schema} />
        </NodeWithAddButton>
      ) : (
        <CreateTypes schema={schema} />
      )}

      {/* handle anyOf / allOf / oneOf / not  */}
      {isComposition &&
        (showAddButton ? (
          <NodeWithAddButton>
            <SchemaComposition schema={schema} />
          </NodeWithAddButton>
        ) : (
          <SchemaComposition schema={schema} />
        ))}

      {/* Conditional part of the schema */}
      {isConditional &&
        (showAddButton ? (
          <NodeWithAddButton>
            <SchemaConditional schema={schema} />
          </NodeWithAddButton>
        ) : (
          <SchemaConditional schema={schema} />
        ))}
    </>
  )
}