import { AutoroutingPipelineDebugger } from "lib/testing/AutoroutingPipelineDebugger"
import { SimpleRouteJson } from "lib/types"

const simpleRouteJson: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.15,
  obstacles: [],
  connections: [],
  bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
}

export default () => {
  return <AutoroutingPipelineDebugger srj={simpleRouteJson} />
}
