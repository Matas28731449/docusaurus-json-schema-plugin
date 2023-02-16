import React from "react"

import { CreateNodes } from "../../components/index"

import type { JSONSchema } from "../../types"

type Props = {
  schema: JSONSchema
  [x: string]: any
}

function NotSchema(props: Props): JSX.Element {
  const { schema } = props

  /* istanbul ignore if  */
  if (typeof schema === "boolean") {
    return <></>
  }

  let typedSchema = schema.not!
  let typeOf = "not"

  return (
    <div>
      <span className="badge badge--danger">{typeOf}</span>
      <br />
      <CreateNodes schema={typedSchema} />
    </div>
  )
}

export default NotSchema
