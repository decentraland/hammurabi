import { BabylonEntity } from '../../babylon/scene/entity'
import { ComponentDefinition } from '../crdt-internal/components'
import { putTransformComponent, TRANSFORM_COMPONENT_ID } from './transform'

export type ComponentOperation = <T>(ecsEntity: BabylonEntity, component: ComponentDefinition<T>) => void

export const componentPutOperations: Record<number, ComponentOperation> = {
  [TRANSFORM_COMPONENT_ID]: putTransformComponent,
}