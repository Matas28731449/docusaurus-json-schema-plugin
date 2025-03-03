import React, { useState, useEffect } from "react"
import { Resolver } from "@stoplight/json-ref-resolver"

import { CreateNodes, Collapsible } from "@theme/JSONSchemaViewer/components"
import {
  JSVOptionsContextProvider,
  SchemaHierarchyContextProvider,
} from "@theme/JSONSchemaViewer/contexts"

import type { JSX } from "react"
import type { JSONSchema } from "@theme/JSONSchemaViewer/types"
import type { JSVOptions } from "@theme/JSONSchemaViewer/contexts"
import {
  LoadingLabel,
  ErrorOccurredLabel,
} from "@theme/JSONSchemaViewer/labels"
import type { IResolveOpts } from "@stoplight/json-ref-resolver/types"

// Import lodash functions
import get from "lodash/get"
import set from "lodash/set"

// Import JSON Schema Faker
import JSONSchemaFaker from "json-schema-faker"

// Configure JSON Schema Faker to generate a skeleton:
JSONSchemaFaker.option({
  alwaysFakeOptionals: true,
  maxItems: 1,
});
JSONSchemaFaker.define("string", () => "");
JSONSchemaFaker.define("integer", () => 1);
JSONSchemaFaker.define("number", () => 0);
JSONSchemaFaker.define("boolean", () => false);
JSONSchemaFaker.define("array", (schema) => {
  // Return an empty array by default
  return [];
});
JSONSchemaFaker.define("object", (schema) => {
  // Return an empty object by default.
  return {};
});

export type Props = {
  /**
   * The JSON schema to use
   */
  schema: unknown
  /**
   * To customize the ref resolving
   * By default, only inline references will be dereferenced by @stoplight/json-ref-resolver
   */
  resolverOptions?: IResolveOpts
  /**
   * To customize the viewer itself
   */
  viewerOptions?: Omit<JSVOptions, "fullSchema">
  /**
   * To customize the styles of the viewer, to override docusaurus styles on a specific page
   */
  className?: string
}

type InnerViewerProperties = {
  // Thanks to @stoplight/json-ref-resolver, $ref are either :
  // 1. resolved
  // 2. unresolved (as circular stuff are not on the roadmap)
  schema: JSONSchema
  // Options for viewer
  viewerOptions?: Omit<JSVOptions, "fullSchema">
  // To customize the styles of the viewer, to override docusaurus styles on a specific page
  className?: string
  onInsert?: (jsonPointer: string) => void
}

// Translated labels

function ErrorOccurred(props: { error: Error }): JSX.Element {
  const { error } = props
  return (
    <div>
      <ErrorOccurredLabel error={error} />
    </div>
  )
}

// Internal
function JSONSchemaInnerViewer(props: InnerViewerProperties): JSX.Element {
  const { schema, viewerOptions, className, onInsert } = props
  // Title of the schema, for user friendliness
  const title =
    typeof schema !== "boolean" && schema.title !== undefined
      ? schema.title
      : "Schema"

  // state for provider
  const startingState: JSVOptions = {
    fullSchema: schema,
    // spread provided attributes
    ...viewerOptions,
  }

  return (
    <SchemaHierarchyContextProvider
      value={{
        jsonPointer: "",
        level: 0,
      }}
    >
      <JSVOptionsContextProvider value={startingState}>
        <Collapsible
          summary={<strong>{title}</strong>}
          detailsProps={{
            open: true,
            className: className || "json-schema-viewer",
          }}
        >
          <CreateNodes schema={schema} onInsert={onInsert} />
        </Collapsible>
      </JSVOptionsContextProvider>
    </SchemaHierarchyContextProvider>
  )
}

// Entry point
export default function JSONSchemaViewer(props: Props): JSX.Element {
  const { schema: originalSchema, resolverOptions, viewerOptions } = props

  const [error, setError] = useState<Error | undefined>(undefined)
  const [resolvedSchema, setResolvedSchema] = useState<JSONSchema | undefined>(
    undefined
  )

  const handleInsert = (jsonPointer: string) => {
    if (resolvedSchema) {
      // Use the full pointer (without converting it) to extract the sub-schema.
      // Remove the leading "/" so that lodash.get interprets it as a path.
      const subSchema = get(resolvedSchema, jsonPointer.replace(/^\//, ""));
      if (!subSchema) {
        console.error("Sub-schema not found for pointer:", jsonPointer);
        return;
      }
      JSONSchemaFaker.resolve(subSchema)
        .then((skeletonData) => {
          // Now, for the partial object, convert the pointer to a dot-notation path 
          // that strips out the "properties" segments.
          const dotPath = jsonPointer
            .replace(/^\/properties\//, "")
            .replace(/\/properties\//g, ".");
          let partial: any = {};
          set(partial, dotPath, skeletonData);
          window.dispatchEvent(
            new CustomEvent("insertSchema", { detail: partial })
          );
        })
        .catch((error) => {
          console.error("Error generating skeleton data:", error);
        });
    }
  };

  useEffect(() => {
    // Time to do the job
    new Resolver()
      .resolve(originalSchema, resolverOptions)
      .then((result) => {
        setResolvedSchema(result.result)
      })
      .catch((err) => {
        setError(err)
      })
  }, [originalSchema, resolverOptions])

  if (error !== undefined) {
    return <ErrorOccurred error={error} />
  } else if (resolvedSchema === undefined) {
    return <LoadingLabel />
  } else {
    return (
      <JSONSchemaInnerViewer
        schema={resolvedSchema}
        viewerOptions={viewerOptions}
        className={props.className}
        onInsert={handleInsert}
      />
    )
  }
}
