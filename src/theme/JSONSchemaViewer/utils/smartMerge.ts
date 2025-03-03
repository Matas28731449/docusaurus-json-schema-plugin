/**
 * Recursively merge two objects.
 * 
 * - If both values are arrays, merge them by merging the first element of each.
 * - If both values are objects (and not arrays), merge them recursively.
 * - Always add keys from newObj if they don't exist in oldObj.
 */
function mergeArrays(oldArr: any[], newArr: any[]): any[] {
  // If both arrays have at least one element and they are objects,
  // merge newArr[0] into oldArr[0] and return a single-element array.
  if (oldArr.length > 0 && newArr.length > 0 &&
      typeof oldArr[0] === "object" && oldArr[0] !== null &&
      typeof newArr[0] === "object" && newArr[0] !== null) {
    const mergedFirst = smartMerge(oldArr[0], newArr[0], false);
    return [mergedFirst];
  }
  // Otherwise, if no element exists in oldArr, return newArr.
  return newArr;
}

export function smartMerge(oldObj: any, newObj: any, isTopLevel = true): any {
  // If both values are arrays, use mergeArrays.
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