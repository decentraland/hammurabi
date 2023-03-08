#!/usr/bin/env node

const esbuild = require('esbuild')
const child_process = require('child_process')
const { future } = require('fp-future')

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

async function main() {
  const context = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'browser',
    outfile: 'static/js/bundle.js',
    sourcemap: process.env.NO_SOURCEMAP ? undefined : 'linked',
    minify: PRODUCTION,
    plugins: [
      nodeBuiltIns()
    ]
  })

  if (WATCH_MODE) {
    let { host, port } = await context.serve({
      servedir: 'static',
    })
    console.log(`> Serving on http://${host}:${port}`)
  } else {
    console.time(`> Building static files`)
    await context.rebuild()
    await context.dispose()
    console.timeEnd(`> Building static files`)
  }

  await runTypeChecker()
}

main().catch(err => {
  process.exitCode = 1
  console.error(err)
})

function runTypeChecker() {
  const args = [require.resolve('typescript/lib/tsc'), '-p', 'tsconfig.json']
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