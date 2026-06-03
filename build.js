#!/usr/bin/env node

const esbuild = require('esbuild')
const child_process = require('child_process')
const { future } = require('fp-future')
const { externalGlobalPlugin } = require('esbuild-plugin-external-global')


const WATCH_MODE = process.argv.includes('--watch')
const PRODUCTION = process.argv.includes('--production')

const builtIns = {
  fs: require.resolve('./src/throw'),
  path: require.resolve('./src/throw'),
}

const nodeBuiltIns = () => {
  const include = Object.keys(builtIns)
  if (!include.length) {
    throw new Error('Must specify at least one built-in module')
  }
  const filter = RegExp(`^(${include.join('|')})$`)
  return {
    name: 'node-builtins',
    setup(build) {
      build.onResolve({ filter }, (arg) => ({
        path: builtIns[arg.path],
      }))
    },
  }
}

const externals = {
  'react': 'window.React',
  'react-dom': 'window.ReactDOM',
  'react-dom/client': 'window.ReactDOM',
  'xterm': '{ Terminal: window.Terminal }',
  'livekit-client': 'window.LivekitClient',
  '@babylonjs/core': 'window.BABYLON',
  '@babylonjs/inspector': 'window.BABYLON.Inspector',
  '@babylonjs/materials': 'window.BABYLON',
  '@babylonjs/loaders/glTF/glTFFileLoader': 'window.BABYLON',
  '@babylonjs/loaders/glTF/2.0': 'window.BABYLON.GLTF2',
  '@babylonjs/gui': 'window.BABYLON.GUI',
}

async function buildBundle(entryPoints, output, options = { isWorker: false}) {
  const context = await esbuild.context({
    entryPoints: entryPoints,
    bundle: true,
    platform: 'browser',
    format: options.isWorker ? undefined : 'esm',
    outdir: options.isWorker ? undefined : output,
    outfile: options.isWorker ? output : undefined,
    sourcemap: 'linked',
    minify: PRODUCTION,
    splitting: !options.isWorker,
    external: Object.keys(externals),
    plugins: [
      nodeBuiltIns(),
      externalGlobalPlugin(externals)
    ]
  })

  if (WATCH_MODE) {
    await context.watch()
  } else {
    console.time(`> Building static files`)
    await context.rebuild()
    await context.dispose()
    console.timeEnd(`> Building static files`)
  }
  return context
}

async function main() {
  const workerCtx = await buildBundle(
    ['src/runtime/index.ts'],
    'static/js/scene-runtime.worker.js',
    { isWorker: true }
  )
  const ctx = await buildBundle([
    'src/explorer/index.ts',
    'src/explorer/bootstrap.ts',
    'src/explorer/dependencies.ts',
  ], 'static/js')

  if (WATCH_MODE) {
    let { host, port } = await ctx.serve({
      servedir: 'static',
      port: 8099
    })
    console.log(`> Serving on http://${host}:${port}`)
  }

  await runTypeChecker()
}

main().catch(err => {
  process.exitCode = 1
  console.error(err)
})

function runTypeChecker() {
  const args = [require.resolve('typescript/lib/tsc'), '-p', 'tsconfig.json', '--preserveWatchOutput']
  if (WATCH_MODE) args.push('--watch')

  console.time('> Running typechecker')
  const ts = child_process.spawn('node', args, { env: process.env, cwd: process.cwd(), encoding: 'utf8' })
  const typeCheckerFuture = future()

  ts.on('close', (code) => {
    console.timeEnd('> Running typechecker')
    console.log('  Type checker exit code:', code)
    if (code !== 0) {
      typeCheckerFuture.reject(new Error(`Typechecker exited with code ${code}.`))
      return
    }

    typeCheckerFuture.resolve(code)
  })

  ts.stdout.pipe(process.stdout)
  ts.stderr.pipe(process.stderr)

  if (WATCH_MODE) {
    typeCheckerFuture.resolve()
  }

  return typeCheckerFuture
}