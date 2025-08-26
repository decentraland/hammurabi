import {
  WsSceneMessage,
  UpdateModelType
} from '@dcl/protocol/out-js/decentraland/sdk/development/local_development.gen'
import { loadSceneContextFromLocal, unloadScene } from './load'
import { sleep } from '../../misc/promises'
import { WebSocket } from 'ws'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

export type IPreviewComponent = {
  /**
   * Clean up resources used by preview features
   * If not in preview mode, this does nothing
   */
  stop(): Promise<void>
}

export async function initHotReload(baseUrl: string, entityId: string, reloadScene: () => void): Promise<IPreviewComponent> {
  const logger = console
  const { port } = new URL(baseUrl)

  let wsConnection: WebSocket | null = null  
  await start()

  async function start(): Promise<void> {
    console.log('init hot reload')
    try {
      wsConnection = new WebSocket(`ws://localhost:${port}`)
      wsConnection.binaryType = 'arraybuffer'
      wsConnection.onopen = () => {
        logger.log(`[Hot Reoad]: Connected to development server for scene: ${entityId}`)
      }

      wsConnection.onmessage = async (event) => {        
        console.log('onmessage')
        // Only decode if the data is binary (ArrayBuffer)
        if (event.data instanceof ArrayBuffer) {
          try {
            const uint8Array = new Uint8Array(event.data)
            const { message } = WsSceneMessage.decode(uint8Array)
            // TODO what happens if we change a model ?
            if (message?.$case === 'updateScene') {
              logger.log(`Change detected for scene: ${entityId}, reloading...`)
              reloadScene()
            }
          } catch (error: any) {
            logger.error(`Error handling binary message for scene ${entityId}: ${error.message}`)
          }
        }
      }

      wsConnection.onerror = (error) => {
        logger.error(`WebSocket error for scene ${entityId}:`)
        logger.error(error)
      }

      wsConnection.onclose = () => {
        logger.log(`Connection closed for scene: ${entityId}`)
      }
    } catch (error) {
      logger.error(`Failed to start watching scene ${entityId}:`)
      logger.error(String(error))
    }
  }

  async function shutdown(): Promise<void> {
    if (!wsConnection) {
      return
    }

    logger.log('Shutting down preview features')
    
    if (wsConnection && wsConnection.OPEN) {
      logger.log(`Stopping watcher for scene: ${entityId}`)
      wsConnection.close()
      wsConnection = null
    }
  }

  return {
    stop: shutdown
  }
}