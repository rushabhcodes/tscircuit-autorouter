import { describe, expect, test } from "bun:test"
import { FixedJumperAutorouterPipelineSolver } from "lib/solvers/FixedJumperAutorouterPipeline/FixedJumperAutorouterPipelineSolver"
import { JumperTracePathSolver } from "lib/solvers/FixedJumperAutorouterPipeline/JumperTracePathSolver"
import { HighDensityIntraNodeRoute } from "lib/types/high-density-types"
import { SimpleRouteJson } from "lib/types"

describe("JumperTracePathSolver", () => {
  test("repositions paired vias to target spacing", () => {
    const route: HighDensityIntraNodeRoute = {
      connectionName: "conn",
      traceThickness: 0.2,
      viaDiameter: 0.6,
      route: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 1, z: 1 },
        { x: 0, y: 1, z: 0 },
      ],
      vias: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
    }

    const targetSpacing = 0.815
    const solver = new JumperTracePathSolver({
      hdRoutes: [route],
      targetSpacing,
    })

    solver.step()

    const [adjustedRoute] = solver.getJumperRoutes()
    expect(adjustedRoute).toBeDefined()

    const [firstVia, secondVia] = adjustedRoute.vias
    const distance = Math.hypot(
      secondVia.x - firstVia.x,
      secondVia.y - firstVia.y,
    )
    expect(distance).toBeCloseTo(targetSpacing, 5)
  })
})

describe("FixedJumperAutorouterPipelineSolver", () => {
  const baseSrj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.2,
    obstacles: [],
    connections: [
      {
        name: "conn",
        pointsToConnect: [
          { x: 0, y: 0, layer: "top" },
          { x: 5, y: 0, layer: "top" },
        ],
      },
    ],
    bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
  }

  test("rejects bottom-layer connection points", () => {
    const invalidSrj: SimpleRouteJson = {
      ...baseSrj,
      connections: [
        {
          name: "conn",
          pointsToConnect: [
            { x: 0, y: 0, layer: "top" },
            { x: 5, y: 0, layer: "bottom" },
          ],
        },
      ],
    }

    expect(() => new FixedJumperAutorouterPipelineSolver(invalidSrj)).toThrow()
  })

  test("jumperDistance scales default spacing", () => {
    const spacingFactor = 2
    const pipeline = new FixedJumperAutorouterPipelineSolver(baseSrj, {
      jumperDistance: spacingFactor,
    })

    const expectedSpacing =
      FixedJumperAutorouterPipelineSolver.JUMPER_DISTANCE / spacingFactor

    expect((pipeline as any).targetJumperSpacing).toBeCloseTo(expectedSpacing)
  })

  test("throws when jumperDistance is non-positive", () => {
    expect(
      () =>
        new FixedJumperAutorouterPipelineSolver(baseSrj, { jumperDistance: 0 }),
    ).toThrow("jumperDistance must be greater than 0")
  })
})
