const fs = require("fs")
const path = require("path")

;(async function download() {
    const bootstrap = fs.readFileSync(path.join(__dirname, "../src/explorer/bootstrap.ts"), "utf-8") 
    const urls = bootstrap.match(/https:\/\/[^\s"']+/g)
    fs.mkdirSync(path.join(__dirname, "../static/vendor"), { recursive: true, force: true })
    for (const _url of urls) {
        const url = _url.slice(0, _url.length - 1)
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