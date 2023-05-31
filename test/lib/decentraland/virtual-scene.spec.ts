import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { CommsEvents, CommsTransportWrapper } from '../../../src/lib/decentraland/communications/CommsTransportWrapper'
import { createAvatarVirtualSceneSystem } from '../../../src/lib/decentraland/communications/comms-virtual-scene-system'
import mitt from 'mitt'
import { CrdtBuilder } from '../babylon/babylon-test-helper'
import { transformComponent } from '../../../src/lib/decentraland/sdk-components/transform-component'
import { Quaternion, Vector3 } from '@babylonjs/core'
import { playerIdentityDataComponent } from '../../../src/lib/decentraland/sdk-components/player-identity-data'

describe('virtual scene tests', () => {
  const events = mitt<CommsEvents>()
  const sendProfileRequest = jest.fn().mockResolvedValue(undefined)
  const transport = { events, sendProfileRequest: sendProfileRequest as any } as CommsTransportWrapper
  const scene = createAvatarVirtualSceneSystem(() => [transport], () => {})

  // run one tick to register the transport
  scene.update()

  const sub1 = scene.createSubscription()
  const sub2 = scene.createSubscription()

  test('ensure that the virtual scene increments the tick on each runTick call', () => {
    const buf1 = new ReadWriteByteBuffer()
    const buf2 = new ReadWriteByteBuffer()

    events.emit('position', {
      address: '0x123',
      data: {
        positionX: 1,
        positionY: 2,
        positionZ: 3,
        rotationX: 4,
        rotationY: 5,
        rotationZ: 6,
        rotationW: 7,
        index: 1,
        timestamp: 0
      }
    })
    scene.update()

    // write partial updates to buf1
    sub1.getUpdates(buf1)

    events.emit('position', {
      address: '0x123',
      data: {
        positionX: 9,
        positionY: 9,
        positionZ: 9,
        rotationX: 9,
        rotationY: 9,
        rotationZ: 9,
        rotationW: 9,
        index: 2,
        timestamp: 1
      }
    })
    scene.update()

    // write partial updates to buf1
    sub1.getUpdates(buf1)

    // write final updates to buf2
    sub2.getUpdates(buf2)

    // assertions

    // buf1 received two updates for the same component because getUpdates was called twice in between updates
    new CrdtBuilder()
      .put(playerIdentityDataComponent, 511, 1, {
        address: '0x123',
        isGuest: true,
        name: '0x123'
      })
      .put(transformComponent, 511, 1, {
        parent: 5,
        position: new Vector3(1, 2, 3),
        rotation: new Quaternion(4, 5, 6, 7),
        scale: Vector3.One()
      })
      .put(transformComponent, 511, 2, {
        parent: 5,
        position: new Vector3(9, 9, 9),
        rotation: new Quaternion(9, 9, 9, 9),
        scale: Vector3.One()
      })
      .mustEqual(buf1.toBinary())

    // buf2 instead only has the final state
    new CrdtBuilder()
      .put(playerIdentityDataComponent, 511, 1, {
        address: '0x123',
        isGuest: true,
        name: '0x123'
      })
      .put(transformComponent, 511, 2, {
        parent: 5,
        position: new Vector3(9, 9, 9),
        rotation: new Quaternion(9, 9, 9, 9),
        scale: Vector3.One()
      })
      .mustEqual(buf2.toBinary())

    // finally if no updates are received, no updates are written
    scene.update()
    const buf3 = new ReadWriteByteBuffer()
    sub2.getUpdates(buf3)
    expect(buf3.currentWriteOffset()).toEqual(0)
  })

  test('deleting an entity produces an entity deleted crdt message', () => {
    events.emit('PEER_DISCONNECTED', { address: '0x123' })
    scene.update()

    const buf1 = new ReadWriteByteBuffer()
    sub1.getUpdates(buf1)

    const buf2 = new ReadWriteByteBuffer()
    sub2.getUpdates(buf2)

    // assert same CRDT messages were emited
    const a = buf1.toBinary()
    const b = buf2.toBinary()
    expect(a).toEqual(b)

    // assert that the entity was deleted
    // buf2 instead only has the final state
    new CrdtBuilder()
      .deleteEntity(511)
      .delete(playerIdentityDataComponent, 511, 2)
      .delete(transformComponent, 511, 3)
      .mustEqual(a)
  })
})