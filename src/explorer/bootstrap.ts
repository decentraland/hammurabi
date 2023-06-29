export const libs = [
    {
        "name": "livekit-client",
        "progress": 5,
        "src": "https://cdn.jsdelivr.net/npm/livekit-client@1.11.4/dist/livekit-client.umd.js"
    },
    {
        "name": "ajv",
        "progress": 6,
        "src": "https://cdnjs.cloudflare.com/ajax/libs/ajv/8.12.0/ajv2020.bundle.js"
    },
    {
        "name": "BabylonJS",
        "progress": 10,
        "src": "https://cdn.babylonjs.com/babylon.max.js"
    },
    {
        "name": "BabylonJS Materials library",
        "progress": 15,
        "src": "https://cdn.babylonjs.com/materialsLibrary/babylonjs.materials.js"
    },
    {
        "name": "BabylonJS 3D Asset Loading system",
        "progress": 20,
        "src": "https://cdn.babylonjs.com/loaders/babylonjs.loaders.js"
    },
    {
        "name": "BabylonJS UI system",
        "progress": 30,
        "src": "https://cdn.babylonjs.com/gui/babylon.gui.js"
    },
    {
        "name": "BabylonJS Inspector",
        "progress": 40,
        "src": "https://cdn.babylonjs.com/inspector/babylon.inspector.bundle.max.js"
    },
    {
        "name": "React",
        "progress": 50,
        "src": "https://unpkg.com/react/umd/react.development.js"
    },
    {
        "name": "ReactDOM",
        "progress": 65,
        "src": "https://unpkg.com/react-dom/umd/react-dom.development.js"
    },
    {
        "name": "xterm.js",
        "progress": 70,
        "src": "https://cdn.jsdelivr.net/npm/xterm@5.2.1/lib/xterm.js",
    },
    {
        "name": "Hammurabi",
        "progress": 80,
        "type": "module",
        "src": "js/index.js"
    }
]
window.addEventListener('load', function () {
    const USE_CUSTOM_VENDOR_PATH = null // 'http://localhost:8098'
    const loaderText = document.getElementById("loader-text")!
    const loaderProgress = document.getElementById("loader-indicator")!
    const loaderBase = document.getElementById("loader-base")!

    function load() {
        const lib = libs[0]
        loaderText.innerText = "Loading " + lib.name + "..."
        loaderProgress.style.width = lib.progress + "%"
        const script = document.createElement("script")
        if (USE_CUSTOM_VENDOR_PATH && lib.src.startsWith('http')) {
            const src = lib.src.split('/')
            script.src = USE_CUSTOM_VENDOR_PATH + '/' + src[src.length - 1]
        } else {
            script.src = lib.src
        }
        script.type = lib.type || "text/javascript"
        script.onload = function () {
            libs.shift()
            if (libs.length > 0) {
                load()
            } else {
                loaderBase.style.display = 'none'
            }
        }
        script.onerror = function () {
            loaderText.innerText = 'Failed to load ' + lib.name
            loaderProgress.style.width = '0%'
        }
        document.querySelector('body')!.appendChild(script)
    }
    load()
})