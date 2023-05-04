import { createGenerationalIndexPool} from '../../../src/lib/decentraland/crdt-internal/generational-index-pool'

describe('Entity container', () => {
  it('generates new static entities and reuses entity numbers when possible and as much as possible', () => {
    const entityContainer = createGenerationalIndexPool(0x1, 0x15)
    expect(entityContainer.getFreeEntity()).toBe(0x14)
    expect(entityContainer.getFreeEntity()).toBe(0x13)
    expect(entityContainer.getFreeEntity()).toBe(0x12)
    entityContainer.deleteEntity(0x12)
    expect(entityContainer.getFreeEntity()).toBe(0x00010012)
    //                                  generation ^^^^  ^^ entity number

    entityContainer.deleteEntity(0x12) // nothing happens if we remove an entity with an old generation, it is a noop
    
    expect(entityContainer.getFreeEntity()).toBe(0x11)
    
    entityContainer.deleteEntity(0x00010012)
    expect(entityContainer.getFreeEntity()).toBe(0x00020012)
    //                              new generation ^^^^  ^^ entity number is reused
  })
})
