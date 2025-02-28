/**
 * Given the full resolved schema and a JSON pointer (e.g. "/properties/guardConfiguration/properties/checksum/items/properties/debug"),
 * build a partial template that includes only the keys along the pointer path.
 *
 * This function removes "properties" segments from the pointer.
 * When it encounters an "items" segment, it replaces the parent's property with an array containing one object.
 * For the final key, it uses the schema type from the full schema:
 *   - if the type is "object", it returns {}
 *   - if "array", it returns []
 *   - if "boolean", it returns false
 *   - otherwise, it returns an empty string.
 *
 * For example:
 *   Pointer: "/properties/guardConfiguration/properties/checksum/items/properties/debug" 
 *   Expected Result:
 *   {
 *     "guardConfiguration": {
 *       "checksum": [
 *         { "debug": false }
 *       ]
 *     }
 *   }
 */
export function buildPartialSchema(fullSchema: any, pointer: string): any {
	if (!pointer) return fullSchema;
  
	// Normalize pointer: remove a leading "/" (if any) and filter out "properties"
	const parts = pointer.replace(/^\/?/, "").split("/").filter(p => p !== "properties" && p.length > 0);
  
	let result: any = {};
	let current = result;
	// Stack to hold parent container info for non-"items" keys.
	const stack: { container: any; key: string }[] = [];
  
	// Traverse fullSchema for type info.
	let schemaCursor = fullSchema;
	if (schemaCursor && typeof schemaCursor === "object" && schemaCursor.properties) {
	  schemaCursor = schemaCursor.properties;
	}
  
	for (let i = 0; i < parts.length; i++) {
	  const part = parts[i];
  
	  if (part === "items") {
		// When we see "items", we expect that the last key should be an array.
		if (stack.length > 0) {
		  const last = stack.pop()!;
		  // Replace the parent's value with an array containing one new object.
		  last.container[last.key] = [{}];
		  current = last.container[last.key][0];
  
		  // Update schemaCursor if available:
		  if (schemaCursor && typeof schemaCursor === "object" && last.key in schemaCursor) {
			const nodeSchema = schemaCursor[last.key];
			if (nodeSchema && nodeSchema.type === "array" && nodeSchema.items) {
			  schemaCursor = nodeSchema.items;
			  if (schemaCursor && typeof schemaCursor === "object" && schemaCursor.properties) {
				schemaCursor = schemaCursor.properties;
			  }
			} else {
			  schemaCursor = undefined;
			}
		  }
		} else {
		  // If no parent exists, then result becomes an array.
		  result = [{}];
		  current = result[0];
		}
	  } else {
		// For a normal key:
		if (i === parts.length - 1) {
		  // Final key: decide the default value using schemaCursor.
		  let defaultValue: any = "";
		  if (schemaCursor && typeof schemaCursor === "object" && part in schemaCursor) {
			const nodeSchema = schemaCursor[part];
			if (nodeSchema && typeof nodeSchema === "object" && nodeSchema.type) {
			  if (nodeSchema.type === "object") {
				defaultValue = {};
			  } else if (nodeSchema.type === "array") {
				defaultValue = [];
			  } else if (nodeSchema.type === "boolean") {
				defaultValue = false;
			  } else {
				defaultValue = "";
			  }
			}
		  }
		  current[part] = defaultValue;
		} else {
		  // Intermediate keys are always set to an object.
		  current[part] = {};
		}
		// Push the current info onto the stack.
		stack.push({ container: current, key: part });
		// Advance current pointer.
		current = current[part];
  
		// Update schemaCursor:
		if (schemaCursor && typeof schemaCursor === "object" && part in schemaCursor) {
		  const nextSchema = schemaCursor[part];
		  if (nextSchema && typeof nextSchema === "object") {
			if (nextSchema.type === "array" && nextSchema.items) {
			  schemaCursor = nextSchema.items;
			  if (schemaCursor && typeof schemaCursor === "object" && schemaCursor.properties) {
				schemaCursor = schemaCursor.properties;
			  }
			} else if (nextSchema.properties) {
			  schemaCursor = nextSchema.properties;
			} else {
			  schemaCursor = undefined;
			}
		  } else {
			schemaCursor = undefined;
		  }
		}
	  }
	}
	return result;
  }