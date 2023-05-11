export function isBodyShape(urn: string) {
  return urn.toLowerCase() === 'urn:decentraland:off-chain:base-avatars:basemale'
    || urn.toLowerCase() == 'urn:decentraland:off-chain:base-avatars:basefemale'
}
