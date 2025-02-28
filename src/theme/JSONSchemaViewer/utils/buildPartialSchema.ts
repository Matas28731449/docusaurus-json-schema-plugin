/**
 * Given the full resolved schema and a JSON pointer (e.g. "#/targets/input"),
 * build a partial template that includes all parent keys and sets the final
 * value to {} if the final schema is an object, or "" if it's a primitive.
 */
export function buildPartialSchema(fullSchema: any, pointer: string): any {
	if (!pointer || pointer === "#") return fullSchema;
	// Remove the "#/" prefix and split into parts.
	const parts = pointer.replace(/^#\//, "").split("/");
	let partial: any = {};
	let current = partial;
	let currentFull = fullSchema;
	for (let i = 0; i < parts.length; i++) {
	  const key = parts[i];
	  // Drill into the full schema.
	  if (currentFull && typeof currentFull === "object" && key in currentFull) {
		currentFull = currentFull[key];
	  } else {
		// If the key isn’t found, break out.
		currentFull = undefined;
		break;
	  }
	  if (i === parts.length - 1) {
		// For the final key:
		// If the schema is an object (has type "object"), set an empty object.
		// Otherwise, use an empty string.
		if (currentFull && typeof currentFull === "object" && currentFull.type === "object") {
		  current[key] = {};
		} else {
		  current[key] = "";
		}
	  } else {
		current[key] = {};
		current = current[key];
	  }
	}
	return partial;
  }