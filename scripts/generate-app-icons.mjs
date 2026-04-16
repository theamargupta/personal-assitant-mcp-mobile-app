/**
 * Rasterizes SVG sources into Expo-required PNGs.
 * Run from repo root: node scripts/generate-app-icons.mjs
 * Requires: npm install (sharp is a devDependency)
 */
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const img = join(root, 'assets', 'images')

async function rasterize(svgName, pngName, size) {
  const svg = await readFile(join(img, svgName))
  await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(join(img, pngName))
  console.log(`Wrote ${pngName} (${size}×${size})`)
}

await rasterize('icon-source.svg', 'icon.png', 1024)
await rasterize('adaptive-icon-source.svg', 'adaptive-icon.png', 1024)
await rasterize('icon-source.svg', 'splash-icon.png', 1024)
await rasterize('icon-source.svg', 'favicon.png', 48)

console.log('Done.')
