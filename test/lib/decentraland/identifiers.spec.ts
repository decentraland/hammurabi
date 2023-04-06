import * as i from '../../../src/lib/decentraland/identifiers'

describe('decentraland identifiers', () => {
  test('urn entity ids', () => {
    expect(i.parseEntityUrn('urn:decentraland:entity:bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq')).toEqual({
      urn: 'urn:decentraland:entity:bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq',
      entityId: 'bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq',
      baseUrl: null
    })
    expect(i.parseEntityUrn('urn:decentraland:entity:bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq?a=1')).toEqual({
      urn: 'urn:decentraland:entity:bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq',
      entityId: 'bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq',
      baseUrl: null
    })
    expect(i.parseEntityUrn('urn:decentraland:entity:bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq?baseUrl=https://test/ipfs')).toEqual({
      urn: 'urn:decentraland:entity:bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq',
      entityId: 'bafkreia2bnaozz3kjmwpfxe2o7ksim47bcnnsz276cxpkzzucblpusxfoq',
      baseUrl: 'https://test/ipfs/'
    })
  })
})