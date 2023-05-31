import "@babylonjs/inspector"
import { renderApp } from './App'
import { userDidInteract } from "./state"

renderApp()

document.body.addEventListener('pointerdown', () => {
  userDidInteract.swap(true)
}, { once: true })