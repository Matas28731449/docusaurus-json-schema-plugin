/**
 * Smart merge two objects.
 *
 * If the current (old) object is empty, return the new object.
 * Otherwise, for each key in the new object, only merge it if that key already exists
 * in the old object. This prevents keys that the user has deleted from being re‑added.
 *
 * If both values are objects, merge them recursively.
 */
export function smartMerge(oldObj: any, newObj: any): any {
  // If oldObj is empty, just use newObj.
  if (!oldObj || Object.keys(oldObj).length === 0) {
    return newObj;
  }
  const merged = { ...oldObj };
  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      if (Object.prototype.hasOwnProperty.call(oldObj, key)) {
        // If both values are objects, merge recursively.
        if (
          typeof oldObj[key] === "object" &&
          oldObj[key] !== null &&
          typeof newObj[key] === "object" &&
          newObj[key] !== null
        ) {
          merged[key] = smartMerge(oldObj[key], newObj[key]);
        } else {
          // Otherwise, replace the value.
          merged[key] = newObj[key];
        }
      }
      // Else: key does not exist in oldObj, so we skip it (preserving user deletion).
    }
  }
  return merged;
}