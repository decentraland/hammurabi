import mitt, { Emitter } from 'mitt'
import { IEmoteController, Wearable, Emote } from '@dcl/schemas'

export function isEmote(definition: Wearable | Emote | void): definition is Emote {
  return !!definition && 'emoteDataADR74' in definition
}

export class InvalidEmoteError extends Error {
  constructor() {
    super(`Invalid emote`)
  }
}

export function createInvalidEmoteController(): IEmoteController {
  return {
    getLength() {
      throw new InvalidEmoteError()
    },
    isPlaying() {
      throw new InvalidEmoteError()
    },
    goTo() {
      throw new InvalidEmoteError()
    },
    play() {
      throw new InvalidEmoteError()
    },
    pause() {
      throw new InvalidEmoteError()
    },
    stop() {
      throw new InvalidEmoteError()
    },
    events: mitt(),
  }
}

