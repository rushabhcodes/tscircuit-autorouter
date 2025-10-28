import { SimpleRouteJson, SimplifiedPcbTrace } from "lib/types"
import { BaseSolver } from "../BaseSolver"
import { AutoroutingPipelineSolverOptions } from "../AutoroutingPipelineSolver"

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

  constructor(input: ObstacleAssignmentSolverInput) {
    super()
    this.inputSrj = input.inputSrj
    this.vias = input.vias
  }

  _step() {
    // Clone the input SRJ to create the output
    this.outputSrj = structuredClone(this.inputSrj)

    // Find all assignable obstacles
    const assignableObstacles = this.outputSrj.obstacles
      .map((obstacle, index) => ({ obstacle, index }))
      .filter(({ obstacle }) => obstacle.netIsAssignable)

    if (assignableObstacles.length === 0) {
      this.solved = true
      return
    }

    if (!this.outputSrj) {
      throw new Error("outputSrj should be defined at this point")
    }

    // For each via, find the closest assignable obstacle
    for (const via of this.vias) {
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
      }
    }

    this.solved = true
  }

  getOutputSrj(): SimpleRouteJson {
    if (!this.outputSrj) {
      throw new Error("ObstacleAssignmentSolver has not been solved yet")
    }
    return this.outputSrj
  }
}
