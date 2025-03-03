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
      // Check if pointer ends with "/items"
      const isItemsPointer = jsonPointer.endsWith("/items");
  
      if (isItemsPointer) {
        // Full dot-path conversion of the pointer.
        const fullDotPath = jsonPointer.replace(/^\//, "").replace(/\//g, ".");
        // Remove trailing ".items" to get the base path (for the array property)
        const baseDotPath = fullDotPath.replace(/\.items$/, "");
        console.log("Computed baseDotPath for array insertion:", baseDotPath);
  
        // Get the sub-schema for the array items.
        // The original pointer for the items sub-schema is the full dot path (which still includes "items")
        const itemsSubSchema = get(resolvedSchema, fullDotPath);
        if (!itemsSubSchema) {
          console.error("Sub-schema for array items not found for pointer:", jsonPointer);
          return;
        }
  
        // Use JSONSchemaFaker to generate the skeleton for the array items.
        JSONSchemaFaker.resolve(itemsSubSchema)
          .then((skeletonData) => {
            // Create an array with two copies of the skeleton data.
            const arr = [skeletonData, skeletonData];
            let partial: any = {};
            set(partial, baseDotPath, arr);
            console.log("Generated partial schema for array:", partial);
            window.dispatchEvent(new CustomEvent("insertSchema", { detail: partial }));
          })
          .catch((error) => {
            console.error("Error generating skeleton data for array items:", error);
          });
      } else {
        // Regular pointer handling.
        const dotPath = jsonPointer
          .replace(/^\/properties\//, "")
          .replace(/\/properties\//g, ".");
        console.log("Computed dotPath:", dotPath);
  
        let subSchema = get(resolvedSchema, dotPath);
        if (!subSchema) {
          const fallbackPath = jsonPointer.replace(/^\//, "").replace(/\//g, ".");
          console.log("Using fallback path:", fallbackPath);
          subSchema = get(resolvedSchema, fallbackPath);
        }
  
        if (!subSchema) {
          console.error("Sub-schema not found for pointer:", jsonPointer);
          return;
        }
  
        JSONSchemaFaker.resolve(subSchema)
          .then((skeletonData) => {
            // If the final type is array and the Faker didn't return an array, force it.
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
