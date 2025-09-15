import { beforeAll, describe, expect, setDefaultTimeout, test } from "bun:test"
import keyboard4 from "examples/assets/keyboard4.json" assert { type: "json" }
import { CapacityMeshSolver } from "../lib"
import { convertToCircuitJson } from "lib/testing/utils/convertToCircuitJson"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { AnyCircuitElement } from "circuit-json"
import type { SimpleRouteJson } from "lib/types"

let circuitJson: AnyCircuitElement[]

setDefaultTimeout(600_000)

beforeAll(async () => {
  const srj = keyboard4 as unknown as SimpleRouteJson
  const solver = new CapacityMeshSolver(srj, { capacityDepth: 10 })
  await solver.solve()
  circuitJson = convertToCircuitJson(
    srj,
    solver.getOutputSimplifiedPcbTraces(),
    srj.minTraceWidth,
  )
})

describe("keyboard4", () => {
  test("pcb snapshot", () => {
    const svg = convertCircuitJsonToPcbSvg(circuitJson)
    expect(svg).toMatchSvgSnapshot(import.meta.path)
  })

  test("passes DRC", () => {
    const errors = checkEachPcbTraceNonOverlapping(circuitJson)
    const MIN_CLEARANCE_MM = 0.06
    const blockingErrors = errors.filter((error) => {
      const gapMatch = error.message.match(/\(gap: ([0-9.]+)mm\)/)
      if (gapMatch) {
        const gap = Number.parseFloat(gapMatch[1])
        return Number.isNaN(gap) || gap < MIN_CLEARANCE_MM
      }
      return true
    })
    expect(blockingErrors.length).toBe(0)
  })
})
