import { describe, expect, test } from "bun:test"
import type { CapacityMeshNode } from "../lib/types"
import { CapacityMeshNodeSolver } from "../lib/solvers/CapacityMeshSolver/CapacityMeshNodeSolver1"
import { CapacityMeshNodeSolver2_NodeUnderObstacle } from "../lib/solvers/CapacityMeshSolver/CapacityMeshNodeSolver2_NodesUnderObstacles"
import { createSimpleRouteJsonWithOutline } from "./capacity-mesh-outline.fixture"

const baseSrj = createSimpleRouteJsonWithOutline()

const createNode = (
  id: string,
  center: { x: number; y: number },
  size: number,
): CapacityMeshNode => ({
  capacityMeshNodeId: id,
  center,
  width: size,
  height: size,
  layer: "top",
  availableZ: [0, 1],
})

describe("Capacity mesh node solvers with outline", () => {
  test("treat outline exterior as obstacle", () => {
    const solver = new CapacityMeshNodeSolver(baseSrj)

    const insideNode = createNode("inside", { x: 5, y: 5 }, 2)
    expect(solver.doesNodeOverlapObstacle(insideNode)).toBe(false)

    const partialNode = createNode("partial", { x: 1, y: 5 }, 2)
    expect(solver.doesNodeOverlapObstacle(partialNode)).toBe(true)
    expect(solver.isNodeCompletelyInsideObstacle(partialNode)).toBe(false)

    const outsideNode = createNode("outside", { x: 0, y: 5 }, 1)
    expect(solver.doesNodeOverlapObstacle(outsideNode)).toBe(true)
    expect(solver.isNodeCompletelyInsideObstacle(outsideNode)).toBe(true)
  })

  test("node under obstacle solver respects outline boundaries", () => {
    const solver = new CapacityMeshNodeSolver2_NodeUnderObstacle(baseSrj)

    const insideNode = createNode("inside", { x: 5, y: 5 }, 2)
    expect(solver.isNodeCompletelyOutsideBounds(insideNode)).toBe(false)
    expect(solver.isNodePartiallyOutsideBounds(insideNode)).toBe(false)

    const partialNode = createNode("partial", { x: 1, y: 5 }, 2)
    expect(solver.isNodeCompletelyOutsideBounds(partialNode)).toBe(false)
    expect(solver.isNodePartiallyOutsideBounds(partialNode)).toBe(true)

    const outsideNode = createNode("outside", { x: 0, y: 5 }, 1)
    expect(solver.isNodeCompletelyOutsideBounds(outsideNode)).toBe(true)
    expect(solver.isNodePartiallyOutsideBounds(outsideNode)).toBe(true)
  })
})
