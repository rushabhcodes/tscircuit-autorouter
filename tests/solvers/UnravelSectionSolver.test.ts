import { describe, expect, it } from "bun:test"
import { UnravelSectionSolver } from "lib/solvers/UnravelSolver/UnravelSectionSolver"
import type {
  SegmentPoint,
  SegmentPointId,
  UnravelCandidate,
  UnravelSameLayerCrossingIssue,
} from "lib/solvers/UnravelSolver/types"
import type { SegmentWithAssignedPoints } from "lib/solvers/CapacityMeshSolver/CapacitySegmentToPointSolver"

describe("UnravelSectionSolver multi-layer support", () => {
  const createSegmentPoint = (
    id: SegmentPointId,
    segmentId: string,
    z: number,
  ): SegmentPoint => ({
    segmentPointId: id,
    segmentId,
    x: 0,
    y: 0,
    z,
    connectionName: id,
    capacityMeshNodeIds: ["node"],
    directlyConnectedSegmentPointIds: [],
  })

  const createSegment = (
    id: string,
    availableZ: number[],
  ): SegmentWithAssignedPoints => ({
    nodePortSegmentId: id,
    capacityMeshNodeId: "node",
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
    availableZ,
    connectionNames: ["a", "b"],
  })

  const baseCandidate: UnravelCandidate = {
    operationsPerformed: 0,
    candidateHash: "",
    pointModifications: new Map(),
    issues: [],
    g: 0,
    h: 0,
    f: 0,
  }

  it("considers every common available layer when resolving same-layer crossings", () => {
    const solver = Object.create(
      UnravelSectionSolver.prototype,
    ) as UnravelSectionSolver

    const segmentPointMap = new Map<SegmentPointId, SegmentPoint>([
      ["A", createSegmentPoint("A", "seg-ab", 0)],
      ["B", createSegmentPoint("B", "seg-ab", 0)],
      ["C", createSegmentPoint("C", "seg-cd", 0)],
      ["D", createSegmentPoint("D", "seg-cd", 0)],
    ])

    solver.unravelSection = {
      segmentPointMap,
      mutableSegmentPointIds: new Set(["A", "B", "C", "D"]),
    } as unknown as UnravelSectionSolver["unravelSection"]

    solver.dedupedSegmentMap = new Map<string, SegmentWithAssignedPoints>([
      ["seg-ab", createSegment("seg-ab", [0, 1, 2, 3])],
      ["seg-cd", createSegment("seg-cd", [0, 2, 3])],
    ])

    const issue: UnravelSameLayerCrossingIssue = {
      type: "same_layer_crossing",
      probabilityOfFailure: 0.5,
      capacityMeshNodeId: "node",
      crossingLine1: ["A", "B"],
      crossingLine2: ["C", "D"],
    }

    const operations = solver.getOperationsForIssue(baseCandidate, issue)

    const pairOperations = operations
      .filter(
        (op): op is Extract<typeof op, { type: "change_layer" }> =>
          op.type === "change_layer" && op.segmentPointIds.length === 2,
      )
      .map((op) => ({
        newZ: op.newZ,
        ids: op.segmentPointIds.join(""),
      }))

    expect(pairOperations).toEqual(
      expect.arrayContaining([
        { newZ: 1, ids: "AB" },
        { newZ: 2, ids: "AB" },
        { newZ: 3, ids: "AB" },
        { newZ: 2, ids: "CD" },
        { newZ: 3, ids: "CD" },
      ]),
    )

    const singleOperationsForA = operations
      .filter(
        (op): op is Extract<typeof op, { type: "change_layer" }> =>
          op.type === "change_layer" &&
          op.segmentPointIds.length === 1 &&
          op.segmentPointIds[0] === "A",
      )
      .map((op) => op.newZ)

    expect(singleOperationsForA.sort()).toEqual([1, 2, 3])
  })
})
