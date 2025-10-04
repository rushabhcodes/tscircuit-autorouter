import { beforeAll, describe, expect, test } from "bun:test"
import { CapacityMeshSolver } from "lib"
import { convertToCircuitJson } from "lib/testing/utils/convertToCircuitJson"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import bugReport from "../../examples/bug-reports/bugreport8-e3ec95/bugreport8-e3ec95.json" assert {
  type: "json",
}
import type { SimpleRouteJson } from "lib/types"

describe("bugreport8-e3ec95", () => {
  const srj = bugReport.simple_route_json as SimpleRouteJson

  let pcbSvg: string

  beforeAll(() => {
    const solver = new CapacityMeshSolver(srj)
    solver.solve()

    if (solver.failed || !solver.solved) {
      throw new Error(`Solver failed: ${solver.error ?? "unknown"}`)
    }

    const srjWithPointPairs = solver.srjWithPointPairs
    if (!srjWithPointPairs) {
      throw new Error("Solver did not produce point pairs SRJ")
    }

    const simplifiedTraces = solver.getOutputSimplifiedPcbTraces()

    const circuitJson = convertToCircuitJson(
      srjWithPointPairs,
      simplifiedTraces,
      srj.minTraceWidth,
    )

    pcbSvg = convertCircuitJsonToPcbSvg(circuitJson)
  })

  test("matches expected PCB snapshot", () => {
    expect(pcbSvg).toMatchSvgSnapshot(import.meta.path)
  })
})
