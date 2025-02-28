import React from "react"

import AdditionalProperties from "@theme/JSONSchemaViewer/JSONSchemaElements/object/AdditionalProperties"
import Properties from "@theme/JSONSchemaViewer/JSONSchemaElements/object/Properties"
import PatternProperties from "@theme/JSONSchemaViewer/JSONSchemaElements/object/PatternProperties"
import PropertyNames from "@theme/JSONSchemaViewer/JSONSchemaElements/object/PropertyNames"
import UnlistedProperties from "@theme/JSONSchemaViewer/JSONSchemaElements/object/UnlistedRequiredProperties"
import UnevaluatedProperties from "@theme/JSONSchemaViewer/JSONSchemaElements/object/UnevaluatedProperties"

import { QualifierMessages } from "@theme/JSONSchemaViewer/utils"
import { useJSVOptionsContext } from "@theme/JSONSchemaViewer/contexts"

import { ObjectLabel, TypeLabel } from "@theme/JSONSchemaViewer/labels"

import { CreateDescription } from "@theme/JSONSchemaViewer/JSONSchemaElements"

import type { JSX } from "react"
import type { JSONSchemaNS } from "@theme/JSONSchemaViewer/types"

type Props = {
  schema: JSONSchemaNS.Object
  nullable?: boolean
  description?: string
  [x: string]: any
  onInsert?: (jsonPointer: string) => void
}

export default function CreateObject(props: Props): JSX.Element {
  const { schema, nullable, description, onInsert } = props
  const options = useJSVOptionsContext()

  return (
    <>
      <TypeLabel />
      &nbsp;&#58;&nbsp;
      <ObjectLabel />
      <UnlistedProperties schema={schema} onInsert={onInsert} />
      <Properties schema={schema} onInsert={onInsert} />
      <PatternProperties schema={schema} onInsert={onInsert} />
      <PropertyNames schema={schema} onInsert={onInsert} />
      <AdditionalProperties schema={schema} onInsert={onInsert} />
      <UnevaluatedProperties schema={schema} onInsert={onInsert} />
      <div style={{ marginTop: "var(--ifm-table-cell-padding)" }}>
        <QualifierMessages
          schema={schema}
          options={options}
          nullable={nullable}
        />
      </div>
      {description !== undefined && (
        <CreateDescription description={description} />
      )}
    </>
  )
}
