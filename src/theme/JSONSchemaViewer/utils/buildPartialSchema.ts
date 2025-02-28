/**
 * Given the full resolved schema and a JSON pointer (e.g. "/properties/targets"),
 * build a partial template that includes only the keys along the pointer path.
 *
 * The function removes "properties" segments from the pointer.
 * For the final key, if the corresponding schema is an object (type === "object"),
 * it returns an empty object {}; otherwise, it returns an empty string.
 *
 * For example:
 *   Pointer: "/properties/targets" 
 *   Full schema: { type:"object", properties: { targets: { type:"object", properties: { ... } } } }
 *   Result: { "targets": {} }
 */
export function buildPartialSchema(fullSchema: any, pointer: string): any {
	if (!pointer) return fullSchema;
  
	// Remove leading "/" if present.
	const normalized = pointer.startsWith("/") ? pointer.slice(1) : pointer;
	// Split pointer into parts and filter out any segment equal to "properties"
	const parts = normalized.split("/").filter((p) => p !== "properties" && p.length > 0);
  
	let result: any = {};
	let current = result;
  
	// We'll traverse the fullSchema to check the type of the final node.
	// Assume that fullSchema is an object with a "properties" key at the top.
	let schemaCursor = fullSchema;
	if (schemaCursor && typeof schemaCursor === "object" && schemaCursor.properties) {
	  schemaCursor = schemaCursor.properties;
	}
  
	for (let i = 0; i < parts.length; i++) {
	  const key = parts[i];
	  // Use schemaCursor to get the node's schema if available.
	  let nodeSchema = schemaCursor ? schemaCursor[key] : undefined;
  
	  if (i === parts.length - 1) {
		// Final key: check the type.
		if (nodeSchema && typeof nodeSchema === "object" && nodeSchema.type === "object") {
		  current[key] = {};
		} else {
		  current[key] = "";
		}
	  } else {
		current[key] = {};
		current = current[key];
		// Move schemaCursor deeper if possible.
		if (nodeSchema && typeof nodeSchema === "object" && nodeSchema.properties) {
		  schemaCursor = nodeSchema.properties;
		} else {
		  schemaCursor = undefined;
		}
	  }
	}
  
	return result;
  }