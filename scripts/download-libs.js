const urls = [
  "https://cdn.babylonjs.com/babylon.max.js",
  "https://cdn.babylonjs.com/materialsLibrary/babylonjs.materials.js",
  "https://cdn.babylonjs.com/loaders/babylonjs.loaders.js",
  "https://cdn.babylonjs.com/gui/babylon.gui.js",
  "https://cdn.babylonjs.com/inspector/babylon.inspector.bundle.max.js",
  "https://unpkg.com/react/umd/react.development.js",
  "https://unpkg.com/react-dom/umd/react-dom.development.js",
  "https://cdn.jsdelivr.net/npm/xterm@5.2.1/lib/xterm.js",
  "https://cdn.jsdelivr.net/npm/protobufjs@7.2.4/dist/protobuf.js",
]

const fs = require("fs")
const path = require("path")

;(async function download() {
    fs.mkdirSync(path.join(__dirname, "../static/vendor"), { recursive: true, force: true })
    for (const url of urls) {
        const filename = path.basename(url)
        if (fs.existsSync(path.join(__dirname, "../static/vendor", filename))) {
            console.log(`Skipping ${url} (already exists on ./static/vendor)`)
            continue;
        }
        console.log(`Downloading ${url}`)
        const res = await fetch(url)
        const content = await res.arrayBuffer()
        fs.writeFileSync(path.join(__dirname, "../static/vendor", filename), Buffer.from(content))
        console.log(`Downloading map for ${url}`)
        const mapRes = await fetch(url + '.map')
        const mapContent = await mapRes.arrayBuffer()
        fs.writeFileSync(path.join(__dirname, "../static/vendor", filename + '.map'), Buffer.from(mapContent))
    }
})().catch(err => console.error(err))