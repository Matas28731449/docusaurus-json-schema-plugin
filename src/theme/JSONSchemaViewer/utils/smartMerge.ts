/**
 * Recursively merge two objects.
 * 
 * At the top level (isTopLevel=true), new keys from newObj are added even if they do not exist in oldObj.
 * At nested levels (isTopLevel=false), only keys that exist in oldObj are merged.
 * This way, if a user manually deletes a nested key, it won't be re‑inserted by subsequent insertions.
 */
export function smartMerge(oldObj: any, newObj: any, isTopLevel = true): any {
  if (!oldObj || typeof oldObj !== "object" || oldObj === null) return newObj;
  const merged = { ...oldObj };
  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      if (merged.hasOwnProperty(key)) {
        // Both old and new have the key, so merge recursively if both are objects.
        if (
          typeof merged[key] === "object" &&
          merged[key] !== null &&
          typeof newObj[key] === "object" &&
          newObj[key] !== null
        ) {
          merged[key] = smartMerge(merged[key], newObj[key], false);
        } else {
          merged[key] = newObj[key];
        }
      } else {
        // At the top level, add new keys. At nested levels, skip if the key doesn't exist.
        if (isTopLevel) {
          merged[key] = newObj[key];
        }
      }
    }
  }
  return merged;
}