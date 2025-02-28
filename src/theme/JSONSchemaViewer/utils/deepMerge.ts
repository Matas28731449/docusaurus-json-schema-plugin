/**
 * Recursively merge two objects.
 * If both target and source have a property and both values are objects,
 * then they are merged recursively. Otherwise, source overwrites target.
 */
export function deepMerge(target: any, source: any): any {
	if (typeof target !== "object" || target === null) {
		return source;
	}
	if (typeof source !== "object" || source === null) {
		return source;
	}
	const result = { ...target };
	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			if (key in target) {
				result[key] = deepMerge(target[key], source[key]);
			} else {
				result[key] = source[key];
			}
		}
	}
	return result;
}