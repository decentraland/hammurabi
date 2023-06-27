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

async function buildBundle(entryPoint, output) {
  const context = await esbuild.context({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'browser',
    outfile: output,
    sourcemap: process.env.NO_SOURCEMAP ? undefined : 'linked',
    minify: PRODUCTION,
    external: [
      'react', 'react-dom', 'react-dom/client',
      '@babylonjs/core', '@babylonjs/inspector', '@babylonjs/materials', '@babylonjs/loaders', '@babylonjs/gui'
    ],
    plugins: [
      nodeBuiltIns(),
      externalGlobalPlugin({
        'react': 'window.React',
        'react-dom': 'window.ReactDOM',
        'react-dom/client': 'window.ReactDOM',
        '@babylonjs/core': 'window.BABYLON',
        '@babylonjs/inspector': 'window.BABYLON.Inspector',
        '@babylonjs/materials': 'window.BABYLON',
        '@babylonjs/loaders/glTF/glTFFileLoader': 'window.BABYLON',
        '@babylonjs/loaders/glTF/2.0': 'window.BABYLON.GLTF2',
        '@babylonjs/gui': 'window.BABYLON.GUI',
      })
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
  const ctxWorker = await buildBundle('src/runtime/index.ts', 'static/js/scene-runtime.worker.js')

  const ctxMain = await buildBundle('src/explorer/index.ts', 'static/js/bundle.js')

  if (WATCH_MODE) {
    let { host, port } = await ctxMain.serve({
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