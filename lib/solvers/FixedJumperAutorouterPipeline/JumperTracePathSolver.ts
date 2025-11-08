import { BaseSolver } from "../BaseSolver"
import { HighDensityIntraNodeRoute } from "lib/types/high-density-types"

const EPSILON = 1e-6

type JumperTracePathSolverParams = {
  hdRoutes: HighDensityIntraNodeRoute[]
  targetSpacing: number
}

const approxEqual = (a: number, b: number) => Math.abs(a - b) < EPSILON

const cloneRoute = (
  route: HighDensityIntraNodeRoute,
): HighDensityIntraNodeRoute => ({
  ...route,
  route: route.route.map((point) => ({ ...point })),
  vias: route.vias.map((via) => ({ ...via })),
})

const normalizeVector = (x: number, y: number) => {
  const length = Math.hypot(x, y)
  if (length < EPSILON) {
    return { x: 1, y: 0, length }
  }
  return { x: x / length, y: y / length, length }
}

const createJumperRoute = (
  route: HighDensityIntraNodeRoute,
  targetSpacing: number,
): HighDensityIntraNodeRoute => {
  if (targetSpacing <= 0) {
    return cloneRoute(route)
  }

  const clone = cloneRoute(route)
  const viaRouteIndices = clone.vias.map((via) =>
    clone.route.findIndex(
      (point) => approxEqual(point.x, via.x) && approxEqual(point.y, via.y),
    ),
  )

  for (let i = 0; i < clone.vias.length - 1; i += 2) {
    const viaA = clone.vias[i]
    const viaB = clone.vias[i + 1]
    const routeIndexA = viaRouteIndices[i]
    const routeIndexB = viaRouteIndices[i + 1]

    if (!viaA || !viaB) continue

    const centerX = (viaA.x + viaB.x) / 2
    const centerY = (viaA.y + viaB.y) / 2
    let directionX = viaB.x - viaA.x
    let directionY = viaB.y - viaA.y

    let { x: unitX, y: unitY, length } = normalizeVector(directionX, directionY)

    if (length < EPSILON) {
      const previousPoint =
        typeof routeIndexA === "number" && routeIndexA > 0
          ? clone.route[routeIndexA - 1]
          : undefined
      const nextPoint =
        typeof routeIndexB === "number" &&
        routeIndexB >= 0 &&
        routeIndexB < clone.route.length - 1
          ? clone.route[routeIndexB + 1]
          : undefined

      if (previousPoint && nextPoint) {
        ;({ x: unitX, y: unitY } = normalizeVector(
          nextPoint.x - previousPoint.x,
          nextPoint.y - previousPoint.y,
        ))
      }
    }

    const halfSpacing = targetSpacing / 2

    const newViaA = {
      x: centerX - unitX * halfSpacing,
      y: centerY - unitY * halfSpacing,
    }
    const newViaB = {
      x: centerX + unitX * halfSpacing,
      y: centerY + unitY * halfSpacing,
    }

    clone.vias[i] = newViaA
    clone.vias[i + 1] = newViaB

    if (typeof routeIndexA === "number" && routeIndexA >= 0) {
      clone.route[routeIndexA] = {
        ...clone.route[routeIndexA],
        x: newViaA.x,
        y: newViaA.y,
      }
    }
    if (typeof routeIndexB === "number" && routeIndexB >= 0) {
      clone.route[routeIndexB] = {
        ...clone.route[routeIndexB],
        x: newViaB.x,
        y: newViaB.y,
      }
    }
  }

  return clone
}

export class JumperTracePathSolver extends BaseSolver {
  private params: JumperTracePathSolverParams
  private jumperRoutes: HighDensityIntraNodeRoute[] = []

  constructor(params: JumperTracePathSolverParams) {
    super()
    this.MAX_ITERATIONS = 1
    this.params = params
    this.stats.targetSpacing = params.targetSpacing
  }

  _step() {
    this.jumperRoutes = this.params.hdRoutes.map((route) =>
      createJumperRoute(route, this.params.targetSpacing),
    )
    this.solved = true
  }

  getJumperRoutes(): HighDensityIntraNodeRoute[] {
    return this.jumperRoutes
  }
}
