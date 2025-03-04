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
  useDefaultValue: false,
  maxItems: 1,
  random: () => 0,
});
JSONSchemaFaker.define("string", () => { return ""; });
JSONSchemaFaker.define("integer", () => { return 0; });
JSONSchemaFaker.define("boolean", () => { return false; });
JSONSchemaFaker.define("array", () => { return []; });
JSONSchemaFaker.define("object", () => { return {}; });

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

function ReplaceBadIntegers(value: any): any {
  if (typeof value === "number") {
    return value === -1000000 ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map(ReplaceBadIntegers);
  }
  if (typeof value === "object" && value !== null) {
    const newObj: any = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        newObj[key] = ReplaceBadIntegers(value[key]);
      }
    }
    return newObj;
  }
  return value;
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
    if (!resolvedSchema) return;
  
    // Check if the pointer includes an intermediate "/items/" segment.
    if (jsonPointer.includes("/items/")) {
      // Split at the first occurrence of "/items/"
      const [beforeItems, afterItems] = jsonPointer.split("/items/");
      // Convert the part before "items" to dot notation (removing "properties" segments)
      const baseDotPath = beforeItems
        .replace(/^\/properties\//, "")
        .replace(/\/properties\//g, ".")
        .replace(/^\//, "")
        .replace(/\//g, ".");
      // We want to mark that property as an array; so we append "[0]" to indicate
      // the first element of the array.
      const arrayPath = `${baseDotPath}[0]`;
      // Convert the part after "/items/" to dot notation (again removing "properties")
      const afterDotPath = afterItems
        .replace(/^\/?properties\//, "")
        .replace(/\/properties\//g, ".")
        .replace(/^\//, "")
        .replace(/\//g, ".");
      // If there is any path after "items", append it; otherwise, just use the array path.
      const finalDotPath = afterDotPath ? `${arrayPath}.${afterDotPath}` : arrayPath;
      console.log("Computed dotPath for pointer with items:", finalDotPath);
  
      // For extracting the sub-schema, use a fallback conversion of the full pointer.
      const fallbackPath = jsonPointer.replace(/^\//, "").replace(/\//g, ".");
      console.log("Using fallback path:", fallbackPath);
      let subSchema = get(resolvedSchema, fallbackPath);
      if (!subSchema) {
        console.error("Sub-schema not found for pointer:", jsonPointer);
        return;
      }
  
      // Use JSONSchemaFaker to resolve the sub-schema.
      JSONSchemaFaker.resolve(subSchema)
        .then((skeletonData) => {
          const fixedSkeleton = ReplaceBadIntegers(skeletonData);
          let partial: any = {};
          // We force the array: if our resolved sub-schema is for an array,
          // we want the parent property to remain an array, with our skeleton inserted into the first element.
          set(partial, finalDotPath, fixedSkeleton);
          console.log("Generated partial schema (with items):", partial);
          window.dispatchEvent(new CustomEvent("insertSchema", { detail: partial }));
        })
        .catch((error) => {
          console.error("Error generating skeleton data:", error);
        });
      return;
    }
  
    // If the pointer ends with "/items", then remove that segment and force an empty array.
    if (jsonPointer.endsWith("/items")) {
      const basePointer = jsonPointer.replace(/\/items$/, "");
      const dotPath = basePointer
        .replace(/^\/properties\//, "")
        .replace(/\/properties\//g, ".")
        .replace(/^\//, "")
        .replace(/\//g, ".");
      console.log("Computed dotPath for array (ends with items):", dotPath);
      let partial: any = {};
      set(partial, dotPath, []);
      console.log("Generated partial schema (array forced):", partial);
      window.dispatchEvent(new CustomEvent("insertSchema", { detail: partial }));
      return;
    }
  
    // Otherwise, use the regular logic.
    const dotPath = jsonPointer
      .replace(/^\/properties\//, "")
      .replace(/\/properties\//g, ".")
      .replace(/^\//, "")
      .replace(/\//g, ".");
    console.log("Computed dotPath:", dotPath);
  
    const fallbackPath = jsonPointer.replace(/^\//, "").replace(/\//g, ".");
    console.log("Using fallback path:", fallbackPath);
  
    let subSchema = get(resolvedSchema, dotPath);
    if (!subSchema) {
      subSchema = get(resolvedSchema, fallbackPath);
    }
    if (!subSchema) {
      console.error("Sub-schema not found for pointer:", jsonPointer);
      return;
    }
  
    JSONSchemaFaker.resolve(subSchema)
      .then((skeletonData) => {
        if (
          subSchema &&
          typeof subSchema === "object" &&
          subSchema.type === "array" &&
          !Array.isArray(skeletonData)
        ) {
          skeletonData = [];
        }
        const fixedSkeleton = ReplaceBadIntegers(skeletonData);
        let partial: any = {};
        set(partial, dotPath, fixedSkeleton);
        console.log("Generated partial schema (nested):", partial);
        window.dispatchEvent(new CustomEvent("insertSchema", { detail: partial }));
      })
      .catch((error) => {
        console.error("Error generating skeleton data:", error);
      });
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
