export interface HasAvailableZ {
  availableZ: number[]
}

/**
 * Returns the layers that are available across all of the provided segments,
 * preserving the ordering from the first segment and removing duplicates.
 */
export const getCommonAvailableLayers = (
  segments: HasAvailableZ[],
): number[] => {
  if (segments.length === 0) return []

  const [first, ...rest] = segments
  const seenLayers = new Set<number>()
  const commonLayers: number[] = []

  for (const layer of first.availableZ) {
    if (seenLayers.has(layer)) continue
    if (rest.every((segment) => segment.availableZ.includes(layer))) {
      seenLayers.add(layer)
      commonLayers.push(layer)
    }
  }

  return commonLayers
}

/**
 * Returns all alternative layers that a segment can use, excluding any layers
 * in the provided exclusion set. The order of layers is preserved from the
 * segment's availableZ array.
 */
export const getAlternativeLayersForSegment = (
  segment: HasAvailableZ,
  exclude: Iterable<number>,
): number[] => {
  const excludeSet = new Set(exclude)
  const seenLayers = new Set<number>()
  const alternativeLayers: number[] = []

  for (const layer of segment.availableZ) {
    if (excludeSet.has(layer)) continue
    if (seenLayers.has(layer)) continue
    seenLayers.add(layer)
    alternativeLayers.push(layer)
  }

  return alternativeLayers
}
