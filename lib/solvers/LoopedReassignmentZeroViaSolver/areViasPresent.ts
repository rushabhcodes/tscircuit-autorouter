import { SimplifiedPcbTrace } from "lib/types"

export function areViasPresent(simplifiedPcbTraces: SimplifiedPcbTrace[]) {
  return simplifiedPcbTraces.some((trace) =>
    trace.route.some((segment) => segment.route_type === "via"),
  )
}
