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

// Force Buffer to be defined globally (polyfill for the browser)
if (typeof window !== "undefined" && typeof window.Buffer === "undefined") {
  window.Buffer = require("buffer").Buffer;
}

// Configure JSON Schema Faker to generate a skeleton:
JSONSchemaFaker.option({
  alwaysFakeOptionals: true,
  random: () => 0,
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
      // Compute dotPath by removing both "properties" and "items" segments.
      const dotPath = jsonPointer
        .replace(/\/(properties|items)/g, "") // Remove both "properties" and "items" segments.
        .replace(/^\//, "")                  // Remove any leading slash.
        .replace(/\//g, ".");                // Convert remaining slashes to dots.
      console.log("Computed dotPath:", dotPath);
  
      // For fallback, use the full pointer converted to dot notation (keeping segments)
      const fallbackPath = jsonPointer
        .replace(/^\//, "")
        .replace(/\//g, ".");
      console.log("Using fallback path:", fallbackPath);
  
      // Attempt to get the sub-schema using our computed dotPath.
      let subSchema = get(resolvedSchema, dotPath);
      if (!subSchema) {
        subSchema = get(resolvedSchema, fallbackPath);
      }
  
      if (!subSchema) {
        console.error("Sub-schema not found for pointer:", jsonPointer);
        return;
      }
  
      // Decide if we want to generate skeleton data or an empty object/array based on depth.
      // If the pointer contains no nested child segments (i.e. it selects the entire property),
      // then generate an empty object or empty array based on the sub-schema type.
      const parts = jsonPointer.split("/properties/").filter((p) => p.trim() !== "");
      if (parts.length === 1) {
        let defaultValue: any = {};
        if (subSchema && typeof subSchema === "object" && subSchema.type === "array") {
          defaultValue = [];
        }
        let partial: any = {};
        set(partial, dotPath, defaultValue);
        console.log("Generated partial schema (top-level):", partial);
        window.dispatchEvent(new CustomEvent("insertSchema", { detail: partial }));
      } else {
        // For nested pointers, generate skeleton data using JSONSchemaFaker.
        JSONSchemaFaker.resolve(subSchema)
          .then((skeletonData) => {
            // If the final type is array and the skeleton isn't an array, force it to an empty array.
            if (subSchema && typeof subSchema === "object" && subSchema.type === "array" && !Array.isArray(skeletonData)) {
              skeletonData = [];
            }
            let partial: any = {};
            set(partial, dotPath, skeletonData);
            console.log("Generated partial schema (nested):", partial);
            window.dispatchEvent(new CustomEvent("insertSchema", { detail: partial }));
          })
          .catch((error) => {
            console.error("Error generating skeleton data:", error);
          });
      }
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
