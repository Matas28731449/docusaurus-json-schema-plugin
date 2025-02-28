/**
 * Given the full schema and a JSON pointer (e.g. "#/globalConfiguration/guardConfiguration/targets"),
 * build a partial schema object that nests all parent keys down to the selected node.
 */
export function buildPartialSchema(fullSchema: any, pointer: string): any {
	if (!pointer || pointer === "#") return fullSchema;
	// Remove "#/" prefix and split by "/"
	const parts = pointer.replace(/^#\//, "").split("/");
	let partial: any = {};
	let current = partial;
	let currentFull = fullSchema;
	for (let i = 0; i < parts.length; i++) {
		const key = parts[i];
		if (currentFull && typeof currentFull === "object" && key in currentFull) {
			currentFull = currentFull[key];
		} else {
			// If the key is not found, break out.
			currentFull = undefined;
			break;
		}
		if (i === parts.length - 1) {
			current[key] = currentFull;
		} else {
			current[key] = {};
			current = current[key];
		}
	}
	return partial;
}