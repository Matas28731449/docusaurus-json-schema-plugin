/**
 * Recursively merge two objects.
 * 
 * - If both values are arrays, the merge returns a concatenated array.
 * - If both values are objects (and not arrays), merge them recursively.
 * - At the top level, if a key from newObj does not exist in oldObj, it is added.
 * - At nested levels, keys that do not exist in oldObj are skipped,
 *   preserving manual deletions.
 */
export function smartMerge(oldObj: any, newObj: any, isTopLevel = true): any {
  // Handle arrays: append new array items
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    return [...oldObj, ...newObj];
  }
  // If oldObj is not an object, return newObj directly.
  if (!oldObj || typeof oldObj !== "object" || oldObj === null) {
    return newObj;
  }
  const merged = { ...oldObj };
  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      if (merged.hasOwnProperty(key)) {
        // If both values are objects (but not arrays), merge recursively.
        if (
          typeof merged[key] === "object" &&
          merged[key] !== null &&
          typeof newObj[key] === "object" &&
          newObj[key] !== null &&
          !Array.isArray(merged[key])
        ) {
          merged[key] = smartMerge(merged[key], newObj[key], false);
        } else {
          // Otherwise, newObj's value overrides.
          merged[key] = newObj[key];
        }
      } else {
        // At the top level, add new keys. At nested levels, skip keys that don't exist.
        if (isTopLevel) {
          merged[key] = newObj[key];
        }
      }
    }
  }
  return merged;
}