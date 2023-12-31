import React from "react"
import Translate from "@docusaurus/Translate"

import { CreateEdge } from "@theme/JSONSchemaViewer/components"
import {
  SchemaHierarchyContextProvider,
  useSchemaHierarchyContext,
} from "@theme/JSONSchemaViewer/contexts/schemaHierarchy"

import type { JSONSchemaNS } from "@theme/JSONSchemaViewer/types"

type Props = {
  [x: string]: any
  schema: JSONSchemaNS.Array
}

export default function CreateContains(props: Props): JSX.Element {
  const { jsonPointer: currentJsonPointer, level: currentLevel } =
    useSchemaHierarchyContext()
  const { schema } = props

  let item = schema.contains

  if (item === undefined) {
    return <></>
  }

  const containsLabel = (
    <code>
      <Translate
        values={{
          id: "json-schema.keywords.containsEntry",
        }}
      >
        {"items[..., x, ...]"}
      </Translate>
    </code>
  )

  return (
    <ul>
      <SchemaHierarchyContextProvider
        value={{
          level: currentLevel + 1,
          jsonPointer: `${currentJsonPointer}/contains`,
        }}
      >
        <CreateEdge
          key={"contains"}
          name={containsLabel}
          schema={item}
          required={schema.minContains !== undefined && schema.minContains > 0}
        />
      </SchemaHierarchyContextProvider>
    </ul>
  )
}
