import { Avatar } from "@dcl/schemas";
import { fetchEntitiesByPointers } from "../../babylon/scene/load";

export async function generateRandomAvatar(address: string): Promise<Avatar> {
  return {
    name: address,
    description: address,
    avatar: {
      bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
      skin: {
        color: {
          r: 0.4901960790157318,
          g: 0.364705890417099,
          b: 0.27843138575553894
        }
      },
      hair: {
        color: {
          r: 0.10980392247438431,
          g: 0.10980392247438431,
          b: 0.10980392247438431
        }
      },
      eyes: {
        color: {
          r: 0.7490196228027344,
          g: 0.6196078658103943,
          b: 0.3529411852359772
        }
      },
      wearables: [
        "urn:decentraland:off-chain:base-avatars:green_square_shirt",
        "urn:decentraland:off-chain:base-avatars:oxford_pants",
        "urn:decentraland:off-chain:base-avatars:sport_blue_shoes",
        "urn:decentraland:off-chain:base-avatars:casual_hair_02",
        "urn:decentraland:off-chain:base-avatars:mouth_03",
        "urn:decentraland:off-chain:base-avatars:toruspiercing"
      ],
      snapshots: { body: "bafkreiefvsulteo5wtnba6wxrkpeilkxhxylvtn642d6oph3yrrgbduggu", face256: "bafkreigxgmwduwykncbemfd5kwufinkig2oiywuvdjcq6qdjcktf7lnm4q" }
    },
    userId: address,
    ethAddress: address,
    version: 1,
    tutorialStep: 0,
    hasClaimedName: false
  }
}

export async function downloadAvatar(address: string): Promise<Avatar> {
  const entities = await fetchEntitiesByPointers([address], 'https://peer.decentraland.org/content')

  if (!entities.length) return generateRandomAvatar(address)

  return entities[0].metadata.avatars[0]
}