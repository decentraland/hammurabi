// This file implements https://adr.decentraland.org/adr/ADR-144

function isDclEns(str: string | undefined): str is `${string}.dcl.eth` {
  return !!str?.match(/^[a-zA-Z0-9]+\.dcl\.eth$/)?.length
}

function isEns(str: string | undefined): str is `${string}.dcl.eth` {
  return !!str?.match(/^[a-zA-Z0-9]+\.eth$/)?.length
}

function dclWorldUrl(dclName: string) {
  return `https://worlds-content-server.decentraland.org/world/${encodeURIComponent(dclName.toLowerCase())}`
}

function normalizeUrl(url: string) {
  return url.replace(/^:\/\//, 'http:' + '//')
}

// adds the currently used protocol to the given URL
function urlWithProtocol(urlOrHostname: string) {
  if (urlOrHostname.startsWith('/')) {
    return new URL(urlOrHostname).toString()
  } 

  if (!urlOrHostname.startsWith('http://') && !urlOrHostname.startsWith('https://') && !urlOrHostname.startsWith('://'))
    return normalizeUrl(`https://${urlOrHostname}`)

  return normalizeUrl(urlOrHostname)
}

export async function resolveRealmBaseUrl(realmString: string): Promise<string> {
  if (isEns(realmString)) {
    // TODO: implement the rest of ADR-144
    // if (await ens.resolve(realmString, 'dcl.realm')) {
    //   return ens.resolve(realmString, 'dcl.realm')
    // }
  }

  if (isDclEns(realmString)) {
    return dclWorldUrl(realmString)
  }

  return urlWithProtocol(realmString)
}