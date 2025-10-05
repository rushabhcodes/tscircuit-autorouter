import { describe, expect, test } from "bun:test"
import {
  getAlternativeLayersForSegment,
  getCommonAvailableLayers,
} from "../../lib/solvers/UnravelSolver/getLayerOptions"

describe("getCommonAvailableLayers", () => {
  test("returns the intersection while preserving order", () => {
    const result = getCommonAvailableLayers([
      { availableZ: [0, 1, 2, 3] },
      { availableZ: [1, 2, 3, 4] },
      { availableZ: [2, 3, 4] },
    ])

    expect(result).toEqual([2, 3])
  })

  test("returns an empty list when no overlap exists", () => {
    const result = getCommonAvailableLayers([
      { availableZ: [0, 1] },
      { availableZ: [2, 3] },
    ])

    expect(result).toEqual([])
  })
})

describe("getAlternativeLayersForSegment", () => {
  test("filters out excluded layers and deduplicates", () => {
    const result = getAlternativeLayersForSegment(
      { availableZ: [0, 1, 1, 2, 3] },
      [1, 3],
    )

    expect(result).toEqual([0, 2])
  })
})
