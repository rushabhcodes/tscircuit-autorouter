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
      name: "conn-left-arm",
      pointsToConnect: [
        { x: -8, y: 8, layer: "top" },
        { x: -8, y: 1.5, layer: "top" },
      ],
    },
    {
      name: "conn-right-arm",
      pointsToConnect: [
        { x: 8, y: 8, layer: "bottom" },
        { x: 8, y: 1.5, layer: "bottom" },
      ],
    },
  ],
  bounds: { minX: -12, maxX: 12, minY: -12, maxY: 12 },
  outline: [
    { x: -10, y: 10 },
    { x: -10, y: -10 },
    { x: 10, y: -10 },
    { x: 10, y: 10 },
    { x: 4, y: 10 },
    { x: 4, y: 0 },
    { x: -4, y: 0 },
    { x: -4, y: 10 },
  ],
}

export default () => <AutoroutingPipelineDebugger srj={simpleRouteJson} />
