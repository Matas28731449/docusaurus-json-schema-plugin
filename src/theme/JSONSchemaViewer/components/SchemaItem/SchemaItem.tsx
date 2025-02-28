import React, { ReactNode } from "react"

import { Collapsible, CreateNodes } from "@theme/JSONSchemaViewer/components"
import { useSchemaHierarchyContext } from "@theme/JSONSchemaViewer/contexts"

import {
  RequiredLabel,
  DeprecatedLabel,
  WriteOnlyLabel,
  ReadOnlyLabel,
  ConstantLabel,
} from "@theme/JSONSchemaViewer/labels"

import { GenerateFriendlyName } from "@theme/JSONSchemaViewer/utils"

import styles from "./styles.module.css"

import type { JSX } from "react"

import type {
  JSONSchema,
  JSONSchema_Draft_2019_09,
} from "@theme/JSONSchemaViewer/types"

export type SchemaItemProps = {
  // name of the item (with styles when needed)
  name: ReactNode
  // Our schema
  schema: JSONSchema
  // Is it required
  required: boolean
  //
  onInsert?: (jsonPointer: string) => void
}

export default function SchemaItem({
  schema,
  name,
  required,
  onInsert,
}: SchemaItemProps): JSX.Element {
  const { jsonPointer, level } = useSchemaHierarchyContext()

  // Notice : "deprecated" started at 2019-09
  let typedSchema = schema as JSONSchema_Draft_2019_09
  let isDeprecated =
    typeof typedSchema !== "boolean" && typedSchema.deprecated === true
  let isReadOnly =
    typeof typedSchema !== "boolean" && typedSchema.readOnly === true
  let isWriteOnly =
    typeof typedSchema !== "boolean" && typedSchema.writeOnly === true
  let isConstant =
    typeof typedSchema !== "boolean" &&
    (typedSchema.const !== undefined ||
      (Array.isArray(typedSchema.enum) && typedSchema.enum.length === 1))
  let isRequired = !isDeprecated && required

  // Header
  const summary = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <span>
        {name}&nbsp;
        <GenerateFriendlyName schema={schema} />
        {isRequired && <>&nbsp;</>}
        {isRequired && <RequiredLabel />}
        {isDeprecated && <>&nbsp;</>}
        {isDeprecated && <DeprecatedLabel />}
        {isReadOnly && <>&nbsp;</>}
        {isReadOnly && <ReadOnlyLabel />}
        {isWriteOnly && <>&nbsp;</>}
        {isWriteOnly && <WriteOnlyLabel />}
        {isConstant && <>&nbsp;</>}
        {isConstant && <ConstantLabel />}
      </span>
      <button
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "2px 6px",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          fontSize: "1em",
        }}
        onClick={() => {
          // console.log("Plus button clicked for jsonPointer:", jsonPointer);
          if (onInsert) {
            onInsert(jsonPointer)
            console.log("onInsert dispatched:", jsonPointer);
          }
        }}
      >
        +
      </button>
    </div>
  )

  return (
    <li className={styles.schemaItem} id={jsonPointer} data-level={level}>
      <Collapsible
        summary={summary}
        detailsProps={{
          open: false,
        }}
      >
        <CreateNodes schema={schema} onInsert={onInsert} />
      </Collapsible>
    </li>
  )
}
