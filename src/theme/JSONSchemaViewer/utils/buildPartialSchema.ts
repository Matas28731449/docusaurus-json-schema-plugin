/**
 * Given a full resolved schema and a pointer like:
 *   "/properties/guardConfiguration/properties/checksum/items/properties/invocationLocations/items/properties/interval"
 * this function builds a partial template that follows the pointer path.
 *
 * It removes "properties" segments and handles "items" segments by converting the parent
 * property into an array (if not already) and then creating a new object within that array.
 *
 * For the final key, it examines the schema to decide on a default value:
 *  - object → {}
 *  - array → []
 *  - boolean → false
 *  - string → ""
 *  - integer → 1
 *  - number → 0
 *  - otherwise → ""
 *
 * For example, for the pointer above (assuming "interval" is an integer),
 * the function returns:
 *
 * {
 *   "guardConfiguration": {
 *     "checksum": [
 *       {
 *         "invocationLocations": [
 *           {
 *             "interval": 1
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */
export function buildPartialSchema(fullSchema: any, pointer: string): any {
	if (!pointer) return fullSchema;
  
	// Normalize pointer: remove any leading "/" and filter out "properties" segments.
	const parts = pointer
	  .replace(/^\/?/, "")
	  .split("/")
	  .filter((p) => p && p !== "properties");
  
	let result: any = {};
	let current = result;
	// Stack to track parent container info.
	const stack: { container: any; key: string }[] = [];
  
	// For type resolution: start with the full schema's properties.
	let schemaCursor = fullSchema;
	if (schemaCursor && typeof schemaCursor === "object" && schemaCursor.properties) {
	  schemaCursor = schemaCursor.properties;
	}
  
	for (let i = 0; i < parts.length; i++) {
	  const part = parts[i];
  
	  if (part === "items") {
		// "items" indicates the previous property should be an array.
		if (stack.length > 0) {
		  const last = stack.pop()!;
		  if (!Array.isArray(last.container[last.key])) {
			last.container[last.key] = [];
		  }
		  const newObj = {};
		  last.container[last.key].push(newObj);
		  current = newObj;
		} else {
		  result = [];
		  const newObj = {};
		  result.push(newObj);
		  current = newObj;
		}
		// When handling "items", we lose schemaCursor context.
		schemaCursor = undefined;
	  } else {
		if (i === parts.length - 1) {
		  // Final key: determine default value using schemaCursor if available.
		  let defaultValue: any = "";
		  if (schemaCursor && typeof schemaCursor === "object" && part in schemaCursor) {
			const nodeSchema = schemaCursor[part];
			if (nodeSchema && typeof nodeSchema === "object" && nodeSchema.type) {
			  switch (nodeSchema.type) {
				case "object":
				  defaultValue = {};
				  break;
				case "array":
				  defaultValue = [];
				  break;
				case "boolean":
				  defaultValue = false;
				  break;
				case "string":
				  defaultValue = "";
				  break;
				case "integer":
				  defaultValue = 1;
				  break;
				case "number":
				  defaultValue = 0;
				  break;
				default:
				  defaultValue = "";
			  }
			}
		  }
		  current[part] = defaultValue;
		} else {
		  current[part] = {};
		}
		// Save the current container and key.
		stack.push({ container: current, key: part });
		current = current[part];
  
		// Descend schemaCursor if possible.
		if (schemaCursor && typeof schemaCursor === "object" && part in schemaCursor) {
		  let nextSchema = schemaCursor[part];
		  if (nextSchema && typeof nextSchema === "object") {
			if (nextSchema.type === "array" && nextSchema.items) {
			  nextSchema = nextSchema.items;
			  if (nextSchema && typeof nextSchema === "object" && nextSchema.properties) {
				schemaCursor = nextSchema.properties;
			  } else {
				schemaCursor = undefined;
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