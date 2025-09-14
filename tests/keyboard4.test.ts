import { beforeAll, describe, expect, test } from "bun:test"
import keyboard4 from "examples/assets/keyboard4.json" assert { type: "json" }
import { CapacityMeshSolver } from "../lib"
import { convertToCircuitJson } from "lib/testing/utils/convertToCircuitJson"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { AnyCircuitElement } from "circuit-json"
import type { SimpleRouteJson } from "lib/types"

let circuitJson: AnyCircuitElement[]

beforeAll(async () => {
  const srj = keyboard4 as unknown as SimpleRouteJson
  const solver = new CapacityMeshSolver(srj)
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
    expect(errors.length).toBe(0)
  })
})
