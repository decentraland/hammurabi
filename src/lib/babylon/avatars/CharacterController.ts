// Based on https://github.com/ssatguru/BabylonJS-CharacterController

import { ArcRotateCamera, Scene, Vector3, AbstractMesh, CreateCapsule } from "@babylonjs/core"
import { colliderMaterial } from "../scene/logic/colliders"
import { DecentralandSystem } from "../../decentraland/system"
import { PLAYER_HEIGHT } from "../scene/logic/static-entities"
import { initKeyboard } from "../input"
import { addCrosshair } from "../visual/reticle"

export type CharacterStates = 'IDLE' | 'WALK' | 'JUMP' | 'FALL' | 'RUN'

export const movementSpeed = {
  WALK: 5,
  RUN: 10
}

export async function createCharacterControllerSystem(scene: Scene) {
  // init the character controller and input system

  const characterControllerSystem = new CharacterController(scene)

  // the height of steps which the player can climb
  characterControllerSystem.stepOffset = 0.3

  // the minimum and maximum slope the player can go up
  // between the two the player will start sliding down if it stops
  characterControllerSystem.setSlopeLimit(30, 60)

  initKeyboard(scene, characterControllerSystem)
  // Skip crosshair in headless mode - requires canvas context

  return characterControllerSystem
}

export class CharacterController implements DecentralandSystem {
  camera: ArcRotateCamera
  gravity = 9.8
  // slopeLimit in degrees
  minSlopeLimit = 30
  maxSlopeLimit = 45
  // slopeLimit in radians
  sl1 = (Math.PI * this.minSlopeLimit) / 180
  sl2 = (Math.PI * this.maxSlopeLimit) / 180

  /**
   * The av will step up a stair only if it is closer to the ground than the indicated value.
   * Default value is 0.25 m
   */
  stepOffset = 0.25
  // total amount by which the av has moved up
  vMoveTot = 0
  // position of av when it started moving up
  vMovStartPos = Vector3.Zero()

  animationStartPosition = Vector3.Zero()
  grounded = false
  // distance by which AV would move down if in freefall
  freeFallDist = 0
  inFreeFall = false
  moveVector = new Vector3()


  // verical position of AV when it is about to start a jump
  jumpStartPosY = 0
  // for how long the AV has been in the jump
  jumpTime = 0

  constructor(public scene: Scene) {
    this.capsule = CreateCapsule("player", { height: PLAYER_HEIGHT, radius: 0.4 }, scene)
    this.capsule.material = colliderMaterial(scene)

    this.camera = new ArcRotateCamera(
      "3rd person camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      15,
      new Vector3(0, 0, 0),
      this.scene
    )

    scene.activeCamera = this.camera

    //standard camera setting
    this.camera.wheelPrecision = 15
    this.camera.checkCollisions = true
    //make sure the keyboard keys controlling camera are different from those controlling player
    //here we will not use any keyboard keys to control camera
    this.camera.keysLeft = []
    this.camera.keysRight = []
    this.camera.keysUp = []
    this.camera.keysDown = []
    // how close can the camera come to player
    this.camera.lowerRadiusLimit = 0.5
    // how far can the camera go from the player
    this.camera.upperRadiusLimit = 20
    this.camera.radius = 8

    // Skip attachControl() in headless mode - not needed

    this.camera.inertia = 0.6
    this.camera.speed = 0.7
    this.camera.fov = Math.PI / 2
    this.camera.minZ = 0.1 // near plane
    this.camera.collisionRadius.setAll(this.camera.minZ)

    this.savedCameraCollision = this.camera.checkCollisions

    this.act = new _Action()

    this.act.reset()

    this.movFallTime = 0
    //first time we enter render loop, delta time is zero
    this.idleFallTime = 0.001
    this.grounded = false
    this.updateTargetValue()
  }

  setSlopeLimit(minSlopeLimit: number, maxSlopeLimit: number) {
    this.minSlopeLimit = minSlopeLimit
    this.maxSlopeLimit = maxSlopeLimit

    this.sl1 = (Math.PI * this.minSlopeLimit) / 180
    this.sl2 = (Math.PI * this.maxSlopeLimit) / 180
  }

  update() {
    this.animationStartPosition.copyFrom(this.capsule.position)
    const dt: number = this.scene.getEngine().getDeltaTime() / 1000

    if (this.act.jump && !this.inFreeFall) {
      this.grounded = false
      this.idleFallTime = 0
      this.doJump(dt)
    } else if (this.anyMovement() || this.inFreeFall) {
      this.grounded = false
      this.idleFallTime = 0
      this.doMove(dt)
    } else if (!this.inFreeFall) {
      this.doIdle(dt)
    }

    // prevent precision errors with huge delta times and falling to the void
    if (this.capsule.position.y < -10) this.capsule.position.y = 10

    this.updateTargetValue()

    return
  }

  doJump(dt: number) {
    if (this.jumpTime === 0) {
      this.jumpStartPosY = this.capsule.position.y
    }

    this.jumpTime = this.jumpTime + dt

    const jumpDist = this.calcJumpDist(movementSpeed.WALK, dt)

    this.capsule.rotation.y = (3 * Math.PI) / 2 - this.camera.alpha

    this.calculateMovementVector(dt)
    this.moveVector.y = jumpDist

    // moveWithCollision only seems to happen if length of displacment is atleast 0.001
    this.capsule.moveWithCollisions(this.moveVector)
    if (jumpDist < 0) {
      // this.avatar.ellipsoid.y=this._ellipsoid.y;
      // check if going up a slope or back on flat ground
      if (
        this.capsule.position.y > this.animationStartPosition.y ||
        (this.capsule.position.y === this.animationStartPosition.y && this.moveVector.length() > 0.001)
      ) {
        this.endJump()
      } else if (this.capsule.position.y < this.jumpStartPosY) {
        // the avatar is below the point from where it started the jump
        // so it is either in free fall or is sliding along a downward slope
        // 
        // if the actual displacemnt is same as the desired displacement then AV is in freefall
        // else it is on a slope
        const actDisp = this.capsule.position.subtract(this.animationStartPosition)
        if (!areVectorsEqual(actDisp, this.moveVector, 0.001)) {
          // AV is on slope
          // Should AV continue to slide or stop?
          // if slope is less steeper than acceptable then stop else slide
          if (verticalSlope(actDisp) <= this.sl1) {
            this.endJump()
          }
        } else {
          return 'falling'
        }
      }
    }
    return 'jumping'
  }

  calcJumpDist(speed: number, dt: number): number {
    // up velocity at the begining of the lastt frame (v=u+at)
    let js: number = speed - this.gravity * this.jumpTime
    // distance travelled up since last frame to this frame (s=ut+1/2*at^2)
    let jumpDist: number = js * dt - 0.5 * this.gravity * dt * dt
    return jumpDist
  }

  /**
   * does cleanup at the end of a jump
   */
  endJump() {
    this.act.jump = false
    this.jumpTime = 0
  }

  calculateMovementVector(dt: number): boolean {
    let moving = false
    // first get the direction of the movement in 2D x,z
    const direction = Vector3.Zero()
    let amount = 0

    if (this.act.stepLeft) {
      direction.x -= 1
      amount++
    }
    if (this.act.stepRight) {
      direction.x += 1
      amount++
    }
    if (this.act.walk) {
      direction.z += 1
      amount++
    }
    if (this.act.walkback) {
      direction.z -= 1
      amount++
    }

    if (amount) {
      direction.normalize()

      // then apply the camera rotation to this direction and place result into this.moveVector
      direction.applyRotationQuaternionToRef(this.camera.absoluteRotation, this.moveVector)

      // then apply the speed to the movement vector
      const speed = this.act.speedMod ? movementSpeed.RUN : movementSpeed.WALK

      this.moveVector.scaleInPlace(speed * dt)

      // finally adjust the Y component for jump/falling
      this.moveVector.y = 0

      moving = true
    } else {
      moving = false
    }

    if (this.freeFallDist) {
      this.moveVector.y = -this.freeFallDist
      moving = true
    }

    return moving
  }

  //for how long has the av been falling while moving
  movFallTime: number = 0
  doMove(dt: number) {
    // initial down velocity
    const u: number = this.movFallTime * this.gravity
    // calculate the distance by which av should fall down since last frame
    // assuming it is in freefall
    this.freeFallDist = u * dt + this.gravity * dt * dt
    this.movFallTime = this.movFallTime + dt

    const moving: boolean = this.calculateMovementVector(dt)

    if (moving) {
      if (this.moveVector.length() > 0.001) {
        this.capsule.moveWithCollisions(this.moveVector)
        // walking up a slope
        if (this.capsule.position.y > this.animationStartPosition.y) {
          const actDisp = this.capsule.position.subtract(this.animationStartPosition)
          const slp: number = verticalSlope(actDisp)
          if (slp >= this.sl2) {
            //this._climbingSteps=true;
            //is av trying to go up steps
            if (this.stepOffset > 0) {
              if (this.vMoveTot == 0) {
                //if just started climbing note down the position
                this.vMovStartPos.copyFrom(this.animationStartPosition)
              }
              this.vMoveTot = this.vMoveTot + (this.capsule.position.y - this.animationStartPosition.y)
              if (this.vMoveTot > this.stepOffset) {
                //move av back to its position at begining of steps
                this.vMoveTot = 0
                this.capsule.position.copyFrom(this.vMovStartPos)
                this.endFreeFall()
              }
            } else {
              //move av back to old position
              this.capsule.position.copyFrom(this.animationStartPosition)
              this.endFreeFall()
            }
          } else {
            this.vMoveTot = 0
            if (slp > this.sl1) {
              //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
              this.inFreeFall = false
            } else {
              //continue walking
              this.endFreeFall()
            }
          }
        } else if (this.capsule.position.y < this.animationStartPosition.y) {
          const actDisp = this.capsule.position.subtract(this.animationStartPosition)
          if (!areVectorsEqual(actDisp, this.moveVector, 0.001)) {
            //AV is on slope
            //Should AV continue to slide or walk?
            //if slope is less steeper than acceptable then walk else slide
            if (verticalSlope(actDisp) <= this.sl1) {
              this.endFreeFall()
            } else {
              //av is on a steep slope , continue increasing the moveFallTIme to deaccelerate it
              this.inFreeFall = false
            }
          } else {
            this.inFreeFall = true
          }
        } else {
          this.endFreeFall()
        }
      }
    }
  }

  endFreeFall(): void {
    this.movFallTime = 0
    this.inFreeFall = false
  }

  //for how long has the av been falling while idle (not moving)
  idleFallTime: number = 0
  doIdle(dt: number): void {
    if (this.grounded) {
      return
    }
    this.movFallTime = 0

    if (dt === 0) {
      this.freeFallDist = 5
    } else {
      const u: number = this.idleFallTime * this.gravity
      this.freeFallDist = u * dt + this.gravity * dt * dt
      this.idleFallTime = this.idleFallTime + dt
    }
    //if displacement is less than 0.01(? need to verify further) then
    //moveWithDisplacement down against a surface seems to push the AV up by a small amount!!
    if (this.freeFallDist < 0.01) return
    const disp = new Vector3(0, -this.freeFallDist, 0)
    this.capsule.rotation.y = (3 * Math.PI) / 2 - this.camera.alpha
    this.capsule.moveWithCollisions(disp)
    if (this.capsule.position.y > this.animationStartPosition.y || this.capsule.position.y === this.animationStartPosition.y) {
      //                this.grounded = true;
      //                this.idleFallTime = 0;
      this.groundIt()
    } else if (this.capsule.position.y < this.animationStartPosition.y) {
      //AV is going down.
      //AV is either in free fall or is sliding along a downward slope
      //
      //if the actual displacemnt is same as the desired displacement then AV is in freefall
      //else it is on a slope
      const actDisp = this.capsule.position.subtract(this.animationStartPosition)
      if (!areVectorsEqual(actDisp, disp, 0.001)) {
        //AV is on slope
        //Should AV continue to slide or stop?
        //if slope is less steeper than accebtable then stop else slide
        if (verticalSlope(actDisp) <= this.sl1) {
          //                        this.grounded = true;
          //                        this.idleFallTime = 0;
          this.groundIt()
          this.capsule.position.copyFrom(this.animationStartPosition)
        } else {
          this.unGroundIt()
        }
      }
    }
  }

  groundFrameCount = 0
  groundFrameMax = 10
  /**
   * donot ground immediately
   * wait few more frames
   */
  groundIt(): void {
    this.groundFrameCount++
    if (this.groundFrameCount > this.groundFrameMax) {
      this.grounded = true
      this.idleFallTime = 0
    }
  }
  unGroundIt() {
    this.grounded = false
    this.groundFrameCount = 0
  }

  savedCameraCollision: boolean = true
  inFirstPerson = false

  updateTargetValue() {
    // // donot move camera if av is trying to clinb steps
    // if (this.vMoveTot == 0)
    //   this.playerEntity.position.addToRef(this.cameraTarget, this.camera.target);

    // if user so desire, make the AV invisible if camera comes close to it
    if (this.camera.radius <= this.camera.lowerRadiusLimit!) {
      if (!this.inFirstPerson) {
        this.camera.checkCollisions = false
        this.inFirstPerson = true
      }
    } else {
      if (this.inFirstPerson) {
        this.inFirstPerson = false
        this.camera.checkCollisions = this.savedCameraCollision
      }
    }
  }

  anyMovement(): boolean {
    return this.act.walk || this.act.walkback || this.act.stepLeft || this.act.stepRight
  }

  // control movement by commands rather than keyboard.
  walk(b: boolean) {
    this.act.walk = b
  }
  walkBack(b: boolean) {
    this.act.walkback = b
  }
  walkBackFast(b: boolean) {
    this.act.walkback = b
    this.act.speedMod = b
  }
  run(b: boolean) {
    this.act.walk = b
    this.act.speedMod = b
  }
  strafeLeft(b: boolean) {
    this.act.stepLeft = b
  }
  strafeLeftFast(b: boolean) {
    this.act.stepLeft = b
    this.act.speedMod = b
  }
  strafeRight(b: boolean) {
    this.act.stepRight = b
  }
  strafeRightFast(b: boolean) {
    this.act.stepRight = b
    this.act.speedMod = b
  }
  jump() {
    this.act.jump = true
  }
  idle() {
    this.act.reset()
  }

  act: _Action
  capsule: AbstractMesh

  teleport(position: Vector3) {
    this.moveVector.setAll(0)
    this.act.reset()
    this.capsule.position.copyFrom(position)
    this.inFreeFall = false
    this.animationStartPosition.copyFrom(position)
    this.idleFallTime = 0
    this.jumpTime = 0
    this.movFallTime = 0
    this.grounded = true
  }
}

class _Action {
  walk: boolean = false
  walkback: boolean = false
  stepRight: boolean = false
  stepLeft: boolean = false
  jump: boolean = false

  // speed modifier - changes speed of movement
  speedMod: boolean = true

  constructor() {
    this.reset()
  }

  reset() {
    this.walk = false
    this.walkback = false
    this.stepRight = false
    this.stepLeft = false
    this.jump = false
    this.speedMod = true
  }
}

export class ActionData {
  id: string
  speed: number

  constructor(id: string, speed = 1) {
    this.id = id
    this.speed = speed
  }
}

// checks if two vectors v1 and v2 are equal within a precision of p   
function areVectorsEqual(v1: Vector3, v2: Vector3, p: number) {
  return Math.abs(v1.x - v2.x) < p && Math.abs(v1.y - v2.y) < p && Math.abs(v1.z - v2.z) < p
}

// returns the slope (in radians) of a vector in the vertical plane
function verticalSlope(v: Vector3): number {
  return Math.atan(Math.abs(v.y / Math.sqrt(v.x * v.x + v.z * v.z)))
}
