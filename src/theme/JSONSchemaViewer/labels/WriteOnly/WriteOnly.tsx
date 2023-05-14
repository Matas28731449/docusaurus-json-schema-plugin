import React from "react"
import Translate from "@docusaurus/Translate"

import styles from "@theme/JSONSchemaViewer/labels/WriteOnly/styles.module.css"

export default function WriteOnlyLabel(): JSX.Element {
  return (
    <strong className={styles.writeOnly}>
      <Translate
        values={{
          id: "json-schema.keywords.writeOnly",
        }}
      >
        {"writeOnly"}
      </Translate>
    </strong>
  )
}
