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

      // Remove the netIsAssignable flag since we've assigned it
      obstacle.netIsAssignable = false

      // Track this as a newly assigned obstacle
      this.newlyAssignedObstacleIndices.add(closestObstacle.index)

      // Split the connection into two new connections based on the via layers
      const connectionIndex = this.outputSrj.connections.findIndex(
        (c) => c.name === connectionName,
      )

      if (connectionIndex !== -1) {
        const originalConnection = this.outputSrj.connections[connectionIndex]

        // Split points by layer - each new connection will have points on only ONE layer
        const fromLayerPoints = originalConnection.pointsToConnect.filter(
          (p) => p.layer === via.fromLayer,
        )
        const toLayerPoints = originalConnection.pointsToConnect.filter(
          (p) => p.layer === via.toLayer,
        )

        // Only split if we have points on both layers
        if (fromLayerPoints.length > 0 && toLayerPoints.length > 0) {
          // Create obstacle points for each layer
          // Each connection gets an obstacle point on ITS layer
          const obstaclePointFromLayer = {
            x: obstacle.center.x,
            y: obstacle.center.y,
            layer: via.fromLayer,
          }

          const obstaclePointToLayer = {
            x: obstacle.center.x,
            y: obstacle.center.y,
            layer: via.toLayer,
          }

          // Create two new connections, each with points on only ONE layer
          const connection1Name = `${connectionName}_${via.fromLayer}`
          const connection2Name = `${connectionName}_${via.toLayer}`

          // Connection 1: fromLayer points + obstacle point (all on fromLayer)
          const connection1 = {
            ...originalConnection,
            name: connection1Name,
            pointsToConnect: [...fromLayerPoints, obstaclePointFromLayer],
          }

          // Connection 2: toLayer points + obstacle point (all on toLayer)
          const connection2 = {
            ...originalConnection,
            name: connection2Name,
            pointsToConnect: [...toLayerPoints, obstaclePointToLayer],
          }

          // Remove the original connection name from the obstacle
          const originalConnectionIdx = obstacle.connectedTo.indexOf(connectionName)
          if (originalConnectionIdx !== -1) {
            obstacle.connectedTo.splice(originalConnectionIdx, 1)
          }

          // Add the new connection names to the obstacle's connectedTo array
          if (!obstacle.connectedTo.includes(connection1Name)) {
            obstacle.connectedTo.push(connection1Name)
          }
          if (!obstacle.connectedTo.includes(connection2Name)) {
            obstacle.connectedTo.push(connection2Name)
          }

          // Remove original connection and add the two new ones
          this.outputSrj.connections.splice(connectionIndex, 1)
          this.outputSrj.connections.push(connection1, connection2)
        } else {
          // If we can't split, just add the connection name as before
          if (!obstacle.connectedTo.includes(connectionName)) {
            obstacle.connectedTo.push(connectionName)
          }
        }
      } else {
        // If connection not found, just add the connection name
        if (!obstacle.connectedTo.includes(connectionName)) {
          obstacle.connectedTo.push(connectionName)
        }
      }
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

    // Add all pointsToConnect as circles
    if (!graphicsObject.circles) {
      graphicsObject.circles = []
    }
    for (const connection of srjToVisualize.connections) {
      for (const point of connection.pointsToConnect) {
        graphicsObject.circles.push({
          center: { x: point.x, y: point.y },
          radius: 0.15,
          fill: "rgba(0, 0, 255, 0.7)",
          stroke: "rgba(0, 0, 255, 1)",
          layer: `z${mapLayerNameToZ(point.layer, layerCount)}`,
          label: `${connection.name}\n${point.layer}`,
        })
      }
    }

    return graphicsObject
  }
}
