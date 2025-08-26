#!/usr/bin/env node

console.log('🎮 Hammurabi CLI starting...')

// Polyfill XMLHttpRequest for Babylon.js GLTF loading in Node.js environment
if (typeof (globalThis as any).XMLHttpRequest === 'undefined') {
  class XMLHttpRequestPolyfill {
    UNSENT = 0
    OPENED = 1
    HEADERS_RECEIVED = 2
    LOADING = 3
    DONE = 4
    
    readyState = this.UNSENT
    status = 0
    statusText = ''
    responseText = ''
    response: any = null
    responseType = ''
    
    private _url = ''
    private _method = ''
    private _headers: Record<string, string> = {}
    private _listeners: Record<string, ((event: any) => void)[]> = {}
    
    onreadystatechange: (() => void) | null = null
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    
    open(method: string, url: string) {
      this._method = method
      this._url = url
      this.readyState = this.OPENED
      this._triggerReadyStateChange()
    }
    
    setRequestHeader(name: string, value: string) {
      this._headers[name] = value
    }
    
    async send() {
      this.readyState = this.LOADING
      this._triggerReadyStateChange()
      
      try {
        const response = await fetch(this._url, {
          method: this._method,
          headers: this._headers
        })
        
        this.status = response.status
        this.statusText = response.statusText
        this.readyState = this.HEADERS_RECEIVED
        this._triggerReadyStateChange()
        
        if (this.responseType === 'arraybuffer') {
          this.response = await response.arrayBuffer()
        } else {
          const text = await response.text()
          this.responseText = text
          this.response = text
        }
        
        this.readyState = this.DONE
        this._triggerReadyStateChange()
        this._triggerLoad()
      } catch (error) {
        console.error('XMLHttpRequest error:', error)
        this.readyState = this.DONE
        this.status = 0
        this._triggerReadyStateChange()
        this._triggerError()
      }
    }
    
    private _triggerReadyStateChange() {
      if (this.onreadystatechange) {
        this.onreadystatechange()
      }
      this._dispatchEvent('readystatechange', {})
    }
    
    private _triggerLoad() {
      if (this.onload) {
        this.onload()
      }
      this._dispatchEvent('load', {})
    }
    
    private _triggerError() {
      if (this.onerror) {
        this.onerror()
      }
      this._dispatchEvent('error', {})
    }
    
    private _dispatchEvent(type: string, event: any) {
      const listeners = this._listeners[type] || []
      listeners.forEach(listener => listener(event))
    }
    
    abort() {}
    getAllResponseHeaders() { return '' }
    getResponseHeader() { return null }
    
    addEventListener(type: string, listener: (event: any) => void) {
      if (!this._listeners[type]) {
        this._listeners[type] = []
      }
      this._listeners[type].push(listener)
    }
    
    removeEventListener(type: string, listener: (event: any) => void) {
      const listeners = this._listeners[type]
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index !== -1) {
          listeners.splice(index, 1)
        }
      }
    }
    
    dispatchEvent() { return true }
  }
  
  (globalThis as any).XMLHttpRequest = XMLHttpRequestPolyfill
}

import { main as runEngine, type EngineOptions } from './lib/engine-main'

console.log('✅ Engine module loaded')

declare const require: any
declare const module: any

interface CLIOptions {
  realm: string
  identity: {
    address: string
    isGuest: boolean
  }
  help: boolean
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    realm: 'localhost:8000',
    identity: {
      address: '0x' + '0'.repeat(40),
      isGuest: true
    },
    help: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--realm' && args[i + 1]) {
      options.realm = args[i + 1]
      i++
    } else if (arg.startsWith('--realm=')) {
      options.realm = arg.split('=')[1]
    } else if (arg === '--address' && args[i + 1]) {
      options.identity.address = args[i + 1]
      i++
    } else if (arg.startsWith('--address=')) {
      options.identity.address = arg.split('=')[1]
    } else if (arg === '--guest') {
      options.identity.isGuest = true
    } else if (arg === '--authenticated') {
      options.identity.isGuest = false
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    }
  }

  return options
}

function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Hammurabi Server - Decentraland Protocol           ║
╚═══════════════════════════════════════════════════════════╝

Usage: hammurabi [options]

Runs the Decentraland protocol in headless mode using Babylon.js NullEngine.

Options:
  --realm=<url>         Realm to connect to (default: localhost:8000)
  --address=<address>   User wallet address (default: 0x000...000)
  --guest               Run as guest user (default)
  --authenticated       Run as authenticated user
  --help, -h            Show this help message

Examples:
  # Run with default guest identity
  hammurabi --realm=localhost:8000
  
  # Run with custom wallet address
  hammurabi --realm=localhost:8000 --address=0x123...
  
  # Run as authenticated user
  hammurabi --address=0x123... --authenticated
`)
}

async function runHeadless(options: CLIOptions) {
  console.log('🚀 Starting headless mode...')
  console.log(`📡 Realm: ${options.realm}`)
  console.log(`👤 Identity: ${options.identity.address} (${options.identity.isGuest ? 'guest' : 'authenticated'})`)
  
  const engineOptions: EngineOptions = {
    realmUrl: options.realm
  }
  
  try {
    console.log('🔧 Initializing engine...')
    const scene = await runEngine(engineOptions)
    
    console.log('✅ Hammurabi running in headless mode')
    console.log('🎮 Engine scene initialized:', !!scene)
    console.log('Press Ctrl+C to stop')
    
    // Keep process alive
    process.stdin.resume()
    
    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down engine...')
      scene.dispose()
      scene.getEngine().dispose()
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ Failed to start engine:', error)
    console.error('Stack:', (error as Error).stack)
    console.log('🔄 Server attempting to continue despite engine error...')
    
    // Keep process alive even if engine fails to start
    process.stdin.resume()
    
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down...')
      process.exit(0)
    })
  }
}

async function main() {
  console.log('🎯 Main function called')
  const options = parseArgs()
  console.log('⚙️ Parsed options:', JSON.stringify(options, null, 2))
  
  if (options.help) {
    printHelp()
    return
  }
  
  await runHeadless(options)
}

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  console.error('Stack:', error.stack)
  console.log('🔄 Server continuing to run...')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  console.log('🔄 Server continuing to run...')
})

// Run the main function
console.log('🚀 Starting main function...')
main().catch(error => {
  console.error('❌ CLI Error:', error)
  console.error('Stack:', (error as Error).stack)
  console.log('🔄 Server continuing to run despite error...')
  
  // Keep process alive even after error
  process.stdin.resume()
  
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...')
    process.exit(0)
  })
})