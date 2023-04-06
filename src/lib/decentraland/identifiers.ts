export function parseEntityUrn(urn: string): { entityId: string, urn: string, baseUrl: string | null } {
  // many URN formats are valid for Decentraland.
  // for simplicity, at this stage we will only parse one type of URN:

  const matches = urn.match(/^(urn\:decentraland\:entity\:(ba[a-zA-Z0-9]{57}))/)

  if (!matches) throw new Error(`The provided URN is not supported: ${urn}`)

  const url = new URL(urn)

  let baseUrl = url.searchParams.get('baseUrl')
  if (baseUrl && !baseUrl.endsWith('/')) {
    baseUrl += '/'
  }

  return {
    urn: matches[1],
    entityId: matches[2],
    baseUrl
  }
}