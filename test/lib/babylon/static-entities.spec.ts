import { Scene } from '@dcl/schemas'
import { StaticEntities } from '../../../src/lib/babylon/scene/logic/static-entities'
import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { CrdtMessageType, readAllMessages } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { engineInfoComponent } from '../../../src/lib/decentraland/sdk-components/engine-info'
import { transformComponent } from '../../../src/lib/decentraland/sdk-components/transform-component'
import { testWithEngine } from './babylon-test-helper'

testWithEngine("static entities", {
  baseUrl: '/',
  entity: { content: [], metadata: {} as Scene, type: 'scene' },
  urn: '123',
  enableStaticEntities: true
}, ($) => {
  beforeEach(() => $.startEngine())
  test("ensure CameraEntity transform is being sent to the scene in the initial state (crdtGetState)", async () => {
    const { data } = await $.ctx.crdtGetState()

    const messages = Array.from(readAllMessages(new ReadWriteByteBuffer(data[0])))

    expect(messages).toMatchObject([
      {
        componentId: transformComponent.componentId,
        entityId: StaticEntities.CameraEntity,
        type: CrdtMessageType.PUT_COMPONENT
      },
      {
        componentId: transformComponent.componentId,
        entityId: StaticEntities.PlayerEntity,
        type: CrdtMessageType.PUT_COMPONENT
      },
      {
        componentId: transformComponent.componentId,
        entityId: StaticEntities.GlobalCenterOfCoordinates,
        type: CrdtMessageType.PUT_COMPONENT
      },
      {
        componentId: engineInfoComponent.componentId,
        entityId: StaticEntities.RootEntity,
        type: CrdtMessageType.PUT_COMPONENT
      }
    ])
  })
})
