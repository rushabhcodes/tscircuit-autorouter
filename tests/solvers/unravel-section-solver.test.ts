import { describe, expect, test } from "bun:test"
import { UnravelSectionSolver } from "../../lib/solvers/UnravelSolver/UnravelSectionSolver"
import { SegmentWithAssignedPoints } from "../../lib/solvers/CapacityMeshSolver/CapacitySegmentToPointSolver"
import { CapacityMeshNode } from "../../lib/types"
import { UnravelOperation } from "../../lib/solvers/UnravelSolver/types"

const isChangeLayerOperation = (
  operation: UnravelOperation,
): operation is Extract<UnravelOperation, { type: "change_layer" }> =>
  operation.type === "change_layer"

const createTestSolver = () => {
  const node: CapacityMeshNode = {
    capacityMeshNodeId: "node1",
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
    layer: "layer0",
    availableZ: [0, 1, 2, 3],
  }

  const segments: SegmentWithAssignedPoints[] = [
    {
      capacityMeshNodeId: "node1",
      nodePortSegmentId: "segA1",
      start: { x: -2, y: -2 },
      end: { x: -1, y: -1 },
      availableZ: [0, 1, 2, 3],
      connectionNames: ["netA"],
      assignedPoints: [
        {
          connectionName: "netA",
          point: { x: -1, y: -1, z: 0 },
        },
      ],
    },
    {
      capacityMeshNodeId: "node1",
      nodePortSegmentId: "segA2",
      start: { x: 1, y: 1 },
      end: { x: 2, y: 2 },
      availableZ: [0, 1, 2, 3],
      connectionNames: ["netA"],
      assignedPoints: [
        {
          connectionName: "netA",
          point: { x: 1, y: 1, z: 0 },
        },
      ],
    },
    {
      capacityMeshNodeId: "node1",
      nodePortSegmentId: "segB1",
      start: { x: -2, y: 2 },
      end: { x: -1, y: 1 },
      availableZ: [0, 1, 2, 3],
      connectionNames: ["netB"],
      assignedPoints: [
        {
          connectionName: "netB",
          point: { x: -1, y: 1, z: 0 },
        },
      ],
    },
    {
      capacityMeshNodeId: "node1",
      nodePortSegmentId: "segB2",
      start: { x: 1, y: -1 },
      end: { x: 2, y: -2 },
      availableZ: [0, 1, 2, 3],
      connectionNames: ["netB"],
      assignedPoints: [
        {
          connectionName: "netB",
          point: { x: 1, y: -1, z: 0 },
        },
      ],
    },
  ]

  const nodeIdToSegmentIds = new Map([
    ["node1", segments.map((segment) => segment.nodePortSegmentId!)],
  ])

  const segmentIdToNodeIds = new Map(
    segments.map((segment) => [segment.nodePortSegmentId!, ["node1"]]),
  )

  return new UnravelSectionSolver({
    rootNodeId: "node1",
    nodeMap: new Map([["node1", node]]),
    dedupedSegments: segments,
    nodeIdToSegmentIds,
    segmentIdToNodeIds,
  })
}

describe("UnravelSectionSolver", () => {
  test("proposes layer changes across all available layers for crossings", () => {
    const solver = createTestSolver()
    const candidate = solver.createInitialCandidate()
    const issue = candidate.issues.find(
      (item) => item.type === "same_layer_crossing",
    )

    if (!issue || issue.type !== "same_layer_crossing") {
      throw new Error("Expected a same layer crossing issue to be detected")
    }

    const operations = solver.getOperationsForIssue(candidate, issue)

    const segmentPairLayerChanges = operations
      .filter(
        (op): op is Extract<UnravelOperation, { type: "change_layer" }> =>
          isChangeLayerOperation(op) && op.segmentPointIds.length === 2,
      )
      .map((op) => op.newZ)

    const singlePointLayerChanges = operations
      .filter(
        (op): op is Extract<UnravelOperation, { type: "change_layer" }> =>
          isChangeLayerOperation(op) && op.segmentPointIds.length === 1,
      )
      .map((op) => op.newZ)

    expect([...new Set(segmentPairLayerChanges)].sort()).toEqual([1, 2, 3])
    expect([...new Set(singlePointLayerChanges)].sort()).toEqual([1, 2, 3])
  })
})
