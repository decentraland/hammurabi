import { Scene, VideoTexture } from "@babylonjs/core";
import { Participant, RemoteTrack } from "livekit-client";
import { planeMaterial } from "../../sdk-components/mesh-renderer-component";

export function updateVideoTexture(scene: Scene, track: RemoteTrack, participant: Participant) {
  const video = document.createElement('video')

  video.srcObject = track.mediaStream!

  const prevTexture = planeMaterial(scene).diffuseTexture

  const newVideoTexture = new VideoTexture(participant.identity + ':' + track.source, video, scene, false, false)
  newVideoTexture.video.autoplay = true
  planeMaterial(scene).diffuseTexture = newVideoTexture

  if (prevTexture instanceof VideoTexture) disposePreviousVideo(prevTexture)
}

function disposePreviousVideo(videoTexture: VideoTexture) {
  // Store reference to the underlying HTML5 video element
  const videoEl = videoTexture.video

  // Dispose texture
  videoTexture.dispose();

  // Remove any <source> elements, etc.
  while (videoEl.firstChild) {
    if (videoEl.lastChild)
      videoEl.removeChild(videoEl.lastChild);
  }

  // Set a blank src
  videoEl.src = ''

  // Prevent non-important errors in some browsers
  videoEl.removeAttribute('src')

  // Get certain browsers to let go
  videoEl.load()

  videoEl.remove()
}