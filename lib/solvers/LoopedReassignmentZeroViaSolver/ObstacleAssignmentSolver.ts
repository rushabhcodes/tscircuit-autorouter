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
  vias: Array<{
    x: number
    y: number
    fromLayer: string
    toLayer: string
    trace: SimplifiedPcbTrace
  }>

  constructor(private input: ObstacleAssignmentSolverInput) {
    super()
    this.inputSrj = input.inputSrj
    this.vias = input.vias
  }

  _step() {
    throw new Error(
      `Not implemented, need to assign obstacles to vias to try to remove ${this.vias.length} vias`,
    )
  }
}
