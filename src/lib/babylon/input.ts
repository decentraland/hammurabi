import * as BABYLON from '@babylonjs/core'
import { interactWithScene } from './scene/logic/pointer-events'
import { InputAction, PointerEventType } from '@dcl/protocol/out-js/decentraland/sdk/components/common/input_action.gen'
import { CharacterController } from './avatars/CharacterController'

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

/// --- EXPORTS ---

export { Keys }

export function registerUpDownActionKeys(scene: BABYLON.Scene, key: string, action: InputAction, changer?: (pressed: boolean) => void) {
  scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction({
      trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: key
    }, () => {
      changer && changer(true)
      interactWithScene(PointerEventType.PET_DOWN, action)
    })
  )
  scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction({
      trigger: BABYLON.ActionManager.OnKeyUpTrigger, parameter: key
    }, () => {
      changer && changer(false)
      interactWithScene(PointerEventType.PET_UP, action)
    })
  )
}

export function initKeyboard(scene: BABYLON.Scene, characterController: CharacterController) {
  enableMouseLockBehaviorAndPointerEvents(scene)

  registerUpDownActionKeys(scene, 'e', InputAction.IA_PRIMARY)
  registerUpDownActionKeys(scene, 'f', InputAction.IA_SECONDARY)
  registerUpDownActionKeys(scene, '1', InputAction.IA_ACTION_3)
  registerUpDownActionKeys(scene, '2', InputAction.IA_ACTION_4)
  registerUpDownActionKeys(scene, '3', InputAction.IA_ACTION_5)
  registerUpDownActionKeys(scene, '4', InputAction.IA_ACTION_6)
  registerUpDownActionKeys(scene, ' ', InputAction.IA_JUMP, (active) => {
    if (active) characterController.jump()
  })
  registerUpDownActionKeys(scene, 'w', InputAction.IA_FORWARD)
  registerUpDownActionKeys(scene, 'a', InputAction.IA_LEFT)
  registerUpDownActionKeys(scene, 'd', InputAction.IA_RIGHT)
  registerUpDownActionKeys(scene, 's', InputAction.IA_BACKWARD)

  registerUpDownActionKeys(scene, 'w', InputAction.IA_WALK, (active) => characterController.walk(active))
  registerUpDownActionKeys(scene, 'a', InputAction.IA_WALK, (active) => characterController.strafeLeft(active))
  registerUpDownActionKeys(scene, 'd', InputAction.IA_WALK, (active) => characterController.strafeRight(active))
  registerUpDownActionKeys(scene, 's', InputAction.IA_WALK, (active) => characterController.walkBack(active))

  scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
    characterController.act.speedMod = evt.sourceEvent.shiftKey
  }));

  scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
    characterController.act.speedMod = evt.sourceEvent.shiftKey
  }));

  /**
   * This is a map of keys (see enum Keys): boolean
   */
  const keyState: {
    [keyCode: number]: boolean
    [keyName: string]: boolean
  } = {}

  // document.body.addEventListener('keydown', (e) => {
  //   keyState[Keys.KEY_SHIFT] = e.shiftKey
  //   keyState[Keys.KEY_CTRL] = e.ctrlKey
  //   keyState[e.keyCode] = true
  // })

  // document.body.addEventListener('keyup', (e) => {
  //   keyState[Keys.KEY_SHIFT] = e.shiftKey
  //   keyState[Keys.KEY_CTRL] = e.ctrlKey
  //   keyState[e.keyCode] = false
  // })

  return { keyState }
}

/**
 * Upon mouse interaction, if the canvas has no "pointerlock" then ignore the event and proceed
 * to request a "pointerlock".
 * 
 * Otherwise, handle the event via `interactWithScene`
 **/
export function enableMouseLockBehaviorAndPointerEvents(scene: BABYLON.Scene) {
  const hasPointerLock = () => false

  const canvas = scene.getEngine().getRenderingCanvas()

  if (canvas && !canvas.requestPointerLock) {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas['mozRequestPointerLock']
  }

  scene.onPointerObservable.add((e) => {
    if (e.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      if (hasPointerLock()) {
        // canvas?.focus()
        interactWithScene(PointerEventType.PET_DOWN, InputAction.IA_POINTER)
      } else {
        // canvas?.requestPointerLock()
        // canvas?.focus()
      }
    } else if (e.type === BABYLON.PointerEventTypes.POINTERUP) {
      if (hasPointerLock()) {
        interactWithScene(PointerEventType.PET_UP, InputAction.IA_POINTER)
      }
    }
  })
}
