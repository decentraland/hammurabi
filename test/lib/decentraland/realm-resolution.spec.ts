import * as r from '../../../src/lib/decentraland/realm/resolution'

describe('realm resolution', () => {
  test('worlds using .dcl.ens', async () => {
    expect(await r.resolveRealmBaseUrl('menduz.dcl.eth')).toEqual('https://worlds-content-server.decentraland.org/world/menduz.dcl.eth')
  })
  test('other domains', async () => {
    expect(await r.resolveRealmBaseUrl('testing-realm')).toEqual('https://testing-realm')
    expect(await r.resolveRealmBaseUrl('testing-realm.com/a')).toEqual('https://testing-realm.com/a')
    expect(await r.resolveRealmBaseUrl('http://testing-realm.com/a')).toEqual('http://testing-realm.com/a')
    expect(await r.resolveRealmBaseUrl('://testing-realm.com/a')).toEqual('https://testing-realm.com/a')
  })
  test('static routes', async () => {
    expect(await r.resolveRealmBaseUrl('/ipfs/testing-realm')).toEqual('https://play.decentraland.org/ipfs/testing-realm')
  })
})