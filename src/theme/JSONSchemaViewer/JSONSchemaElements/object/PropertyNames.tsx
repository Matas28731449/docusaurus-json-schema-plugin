import React from "react"

import { CreateEdge } from "../../components/index"

import type { JSONSchemaNS } from "../../types"

type Props = {
  schema: JSONSchemaNS.Object
  [x: string]: any
}

// Generate propertyNames
function propertyNames(props: Props): JSX.Element {
  const { schema } = props

  let propertyNames = schema.propertyNames!

  // Fast Fail over
  /* istanbul ignore if  */
  if (
    typeof propertyNames === "boolean" ||
    propertyNames.pattern === undefined
  ) {
    return <></>
  }

  // As propertyNames doesn't care about type below, we can remove "pattern" for next calls
  // So we are not misguided to consider it as string
  let pattern = propertyNames.pattern
  let newSchema = { ...propertyNames }
  delete newSchema.pattern

  return (
    <CreateEdge
      key={"propertyNames"}
      name={<code>{pattern}</code>}
      schema={newSchema}
      required={false}
    />
  )
}

export default propertyNames
