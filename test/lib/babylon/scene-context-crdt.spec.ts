import { Quaternion, Vector3 } from '@babylonjs/core'
import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { DeleteEntity, PutComponentOperation } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { transformComponent } from '../../../src/lib/decentraland/sdk-components/transform-component'
import { Entity } from '../../../src/lib/decentraland/types'
import { testWithEngine } from './babylon-test-helper'

testWithEngine("entities are removed on scene disposal", {
  baseUrl: '/',
  entity: { content: [], metadata: {} },
  id: '123'
}, ($) => {
  beforeEach(() => $.startEngine())

  test('create an extra entity that will be deleted upon context disposal', async () => {
    const entityId = 2 as Entity

    // first there is no entity
    expect($.ctx.entities.has(entityId)).toEqual(false)

    // then we create a component for the entityId=1
    {
      const componentBuffer = new ReadWriteByteBuffer()
      transformComponent.serialize({
        parent: 0,
        position: Vector3.Zero(),
        scale: Vector3.One(),
        rotation: Quaternion.Identity()
      }, componentBuffer)

      const buf = new ReadWriteByteBuffer()
      PutComponentOperation.write({
        entityId,
        componentId: 1,
        timestamp: 1,
        data: componentBuffer.toBinary()
      }, buf)
      const result = await $.ctx.crdtSendToRenderer({ data: buf.toBinary() })
      expect(result).toEqual({ data: [] })
    }

    // then there is an entity
    expect($.ctx.entities.has(entityId)).toEqual(true)
    const entityDisposeSpy = jest.spyOn($.ctx.entities.get(entityId), 'dispose')

    // dispose the entire scene context
    $.ctx?.dispose()

    // and the entity should not exist anymore
    expect($.ctx.entities.has(entityId)).toEqual(false)
    expect(entityDisposeSpy).toHaveBeenCalled()
  })
})

testWithEngine("scene context implents ADR-148", {
  baseUrl: '/',
  entity: { content: [], metadata: {} },
  id: '123'
}, ($) => {

  beforeEach(() => $.startEngine())

  it('tests one empty update', async () => {
    const result = await $.ctx.crdtSendToRenderer({ data: new Uint8Array([]) })
    expect(result).toEqual({ data: [] })
  })

  it('tests one message with a blank entity component', async () => {
    const entityId = 1 as Entity

    // first there is no entity
    expect($.ctx.entities.has(entityId)).toEqual(false)

    // then we create a component for the entityId=1
    {
      const componentBuffer = new ReadWriteByteBuffer()
      transformComponent.serialize({
        parent: 0,
        position: Vector3.Zero(),
        scale: Vector3.One(),
        rotation: Quaternion.Identity()
      }, componentBuffer)

      const buf = new ReadWriteByteBuffer()
      PutComponentOperation.write({
        entityId,
        componentId: 1,
        timestamp: 1,
        data: componentBuffer.toBinary()
      }, buf)
      const result = await $.ctx.crdtSendToRenderer({ data: buf.toBinary() })
      expect(result).toEqual({ data: [] })
    }

    // then there is an entity
    expect($.ctx.entities.has(entityId)).toEqual(true)

    // then we delete the entity
    {
      const buf = new ReadWriteByteBuffer()
      DeleteEntity.write({ entityId }, buf)
      const result = await $.ctx.crdtSendToRenderer({ data: buf.toBinary() })
      expect(result).toEqual({ data: [] })
    }

    // and then there is no entity
    expect($.ctx.entities.has(entityId)).toEqual(false)
  })
})


testWithEngine("outgoingMessages are delivered on crdtSendToRenderer result", {
  baseUrl: '/',
  entity: { content: [], metadata: {} },
  id: '123'
}, ($) => {
  beforeEach(() => $.startEngine())

  test('writing to outgoingMessagesBuffer redirects reaches crdtSendToRenderer', async () => {
    const entityId = 2 as Entity

    const out = new ReadWriteByteBuffer()
    transformComponent.serialize({ parent: 0, position: Vector3.Zero(), scale: Vector3.One(), rotation: Quaternion.Identity() }, out)

    // write an outgoing message to the scene's buffer
    PutComponentOperation.write({
      entityId,
      componentId: 1,
      timestamp: 1,
      data: out.toBinary()
    }, $.ctx.outgoingMessagesBuffer)

    // then call crdtSendToRenderer
    const expectedResult = $.ctx.outgoingMessagesBuffer.toBinary()
    const result = await $.ctx.crdtSendToRenderer({ data: Uint8Array.of() })
    expect(result).toEqual({ data: [expectedResult] })

    // and the buffer's writing head should be reset
    expect($.ctx.outgoingMessagesBuffer.currentWriteOffset()).toEqual(0)
  })

  test('outgoingMessagesBuffer should be empty after the first time', async () => {
    const result = await $.ctx.crdtSendToRenderer({ data: Uint8Array.of() })
    expect(result).toEqual({ data: [] })
  })
})
