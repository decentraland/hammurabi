import { AboutResponse } from "@dcl/protocol/out-ts/decentraland/bff/http_endpoints.gen"
import { resolveRealmBaseUrl } from "./resolution"
import { setCurrentRealm } from "../../../explorer/state"
import { Scene } from "@babylonjs/core"

export async function loadRealm(realmConnectionString: string, scene: Scene) {
  // naively, first destroy all created scenes before loading the new realm.
  // in the future many optimization could be applied here, like only destroying
  // the scenes that will be replaced by the new realm.

  const url = (await resolveRealmBaseUrl(realmConnectionString)).replace(/\/$/, '')

  // fetch the standard /about endpoint for the realm
  const res = await fetch(url + '/about')
  if (res.ok) {
    const realm = await res.json() as AboutResponse
    setCurrentRealm(realm, scene)
  }
  // TODO: gracefully handle errors


  return url
}