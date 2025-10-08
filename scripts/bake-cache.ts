import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import keyboard4 from "../examples/legacy/assets/keyboard4.json"
import { CapacityMeshSolver, getGlobalInMemoryCache } from "../lib"
import type { SimpleRouteJson } from "../lib/types"

const DEFAULT_OUTPUT_PATH = "./keyboard4-cache.json"

async function ensureDirectoryExists(filePath: string) {
  const directory = dirname(filePath)
  await mkdir(directory, { recursive: true })
}

async function main() {
  const outputPathArg = process.argv[2]
  const outputPath = resolve(
    process.cwd(),
    outputPathArg ?? DEFAULT_OUTPUT_PATH,
  )

  const srj = keyboard4 as unknown as SimpleRouteJson
  const solver = new CapacityMeshSolver(srj)

  console.log(`Baking keyboard4 cache to ${outputPath}...`)

  solver.solve()

  if (solver.failed || !solver.solved) {
    const errorMessage = `Keyboard4 solver failed: ${solver.error ?? "unknown error"}`
    throw new Error(errorMessage)
  }

  const cache = getGlobalInMemoryCache()
  const cacheEntries = Array.from(cache.cache.entries())
  const cacheObject = Object.fromEntries(cacheEntries)

  await ensureDirectoryExists(outputPath)
  await writeFile(outputPath, JSON.stringify(cacheObject, null, 2), "utf-8")

  const completionMessage = `Cache baked successfully to ${outputPath}\n`
  process.stdout.write(completionMessage)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
