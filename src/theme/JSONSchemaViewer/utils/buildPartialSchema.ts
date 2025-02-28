/**
 * Given the full resolved schema and a JSON pointer (e.g. "/properties/guardConfiguration/properties/checksum/items/properties/debug"),
 * build a partial template that includes only the keys along the pointer path.
 *
 * This function assumes that the pointer segments include "properties" (which are then filtered out) and "items".
 * When it encounters an "items" segment, it replaces the last property with an array containing one object.
 * For the final key:
 *  - if the key is "debug", default to false (since it's a boolean in your example),
 *  - otherwise, default to an empty string.
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
	// Remove a leading slash (if any) and filter out "properties" segments.
	const parts = pointer.replace(/^\/?/, "").split("/").filter(p => p !== "properties" && p.length > 0);
	
	let result: any = {};
	let current = result;
	// We'll use a stack to track parent references.
	const stack: { container: any; key: string }[] = [];
	
	for (let i = 0; i < parts.length; i++) {
	  const part = parts[i];
	  if (part === "items") {
		// "items" indicates that the parent's property should become an array.
		if (stack.length > 0) {
		  const last = stack.pop()!;
		  // Replace the parent's property with an array containing one new object.
		  last.container[last.key] = [{}];
		  current = last.container[last.key][0];
		} else {
		  // If no parent is available, make the entire result an array.
		  result = [{}];
		  current = result[0];
		}
	  } else {
		// For a normal key:
		if (i === parts.length - 1) {
		  // Final key: decide the default value.
		  let defaultValue: any = "";
		  // In your example, "debug" is boolean so we want false.
		  if (part === "debug") {
			defaultValue = false;
		  }
		  current[part] = defaultValue;
		} else {
		  // For intermediate keys, create an empty object.
		  current[part] = {};
		}
		// Push current info to the stack for later reference.
		stack.push({ container: current, key: part });
		// Advance the current pointer.
		current = current[part];
	  }
	}
	return result;
  }