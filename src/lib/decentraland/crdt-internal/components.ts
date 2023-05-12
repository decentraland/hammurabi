/**
 * This file exposes interfaces for the two components described in ADR-117
 *   LastWriteWins-Element-Set
 *   GrowOnly-Set
 */

import { BabylonEntity } from "../../babylon/scene/BabylonEntity"
import { ByteBuffer } from "../ByteBuffer"
import { CrdtMessageBody, DeleteComponentMessageBody, PutComponentMessageBody } from "../crdt-wire-protocol"
import { Entity } from "../types"

/**
 * Component types are used to pick the wire protocol and the conflict resolution algorithm
 */
export const enum ComponentType {
  LastWriteWinElementSet = 0,
  GrowOnlyValueSet = 1
}

/**
 * A conflict resolution message is the response to an outdated or invalid state
 * in the CRDT.
 */
export type ConflictResolutionMessage = PutComponentMessageBody | DeleteComponentMessageBody

/**
 * Serialize/Deserialize functions for components. Both functions are expected
 * to throw in case of not enough or corrupted data
 */
export type SerDe<T> = {
  serialize(value: T, buffer: ByteBuffer): void
  deserialize(buffer: ByteBuffer): T
}

export type ComponentDeclaration<T, ComponentNumber extends number> = SerDe<T> & {
  // numeric ID of the component as defined in the protocol
  readonly componentId: ComponentNumber
  // applyChanges is in charge of reflecting the changes of the component value
  // into the BabylonEngine. It is called after a CRDT message is received and
  // after it is reflected in the component definition (the storage)
  applyChanges: ApplyComponentOperation<T>
}

export type ComponentDefinition<T> =
  | LastWriteWinElementSetComponentDefinition<T>
  | GrowOnlyValueSetComponentDefinition<T>

export type ApplyComponentOperation<T> = (ecsEntity: BabylonEntity, componentDefinition: ComponentDefinition<T>) => void

export interface BaseComponent<T> {
  readonly componentId: number
  readonly componentType: ComponentType
  readonly declaration: ComponentDeclaration<T, number>

  /**
   * This function receives a CRDT update and returns true if the change is accepted.
   * On the contrary, if the change needs to be corrected to resolve a conflict, the
   * corrective message will be written to the conflictResolutionByteBuffer
   */
  updateFromCrdt(body: CrdtMessageBody, conflictResolutionByteBuffer: ByteBuffer): boolean

  /**
   * This function writes all CRDT updates into a outBuffer. After returning, this function
   * clears the internal dirty state. Updates are produced only once.
   * 
   * This function updates the internal "tick" counter for the entire component.
   */
  dumpCrdtUpdates(outBuffer: ByteBuffer): void
  
  /**
   * This function writes CRDT updates into a outBuffer filtering by the updates with
   * a tick greater than the one provided. It returns the biggest tick written
   * to the buffer.
   * 
   * WARNING! this function ignores the dirty state. To commit the dirty state please first call
   * dumpCrdtUpdates. That will increase the counters for each dirty entity and will allow
   * this function to filter by tick.
   */
  dumpCrdtDeltas(outBuffer: ByteBuffer, fromTick: number): number

  /**
   * Marks the entity as deleted and signals it cannot be used ever again. It must
   * clear the component internal state, produces a synchronization message to remove
   * the component from the entity.
   * @param entity - Entity ID that was deleted.
   */
  entityDeleted(entity: Entity, markAsDirty: boolean): void

  /**
   * Get if the entity has this component
   * @param entity - entity to test
   */
  has(entity: Entity): boolean

  /**
   * Get the current component value | undefined
   * @param entity - Entity that will be used to get the component
   * @returns
   */
  get(entity: Entity): any

  iterator(): Iterable<[Entity, any]>
  dirtyIterator(): Iterable<Entity>
}

export interface LastWriteWinElementSetComponentDefinition<T> extends BaseComponent<T> {
  readonly componentType: ComponentType.LastWriteWinElementSet

  /**
   * Get the value of the component for an entity
   * @param entity - Entity that will be used to get the component
   * @returns
   */
  get(entity: Entity): T | undefined

  /**
   * Get the readonly component of the entity (to mutate it, use getMutable instead), or null if the entity doesn't have the component.
   * @param entity - Entity that will be used to try to get the component
   */
  getOrNull(entity: Entity): Readonly<T> | null

  /**
   * Add the current component to an entity, throw an error if the component already exists (use `createOrReplace` instead).
   * - Internal comment: This method adds the &lt;entity,component&gt; to the list to be reviewed next frame
   * @param entity - Entity that will be used to create the component
   * @param val - The initial value
   */
  create(entity: Entity, val: T): T

  /**
   * Add the current component to an entity or replace the content if the entity already has the component
   * - Internal comment: This method adds the &lt;entity,component&gt; to the list to be reviewed next frame
   * @param entity - Entity that will be used to create or replace the component
   * @param val - The initial or new value
   */
  createOrReplace(entity: Entity, val: T): T

  /**
   * Delete the current component to an entity, return null if the entity doesn't have the current component.
   * - Internal comment: This method adds the &lt;entity,component&gt; to the list to be reviewed next frame
   * @param entity - Entity to delete the component from
   * @param markAsDirty - defaults to true
   */
  deleteFrom(entity: Entity, markAsDirty?: boolean): T | null

  /**

   * Delete the current component to an entity, return null if the entity doesn't have the current component.
   * - Internal comment: This method adds the &lt;entity,component&gt; to the list to be reviewed next frame
   * @param entity - Entity to delete the component from
   */
  deleteFrom(entity: Entity): T | null

  /**
   * Get the mutable component of the entity, throw an error if the entity doesn't have the component.
   * - Internal comment: This method adds the &lt;entity,component&gt; to the list to be reviewed next frame
   * @param entity - Entity to get the component from
   */
  getMutable(entity: Entity): T

  /**
   * Get the mutable component of the entity, return null if the entity doesn't have the component.
   * - Internal comment: This method adds the &lt;entity,component&gt; to the list to be reviewed next frame
   * @param entity - Entity to get the component from
   */
  getMutableOrNull(entity: Entity): T | null

  iterator(): Iterable<[Entity, T]>
}

export interface GrowOnlyValueSetComponentDefinition<T> extends BaseComponent<T> {
  readonly componentType: ComponentType.GrowOnlyValueSet

  /**
   * Appends an element to the set.
   * @param entity - Entity that will host the value
   * @param val - The final value. The Set will freeze the value, it won't be editable from
   * the script.
   */
  addValue(entity: Entity, val: Readonly<T>): ReadonlySet<T>

  /**
   * Get the readonly component of the entity (to mutate it, use getMutable instead),
   * throws an error if the entity doesn't have the component.
   * @param entity - Entity that will be used to get the component
   * @returns
   */
  get(entity: Entity): ReadonlySet<T>
}
