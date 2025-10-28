import { SimpleRouteJson, SimplifiedPcbTrace } from "lib/types"
import { BaseSolver } from "../BaseSolver"
import { AutoroutingPipelineSolverOptions } from "../AutoroutingPipelineSolver"
import { convertSrjToGraphicsObject } from "lib/utils/convertSrjToGraphicsObject"
import { mapLayerNameToZ } from "lib/utils/mapLayerNameToZ"
import type { GraphicsObject } from "graphics-debug"

interface ObstacleAssignmentSolverInput {
  inputSrj: SimpleRouteJson
  vias: Array<{
    x: number
    y: number
    fromLayer: string
    toLayer: string
    trace: SimplifiedPcbTrace
  }>
}

export class ObstacleAssignmentSolver extends BaseSolver {
  inputSrj: SimpleRouteJson
  outputSrj?: SimpleRouteJson
  vias: Array<{
    x: number
    y: number
    fromLayer: string
    toLayer: string
    trace: SimplifiedPcbTrace
  }>
  currentViaIndex: number = 0
  newlyAssignedObstacleIndices: Set<number> = new Set()

  constructor(input: ObstacleAssignmentSolverInput) {
    super()
    this.inputSrj = input.inputSrj
    this.vias = input.vias
  }

  _step() {
    // Clone the input SRJ to create the output on first step
    if (!this.outputSrj) {
      this.outputSrj = structuredClone(this.inputSrj)
    }

    // Check if we've processed all vias
    if (this.currentViaIndex >= this.vias.length) {
      this.solved = true
      return
    }

    if (!this.outputSrj) {
      throw new Error("outputSrj should be defined at this point")
    }

    // Find all assignable obstacles
    const assignableObstacles = this.outputSrj.obstacles
      .map((obstacle, index) => ({ obstacle, index }))
      .filter(({ obstacle }) => obstacle.netIsAssignable)

    if (assignableObstacles.length === 0) {
      this.solved = true
      return
    }

    // Process one via per iteration
    const via = this.vias[this.currentViaIndex]
    let closestObstacle: {
      obstacle: any
      index: number
      distance: number
    } | null = null

    for (const { obstacle, index } of assignableObstacles) {
      // Check if the obstacle is on one of the via's layers
      const isOnViaLayer =
        obstacle.layers.includes(via.fromLayer) ||
        obstacle.layers.includes(via.toLayer)

      if (!isOnViaLayer) {
        continue
      }

      // Calculate distance from via to obstacle center
      const distance = Math.sqrt(
        (via.x - obstacle.center.x) ** 2 + (via.y - obstacle.center.y) ** 2,
      )

      if (closestObstacle === null || distance < closestObstacle.distance) {
        closestObstacle = { obstacle, index, distance }
      }
    }

    // If we found a closest obstacle, assign it to the via's net
    if (closestObstacle && this.outputSrj) {
      const obstacle = this.outputSrj.obstacles[closestObstacle.index]
      const connectionName = via.trace.connection_name

      // Add the connection name to the obstacle's connectedTo array if not already present
      if (!obstacle.connectedTo.includes(connectionName)) {
        obstacle.connectedTo.push(connectionName)
      }

      // Remove the netIsAssignable flag since we've assigned it
      obstacle.netIsAssignable = false

      // Track this as a newly assigned obstacle
      this.newlyAssignedObstacleIndices.add(closestObstacle.index)
    }

    // Move to the next via
    this.currentViaIndex++
  }

  getOutputSrj(): SimpleRouteJson {
    if (!this.outputSrj) {
      throw new Error("ObstacleAssignmentSolver has not been solved yet")
    }
    return this.outputSrj
  }

  visualize(): GraphicsObject {
    // Start with regular SRJ visualization
    const srjToVisualize = this.outputSrj ?? this.inputSrj
    const graphicsObject = convertSrjToGraphicsObject(srjToVisualize)
    const layerCount = 2

    // Add strokes and labels to obstacles where netIsAssignable or newly assigned
    graphicsObject.rects = srjToVisualize.obstacles.map((obstacle, index) => {
      const isAssignable = obstacle.netIsAssignable
      const isNewlyAssigned = this.newlyAssignedObstacleIndices.has(index)

      let stroke = "none"
      let strokeWidth = 0

      if (isNewlyAssigned) {
        // Green stroke for newly assigned obstacles
        stroke = "rgba(0, 255, 0, 1)"
        strokeWidth = 0.05
      } else if (isAssignable) {
        // Magenta stroke for assignable obstacles
        stroke = "rgba(255, 0, 255, 1)"
        strokeWidth = 0.05
      }

      // Build label showing layers and connections
      const layerInfo = `Layers: ${obstacle.layers.join(", ")}`
      const connectionInfo =
        obstacle.connectedTo.length > 0
          ? `Connected: ${obstacle.connectedTo.join(", ")}`
          : "Unconnected"
      const assignableInfo = isAssignable ? " (assignable)" : ""
      const newlyAssignedInfo = isNewlyAssigned ? " (newly assigned)" : ""
      const label = `${layerInfo}\n${connectionInfo}${assignableInfo}${newlyAssignedInfo}`

      return {
        center: obstacle.center,
        width: obstacle.width,
        height: obstacle.height,
        fill: "rgba(255,0,0,0.5)",
        layer: `z${obstacle.layers.map((l) => mapLayerNameToZ(l, layerCount)).join(",")}`,
        stroke,
        strokeWidth,
        label,
      }
    })

    return graphicsObject
  }
}
