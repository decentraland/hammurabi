import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { CommsEvents } from '../../../src/lib/decentraland/communications/CommsTransportWrapper'
import { createAvatarVirtualScene } from '../../../src/lib/decentraland/communications/comms-virtual-scene'
import mitt from 'mitt'
import { CrdtBuilder } from '../babylon/babylon-test-helper'
import { transformComponent } from '../../../src/lib/decentraland/sdk-components/transform-component'
import { Quaternion, Vector3 } from '@babylonjs/core'
import { playerIdentityDataComponent } from '../../../src/lib/decentraland/sdk-components/engine-info copy'
import { readAllMessages } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { prettyPrintCrdtMessage } from '../../../src/lib/decentraland/crdt-wire-protocol/prettyPrint'

describe('virtual scene tests', () => {
  const scene = createAvatarVirtualScene()
  const events = mitt<CommsEvents>()
  scene.wireTransportEvents(events)

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
        index: 1
      }
    })
    scene.runTick()

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
        index: 2
      }
    })
    scene.runTick()

    // write partial updates to buf1
    sub1.getUpdates(buf1)

    // write final updates to buf2
    sub2.getUpdates(buf2)

    // assertions

    // buf1 received two updates for the same component because getUpdates was called twice in between updates
    new CrdtBuilder()
      .put(playerIdentityDataComponent, 511, 1, {
        address: '0x123'
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
        address: '0x123'
      })
      .put(transformComponent, 511, 2, {
        parent: 5,
        position: new Vector3(9, 9, 9),
        rotation: new Quaternion(9, 9, 9, 9),
        scale: Vector3.One()
      })
      .mustEqual(buf2.toBinary())

    // finally if no updates are received, no updates are written
    scene.runTick()
    const buf3 = new ReadWriteByteBuffer()
    sub2.getUpdates(buf3)
    expect(buf3.currentWriteOffset()).toEqual(0)
  })

  test('deleting an entity produces an entity deleted crdt message', () => {
    events.emit('PEER_DISCONNECTED', { address: '0x123' })
    scene.runTick()

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