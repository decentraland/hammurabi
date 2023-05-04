// the assetManager class enable scenes to pre-fetch assets and instance them in world
// one of the main features of the assetManager is the ability to load assets in parallel
// and reuse meshes, it is common in decentraland scenes that a single model is reused
// many times inside the same scene. the associated cost of loading, parsing and generating
// buffers for each model requies us to find a reusable solution

import * as BABYLON from '@babylonjs/core'
import { LoadableScene, resolveFile, resolveFileAbsolute } from '../../decentraland/scene/content-server-entity'
import { GLTFFileLoader, GLTFLoaderAnimationStartMode } from '@babylonjs/loaders/glTF/glTFFileLoader'
import { GLTFLoader } from '@babylonjs/loaders/glTF/2.0'
import { setColliderMask } from './logic/colliders'
import { ColliderLayer } from '@dcl/protocol/out-ts/decentraland/sdk/components/mesh_collider.gen'

const sceneContextMap = new Map<string /*sceneId*/, WeakRef<LoadableScene>>()

export class AssetManager {
  models = new Map<string, Promise<BABYLON.AssetContainer>>()

  constructor(public loadableScene: LoadableScene, public babylonScene: BABYLON.Scene) { }

  async getContainerFuture(_src: string): Promise<BABYLON.AssetContainer> {
    const normalizedSrc = _src.toLowerCase()
    let fileHash = resolveFile(this.loadableScene.entity, normalizedSrc)

    if (!fileHash) {
      return Promise.reject(`‼️ The file ${normalizedSrc} is not present in the deployed entity.`)
    }

    if (!this.models.has(fileHash)) {
      // store a WeakRef to the sceneContext to enable file resolver
      sceneContextMap.set(this.loadableScene.id, new WeakRef(this.loadableScene))

      const extension = normalizedSrc.endsWith('.gltf') ? '.gltf' : '.glb'

      // calculate the base path for the model
      const base = normalizedSrc.split('/').slice(0, -1).join('/')

      const ret = BABYLON.SceneLoader.LoadAssetContainerAsync(
        this.loadableScene.baseUrl,
        fileHash + '?sceneId=' + encodeURIComponent(this.loadableScene.id) + '&base=' + encodeURIComponent(base),
        this.babylonScene,
        null,
        extension
      )

      // once the assetContainer loads it needs to be processed before usage
      ret.then(_ => processAssetContainer(_))

      // store the promise in the map, it will be reused for the whole scene
      this.models.set(fileHash, ret)
    }

    return this.models.get(fileHash)!
  }

  async readFile(file: string): Promise<{ content: Uint8Array, hash: string }> {
    // this method resolves a file deployed with the entity. it returns the content of the file and its hash
    const hash = resolveFile(this.loadableScene.entity, file)
    if (!hash) throw new Error(`File not found: ${file}`)

    const absoluteLocation = resolveFileAbsolute(this.loadableScene, file)
    if (!absoluteLocation) throw new Error(`File not found: ${file}`)

    const res = await fetch(absoluteLocation)

    if (!res.ok) throw new Error(`Error loading URL: ${absoluteLocation}`)

    return { content: new Uint8Array(await res.arrayBuffer()), hash }
  }

  dispose() {
    for (const [hash, model] of Array.from(this.models.entries())) {
      model.then((container) => {
        container.dispose()
      })
      this.models.delete(hash)
    }
  }
}

BABYLON.SceneLoader.OnPluginActivatedObservable.add(function (plugin) {
  if (plugin instanceof GLTFFileLoader) {
    plugin.animationStartMode = GLTFLoaderAnimationStartMode.NONE
    plugin.compileMaterials = true
    plugin.validate = false
    plugin.createInstances = true
    plugin.animationStartMode = 0
    plugin.preprocessUrlAsync = async function (url: string) {
      // HERE BE DRAGONS 🐉:
      //  To hack the GLTF loader to use Decentraland's file system, we must
      //  access private properties to get the parent context to resolve individual
      //  files.
      //
      //  This Hack prevents the engine from caching the entire GLB/GLTF because
      //  query parameters are added to them. it is RECOMMENDED that the engine
      //  caches all the files by their name (CIDv1)
      const loader: GLTFLoader = (plugin as any)._loader
      const file: string = (loader as any)._fileName
      const [_gltfFilename, strParams] = file.split('?')
      if (strParams) {
        const params = new URLSearchParams(strParams)
        const base = params.get('base') || ''
        const sceneId = params.get('sceneId')!
        const ctx = sceneContextMap.get(sceneId)?.deref()
        if (ctx) {
          const relative = url.replace(ctx.baseUrl, base ? base + '/' : '')

          const ret = resolveFileAbsolute(ctx, relative)

          if (ret) {
            return ret!
          }
        }
      }
      console.error('‼️ ‼️ ‼️ Cannot resolve file ' + url)
      return '/images/UV_checker_Map_byValle.jpg'
    }
  }
})

function processAssetContainer(assetContainer: BABYLON.AssetContainer) {
  // by default, the models will be added to the scene at 0,0,0. We will remove that instance
  assetContainer.removeAllFromScene()

  // keep track of every generated mes and submesh
  assetContainer.meshes.forEach((mesh) => {
    if (mesh instanceof BABYLON.Mesh) {
      if (mesh.geometry && !assetContainer.geometries.includes(mesh.geometry)) {
        assetContainer.geometries.push(mesh.geometry)
      }
    }

    if (mesh.subMeshes) {
      mesh.subMeshes.forEach((subMesh) => {
        // this fixes a bug with meshes not correctly disposed
        subMesh.refreshBoundingInfo()

        const mesh = subMesh.getMesh()
        if (mesh instanceof BABYLON.Mesh) {
          if (mesh.geometry && !assetContainer.geometries.includes(mesh.geometry)) {
            assetContainer.geometries.push(mesh.geometry)
          }
        }
      })
    }

    // Find all the materials from all the meshes and add to $.materials
    mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY

    if (mesh.material) {
      if (!assetContainer.materials.includes(mesh.material)) {
        assetContainer.materials.push(mesh.material)
      }
    }

    if (mesh.name.endsWith('_collider')) {
      setColliderMask(mesh, ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER)
    } else {
      setColliderMask(mesh, ColliderLayer.CL_NONE)
    }
  })

  // Find the textures in the materials that share the same domain as the context
  // then add the textures to the $.textures
  assetContainer.materials.forEach((material: BABYLON.Material | BABYLON.PBRMaterial) => {
    // register all textures for the scene
    for (let i in material) {
      const t = (material as any)[i]

      if (i.endsWith('Texture') && t instanceof BABYLON.Texture) {
        if (!assetContainer.textures.includes(t)) {
          assetContainer.textures.push(t)
        }
      }
    }

    if (material instanceof BABYLON.PBRMaterial) {
      // static materials for the moment
      material.freeze();

      // then replace the reflection probe of the materials when needed
      material.reflectionTexture = assetContainer.scene.reflectionProbes.find($ => $.name === 'skyReflection')?.cubeTexture || null

      if (material.alphaMode === 2) {
        if (material.albedoTexture) {
          material.albedoTexture.hasAlpha = true
          material.useAlphaFromAlbedoTexture = true
        }
      }
    }

    material.freeze()
  })
}