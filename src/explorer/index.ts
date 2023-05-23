import "@babylonjs/inspector"
import { renderApp } from './App'
import { userDidInteract } from "./state"

renderApp()

document.body.addEventListener('pointerdown', () => {
  userDidInteract.swap(true)
}, { once: true })

//   setTimeout(configureMicrophoneSelector, 0)

// function configureMicrophoneSelector() {
//   const selector = document.getElementById('microphone')
//   // List cameras and microphones.
//   navigator.mediaDevices.enumerateDevices().then((devices) => {
//     selector!.innerHTML =
//       `<option selected disabled>- Select your microphone -</option>` +
//       devices
//         .filter((device) => device.kind === 'audioinput')
//         .map((device) => {
//           const isSelected = device.deviceId
//           return `<option value="${device.deviceId}" ${isSelected}>${device.label || 'Generic microphone'}</option>`
//         }).join('')
//   })

//   selector!.onchange = (a) => {
//     const deviceId = (a.target as HTMLSelectElement).value

//     selector!.setAttribute('disabled', 'disabled')

//     navigator.mediaDevices.getUserMedia({
//       audio: {
//         deviceId,
//         channelCount: 1,
//         sampleRate: 24000,
//         echoCancellation: true,
//         noiseSuppression: true,
//         autoGainControl: true,
//         advanced: [{ echoCancellation: true }, { autoGainControl: true }, { noiseSuppression: true }] as any
//       },
//       video: false
//     }).then($ => {
//       microphone.swap($)
//       selector!.setAttribute('disabled', 'disabled')
//     }).catch($ => {
//       console.error($)
//       selector!.removeAttribute('disabled')
//     })

//   }
// }