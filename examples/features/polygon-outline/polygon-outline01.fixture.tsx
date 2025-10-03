import { AutoroutingPipelineDebugger } from "lib/testing/AutoroutingPipelineDebugger"
import type { SimpleRouteJson } from "lib/types"

const simpleRouteJson: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.2,
  obstacles: [
    {
      type: "rect",
      layers: ["top", "bottom"],
      center: { x: 0, y: 0 },
      width: 2.5,
      height: 2.5,
      connectedTo: [],
    },
  ],
  connections: [
    {
      name: "conn-top",
      pointsToConnect: [
        { x: -6, y: -4, layer: "top" },
        { x: 6, y: -4, layer: "top" },
      ],
    },
    {
      name: "conn-bottom",
      pointsToConnect: [
        { x: -2, y: 4, layer: "bottom" },
        { x: 2, y: 4, layer: "bottom" },
      ],
    },
  ],
  bounds: { minX: -12, maxX: 12, minY: -12, maxY: 12 },
  outline: [
    { x: -10, y: -8 },
    { x: 0, y: -10 },
    { x: 10, y: -8 },
    { x: 8, y: 8 },
    { x: 0, y: 10 },
    { x: -8, y: 8 },
  ],
}

export default () => <AutoroutingPipelineDebugger srj={simpleRouteJson} />
