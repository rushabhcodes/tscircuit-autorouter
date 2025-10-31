import { beforeAll, describe, expect, test } from "bun:test"
import { CapacityMeshSolver } from "lib"
import { CapacityMeshNodeSolver } from "lib/solvers/CapacityMeshSolver/CapacityMeshNodeSolver1"
import { convertToCircuitJson } from "lib/testing/utils/convertToCircuitJson"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import bugReport from "../../examples/bug-reports/bugreport10-ac9ecf/bugreport10-ac9ecf.json" assert {
  type: "json",
}
import type { SimpleRouteJson } from "lib/types"
import { isRectCompletelyInsidePolygon } from "@tscircuit/math-utils"

const srj = bugReport.simple_route_json as SimpleRouteJson

describe("bug report bugreport10-ac9ecf", () => {
  let solver: CapacityMeshSolver
  let circuitJson: ReturnType<typeof convertToCircuitJson>
  let pcbSvg: string

  beforeAll(() => {
    solver = new CapacityMeshSolver(srj)
    solver.solve()

    if (solver.failed || !solver.solved) {
      throw new Error(`Solver failed: ${solver.error ?? "unknown"}`)
    }

    const srjWithPointPairs = solver.srjWithPointPairs
    if (!srjWithPointPairs) {
      throw new Error("Solver did not produce point pairs SRJ")
    }

    const simplifiedTraces = solver.getOutputSimplifiedPcbTraces()

    circuitJson = convertToCircuitJson(
      srjWithPointPairs,
      simplifiedTraces,
      srj.minTraceWidth,
    )

    pcbSvg = convertCircuitJsonToPcbSvg(circuitJson)
  })

  test("matches expected PCB snapshot", () => {
    expect(pcbSvg).toMatchSvgSnapshot(import.meta.path)
  })

  test("produces routes without DRC violations", () => {
    const errors = checkEachPcbTraceNonOverlapping(circuitJson)
    expect(errors).toHaveLength(0)
  })

  test("capacity mesh nodes outside of the outline are treated as blocked", () => {
    const nodeSolver = new CapacityMeshNodeSolver(srj)
    nodeSolver.solve()

    const nodesWithOutlineLeak = nodeSolver.finishedNodes.filter((node) => {
      if (!srj.outline) return false

      const rect = {
        center: { x: node.center.x, y: node.center.y },
        width: node.width,
        height: node.height,
      }

      const outsideOutline = !isRectCompletelyInsidePolygon(rect, srj.outline)

      return outsideOutline && node._containsObstacle !== true
    })

    expect(nodesWithOutlineLeak).toHaveLength(0)
  })
})
