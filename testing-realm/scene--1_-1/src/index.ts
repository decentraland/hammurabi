import { AvatarShape, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
export * from '@dcl/sdk'

const avatar1 = engine.addEntity()
Transform.create(avatar1, { position: Vector3.create(5, 0, 5) })
AvatarShape.create(avatar1, {
  id: 'menduz',
  name: 'menduz',
  wearables: [
    'urn:decentraland:off-chain:base-avatars:sneakers',
    'urn:decentraland:off-chain:base-avatars:eyes_00',
    'urn:decentraland:off-chain:base-avatars:eyebrows_00',
    'urn:decentraland:off-chain:base-avatars:mouth_00',
    'urn:decentraland:off-chain:base-avatars:beard',
    'urn:decentraland:off-chain:base-avatars:triple_ring',
    'urn:decentraland:off-chain:base-avatars:basketball_shorts',
    'urn:decentraland:matic:collections-v2:0x139b7a50c287ccdf6f1e6d9ddb2936a80e2029e1:0',
    'urn:decentraland:matic:collections-v2:0x26676a456bca88e418f9ea4b33a707364c0b5876:1',
    'urn:decentraland:matic:collections-v2:0x26676a456bca88e418f9ea4b33a707364c0b5876:0'],
  emotes: ['urn:decentraland:matic:collections-v2:0x875146d1d26e91c80f25f5966a84b098d3db1fc8:1'],
  bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
  eyeColor: {
    'r': 0.52734375,
    'g': 0.37890625,
    'b': 0.2578125,
  },
  hairColor: {
    'r': 0.234375,
    'g': 0.12890625,
    'b': 0.04296875,
  },
  skinColor: {
    'r': 1,
    'g': 0.8941176533699036,
    'b': 0.7764706015586853,
  }
})


const avatar2 = engine.addEntity()
Transform.create(avatar2, { position: Vector3.create(5, 0, 7) })
AvatarShape.create(avatar2, {
  id: 'naked',
  name: 'naked',
  wearables: [],
  emotes: [],
  bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
  eyeColor: {
    'r': 0.52734375,
    'g': 0.37890625,
    'b': 0.2578125,
  },
  hairColor: {
    'r': 0.234375,
    'g': 0.12890625,
    'b': 0.04296875,
  },
  skinColor: {
    'r': 1,
    'g': 0.8941176533699036,
    'b': 0.7764706015586853,
  }
})
