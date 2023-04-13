import { BabylonEntity } from './entity'

// returns true if the entity has PointerEvents
export function entityHasPointerEvents(entity: BabylonEntity) {
  return !!entity.appliedComponents.pointerEvents
}
