/**
 * Recursively merge two objects.
 * 
 * - If both values are arrays, merge them by taking the union of their elements (avoiding duplicates).
 * - If both values are objects (and not arrays), merge them recursively.
 * - Always add keys from newObj if they don't exist in oldObj.
 */
function mergeArrays(oldArr: any[], newArr: any[]): any[] {
  const result = [...oldArr];
  for (const newItem of newArr) {
    // Check for duplicate via deep equality (using JSON.stringify for simplicity)
    const exists = result.some(item => JSON.stringify(item) === JSON.stringify(newItem));
    if (!exists) {
      result.push(newItem);
    }
  }
  return result;
}

export function smartMerge(oldObj: any, newObj: any, isTopLevel = true): any {
  // If both values are arrays, merge them.
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    return mergeArrays(oldObj, newObj);
  }
  // If oldObj is not an object, simply return newObj.
  if (!oldObj || typeof oldObj !== "object" || oldObj === null) {
    return newObj;
  }
  const merged = { ...oldObj };
  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      if (merged.hasOwnProperty(key)) {
        // Both keys exist; if both values are objects, merge recursively.
        if (
          typeof merged[key] === "object" &&
          merged[key] !== null &&
          typeof newObj[key] === "object" &&
          newObj[key] !== null &&
          !Array.isArray(merged[key])
        ) {
          merged[key] = smartMerge(merged[key], newObj[key], false);
        } else if (Array.isArray(merged[key]) && Array.isArray(newObj[key])) {
          merged[key] = mergeArrays(merged[key], newObj[key]);
        } else {
          // Otherwise, override with newObj's value.
          merged[key] = newObj[key];
        }
      } else {
        // Always add new keys, regardless of level.
        merged[key] = newObj[key];
      }
    }
  }
  return merged;
}