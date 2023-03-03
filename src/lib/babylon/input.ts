import * as BABYLON from '@babylonjs/core'

enum Keys {
  KEY_W = 87,
  KEY_A = 65,
  KEY_F = 70,
  KEY_S = 83,
  KEY_D = 68,

  KEY_LEFT = 37,
  KEY_UP = 38,
  KEY_RIGHT = 39,
  KEY_DOWN = 40,

  KEY_SHIFT = -1,
  KEY_CTRL = -2,
  KEY_SPACE = 32,

  KEY_E = 69,
  KEY_Q = 81,
}

function isFirstPersonCamera(scene: BABYLON.Scene) {
  return scene.activeCamera instanceof BABYLON.FreeCamera
}

/// --- EXPORTS ---

export { Keys }

export function initKeyboard(scene: BABYLON.Scene, firstPersonCamera: BABYLON.FreeCamera) {
  enableMouseLockBehavior(scene)

  firstPersonCamera.keysUp = [Keys.KEY_W, Keys.KEY_UP] // W
  firstPersonCamera.keysDown = [Keys.KEY_S, Keys.KEY_DOWN] // S
  firstPersonCamera.keysLeft = [Keys.KEY_A, Keys.KEY_LEFT] // A
  firstPersonCamera.keysRight = [Keys.KEY_D, Keys.KEY_RIGHT] // D

  /**
   * This is a map of keys (see enum Keys): boolean
   */
  const keyState: {
    [keyCode: number]: boolean
    [keyName: string]: boolean
  } = {}

  document.body.addEventListener('keydown', (e) => {
    keyState[Keys.KEY_SHIFT] = e.shiftKey
    keyState[Keys.KEY_CTRL] = e.ctrlKey
    keyState[e.keyCode] = true
  })

  document.body.addEventListener('keyup', (e) => {
    keyState[Keys.KEY_SHIFT] = e.shiftKey
    keyState[Keys.KEY_CTRL] = e.ctrlKey
    keyState[e.keyCode] = false
  })

  return { keyState }
}

export function interactWithScene(scene: BABYLON.Scene, pointerEvent: 'pointerUp' | 'pointerDown', x: number, y: number, pointerId: number) {
  // placeholder to handle the mouse event entity.handleClick(pointerEvent, pointerId, pickingResult!)
}

/**
 * Upon mouse interaction, if the canvas has no "pointerlock" then ignore the event and proceed
 * to request a "pointerlock".
 * 
 * Otherwise, handle the event via `interactWithScene`
 **/
export function enableMouseLockBehavior(scene: BABYLON.Scene) {
  const hasPointerLock = () => !!document.pointerLockElement

  const canvas = scene.getEngine().getRenderingCanvas()!

  if (!canvas.requestPointerLock) {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas['mozRequestPointerLock']
  }

  scene.onPointerObservable.add((e) => {
    if (e.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      const evt = e.event as PointerEvent
      if (hasPointerLock()) {
        canvas.focus()
        interactWithScene(scene, 'pointerDown', canvas.width / 2, canvas.height / 2, evt.pointerId)
      } else {
        canvas.requestPointerLock()
        canvas.focus()
      }
    } else if (e.type === BABYLON.PointerEventTypes.POINTERUP) {
      const evt = e.event as PointerEvent

      if (!isFirstPersonCamera(scene)) {
        interactWithScene(scene, 'pointerUp', evt.offsetX, evt.offsetY, evt.pointerId)
      } else if (hasPointerLock()) {
        interactWithScene(scene, 'pointerUp', canvas.width / 2, canvas.height / 2, evt.pointerId)
      }
    }
  })
}
