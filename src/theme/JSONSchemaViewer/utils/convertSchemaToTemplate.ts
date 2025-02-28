/**
 * Recursively converts a JSON Schema into a simplified JSON object.
 * - For objects: it returns an object with the same keys (from the "properties")
 *   and values set to the result of converting that property.
 * - For arrays: it returns an array with one converted element.
 * - For primitive types: it returns an empty string.
 */
export function convertSchemaToTemplate(schema: any): any {
	if (typeof schema === "boolean") {
		return schema;
	}
	// If the schema defines an object with properties, recursively convert them.
	if (schema.type === "object" && schema.properties) {
		const result: any = {};
		for (const key in schema.properties) {
			result[key] = convertSchemaToTemplate(schema.properties[key]);
		}
		return result;
	}
	// If the schema defines an array, return an array with one converted item.
	if (schema.type === "array" && schema.items) {
		return [convertSchemaToTemplate(schema.items)];
	}
	// For primitive types (string, number, etc.) or when no type is specified,
	// return an empty string.
	return "";
}