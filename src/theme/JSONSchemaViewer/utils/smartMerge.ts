/**
 * Smart merge two objects.
 *
 * - If the current (old) object is empty, return the new object.
 * - Otherwise, for each key in the new object, only merge it if that key already exists in the old object.
 *   This way, if a key was manually removed (i.e. not present in the old object), it won't be re-added.
 *
 * @param oldObj The current editor content as an object.
 * @param newObj The new partial schema as an object.
 * @returns The smart-merged object.
 */
export function smartMerge(oldObj: any, newObj: any): any {
  if (typeof oldObj !== "object" || oldObj === null) return oldObj;
  if (typeof newObj !== "object" || newObj === null) return oldObj;

  // If oldObj is empty, assume no manual changes yet, so use newObj.
  if (Object.keys(oldObj).length === 0) {
    return newObj;
  }

  const merged = { ...oldObj };

  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(oldObj, key)) {
      merged[key] = smartMerge(oldObj[key], newObj[key]);
    }
  }
  return merged;
}