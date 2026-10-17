// Validate generated deployment assets, not just the source configuration.
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const base = '/higher-or-lower/'
const origin = 'https://benjaminknudsen.github.io'
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'))
const html = readFileSync('dist/index.html', 'utf8')
const sw = readFileSync('dist/sw.js', 'utf8')
const cached = new Set([...sw.matchAll(/\{url:"([^"]+)",revision:/g)].map(match => match[1]))

assert.equal(manifest.name, 'FCM Higher or Lower')
assert.equal(manifest.display, 'standalone')
for (const key of ['start_url', 'scope', 'id']) assert.equal(manifest[key], base)
assert.ok(html.includes(`href="${base}manifest.webmanifest"`))
assert.ok(html.includes('name="apple-mobile-web-app-capable" content="yes"'))
assert.ok(html.includes('viewport-fit=cover'))

for (const path of cached) {
  const url = new URL(path, origin + base)
  assert.ok(url.pathname.startsWith(base), `Precache escapes app scope: ${path}`)
  assert.ok(existsSync(`dist/${url.pathname.slice(base.length)}`), `Missing cached asset: ${path}`)
}

function checkIcon(src, size) {
  const url = new URL(src, origin + base + 'manifest.webmanifest')
  assert.ok(url.pathname.startsWith(base))
  const path = url.pathname.slice(base.length)
  const png = readFileSync(`dist/${path}`)
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.readUInt32BE(16), size)
  assert.equal(png.readUInt32BE(20), size)
  assert.equal(png[25], 2, `Icon must be opaque RGB: ${path}`)
  assert.ok(cached.has(path), `Icon missing from offline cache: ${path}`)
}
assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any'))
assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'any'))
assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'))
for (const icon of manifest.icons) checkIcon(icon.src, Number(icon.sizes.split('x')[0]))
assert.ok(html.includes(`href="${base}icons/apple-touch-icon.png"`))
checkIcon('icons/apple-touch-icon.png', 180)

for (const path of ['index.html', 'manifest.webmanifest', 'images/card-grain.svg', 'images/player-silhouette.webp', ...['stocky-crop', 'slim-curls', 'athletic-bun', 'broad-bald', 'lean-locks'].map(name => `images/silhouettes/${name}.webp`)]) {
  assert.ok(cached.has(path), `Missing offline asset: ${path}`)
}
for (const [, path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  assert.ok(path.startsWith(base), `HTML asset missing base: ${path}`)
  assert.ok(existsSync(`dist/${path.slice(base.length)}`), `Missing HTML asset: ${path}`)
}
console.log(`PWA OK: standalone manifest, scoped asset URLs, opaque icons and ${cached.size} offline assets.`)
