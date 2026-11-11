import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'

const OUTPUT_DIR = '.vercel/output'
const FUNCTION_DIR = `${OUTPUT_DIR}/functions/api.func`

const writeJson = (path, data) => writeFile(path, `${JSON.stringify(data, null, 2)}\n`)

await rm(OUTPUT_DIR, { recursive: true, force: true })
await mkdir(FUNCTION_DIR, { recursive: true })

await cp('dist', `${OUTPUT_DIR}/static`, { recursive: true })

await build({
  entryPoints: ['server/vercel.ts'],
  outfile: `${FUNCTION_DIR}/index.mjs`,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: 'info',
})

await writeJson(`${FUNCTION_DIR}/.vc-config.json`, {
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: false,
  maxDuration: 30,
})

await writeJson(`${OUTPUT_DIR}/config.json`, {
  version: 3,
  routes: [
    { src: '^/assets/(.*)$', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
    { handle: 'filesystem' },
    { src: '^/api/(.*)$', dest: '/api?__path=$1' },
    { src: '^/(.*)$', dest: '/index.html' },
  ],
})

console.log(`Vercel Build Output готов: ${OUTPUT_DIR}`)
