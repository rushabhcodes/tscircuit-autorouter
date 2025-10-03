import type { SimpleRouteJson } from "../lib/types"

export const squareOutline: Array<{ x: number; y: number }> = [
  { x: 1, y: 1 },
  { x: 9, y: 1 },
  { x: 9, y: 9 },
  { x: 1, y: 9 },
]

const baseSimpleRouteJsonWithOutline: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.25,
  obstacles: [],
  connections: [],
  bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
  outline: squareOutline,
}

export const createSimpleRouteJsonWithOutline = (
  overrides: Partial<SimpleRouteJson> = {},
): SimpleRouteJson => ({
  ...baseSimpleRouteJsonWithOutline,
  ...overrides,
  outline: overrides.outline ?? baseSimpleRouteJsonWithOutline.outline,
})

export const simpleRouteJsonWithOutline = createSimpleRouteJsonWithOutline()
