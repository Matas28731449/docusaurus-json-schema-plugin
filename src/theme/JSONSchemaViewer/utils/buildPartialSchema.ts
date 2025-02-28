/**
 * Given the full resolved schema and a JSON pointer (e.g. "/properties/guardConfiguration/properties/checksum/items/properties/debug"),
 * build a partial template that includes only the keys along the pointer path.
 *
 * This function removes "properties" segments from the pointer.
 * - When it encounters an "items" segment, it converts the parent container into an array with one element.
 * - For the final key, it uses type information from the full schema (if available) to decide the default:
 *    - object: {}
 *    - array: []
 *    - boolean: false
 *    - otherwise: ""
 *
 * For example:
 *   Pointer: "/properties/guardConfiguration/properties/checksum/items/properties/debug" 
 *   Full schema: { type:"object", properties: { guardConfiguration: { type:"object", properties: { checksum: { type:"array", items: { type:"object", properties: { debug: { type:"boolean" } } } } } } } }
 *   Result: { "guardConfiguration": { "checksum": [ { "debug": false } ] } }
 */
export function buildPartialSchema(fullSchema: any, pointer: string): any {
	if (!pointer) return fullSchema;
  
	// Remove leading "/" if present and split pointer, filtering out "properties"
	const parts = pointer.replace(/^\/?/, "").split("/").filter(p => p !== "properties" && p.length > 0);
  
	let result: any = {};
	let current = result;
	// We'll also maintain a stack to update parent containers if we hit an "items" segment.
	let stack: { container: any, key: string }[] = [];
  
	// Traverse the full schema to get type info.
	let schemaCursor = fullSchema;
	if (schemaCursor && typeof schemaCursor === "object" && schemaCursor.properties) {
	  schemaCursor = schemaCursor.properties;
	}
  
	for (let i = 0; i < parts.length; i++) {
	  const key = parts[i];
  
	  if (key === "items") {
		// "items" indicates that the parent should be an array.
		if (stack.length > 0) {
		  // Pop the last entry; that parent's property will become an array.
		  let last = stack.pop()!;
		  const newObj = {};
		  last.container[last.key] = [newObj];
		  current = newObj;
		} else {
		  // If no stack, then result becomes an array.
		  const newObj = {};
		  result = [newObj];
		  current = newObj;
		}
		// Update schemaCursor: if current node has an "items" property, move into it.
		if (schemaCursor && typeof schemaCursor === "object" && schemaCursor.items) {
		  schemaCursor = schemaCursor.items;
		  if (schemaCursor && typeof schemaCursor === "object" && schemaCursor.properties) {
			schemaCursor = schemaCursor.properties;
		  }
		} else {
		  schemaCursor = undefined;
		}
	  } else {
		// Normal key: push the current container info onto the stack.
		stack.push({ container: current, key });
		if (i === parts.length - 1) {
		  // Final key: try to determine default value using schemaCursor.
		  let value: any = "";
		  if (schemaCursor && typeof schemaCursor === "object" && key in schemaCursor) {
			const nodeSchema = schemaCursor[key];
			if (nodeSchema && typeof nodeSchema === "object") {
			  if (nodeSchema.type === "object") {
				value = {};
			  } else if (nodeSchema.type === "array") {
				value = [];
			  } else if (nodeSchema.type === "boolean") {
				value = false;
			  } else {
				value = "";
			  }
			}
		  }
		  current[key] = value;
		} else {
		  current[key] = {};
		}
		current = current[key];
		// Update schemaCursor: move deeper if possible.
		if (schemaCursor && typeof schemaCursor === "object" && key in schemaCursor) {
		  let nodeSchema = schemaCursor[key];
		  if (nodeSchema && typeof nodeSchema === "object" && nodeSchema.properties) {
			schemaCursor = nodeSchema.properties;
		  } else {
			schemaCursor = undefined;
		  }
		} else {
		  schemaCursor = undefined;
		}
	  }
	}
  
	return result;
  }