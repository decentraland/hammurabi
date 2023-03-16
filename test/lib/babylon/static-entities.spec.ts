import { StaticEntities } from '../../../src/lib/babylon/scene/context'
import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { CrdtMessageType, readAllMessages } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { TRANSFORM_COMPONENT_ID } from '../../../src/lib/decentraland/sdk-components/transform'
import { initTestEngine } from './babylon-test-helper'

describe("static entities", () => {
  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123',
    enableStaticEntities: true
  })

  test("ensure CameraEntity transform is being sent to the scene in the initial state (crdtGetState)", async () => {
    const { data } = await $.ctx.crdtGetState()

    const messages = Array.from(readAllMessages(new ReadWriteByteBuffer(data[0])))

    expect(messages).toMatchObject([
      {
        componentId: TRANSFORM_COMPONENT_ID,
        entityId: StaticEntities.CameraEntity,
        type: CrdtMessageType.PUT_COMPONENT
      }
    ])
  })
})
