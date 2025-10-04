import { beforeAll, describe, expect, test } from "bun:test"
import { CapacityMeshSolver } from "lib"
import { convertToCircuitJson } from "lib/testing/utils/convertToCircuitJson"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import bugReport from "../../examples/bug-reports/bugreport8-e3ec95/bugreport8-e3ec95.json" assert {
  type: "json",
}
import type { SimpleRouteJson, SimplifiedPcbTraces } from "lib/types"

const srj = bugReport.simple_route_json as SimpleRouteJson

describe("bugreport8-e3ec95 DRC regression", () => {
  let solver: CapacityMeshSolver
  let circuitJson: ReturnType<typeof convertToCircuitJson>
  let simplifiedTraces: SimplifiedPcbTraces

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

    simplifiedTraces = solver.getOutputSimplifiedPcbTraces()

    circuitJson = convertToCircuitJson(
      srjWithPointPairs,
      simplifiedTraces,
      srj.minTraceWidth,
    )
  })

  test("autorouter uses available inner layers", () => {
    const usedWireLayers = new Set<string>()

    for (const trace of simplifiedTraces) {
      for (const segment of trace.route) {
        if (segment.route_type === "wire") {
          usedWireLayers.add(segment.layer)
        }
      }
    }

    const usesInnerLayer = Array.from(usedWireLayers).some(
      (layer) => layer !== "top" && layer !== "bottom",
    )

    expect(usesInnerLayer).toBe(true)
  })

  test("produces routes without DRC violations", () => {
    const errors = checkEachPcbTraceNonOverlapping(circuitJson)
    expect(errors).toHaveLength(0)
  })
})
