import * as THREE from 'three'

const CLOUD_COUNT = 36
const AREA = 15000 // clouds spread over +/- AREA metres around the map origin
const geo = new THREE.SphereGeometry(1, 14, 10)

// The sun comes from (-120, 260, 160) (see warehouseScene), so a cloud's shadow is thrown towards +x / -z.
const SUN = { x: 120 / 260, z: -160 / 260 }

const rand = (seed: number) => {
  const x = Math.sin(seed * 91.7 + 17.3) * 43758.5453
  return x - Math.floor(x)
}

/** Soft-edged blob texture used for cloud shadows (radial alpha fall-off). */
function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62)
  grad.addColorStop(0, 'rgba(32, 44, 72, 0.9)')
  grad.addColorStop(0.55, 'rgba(32, 44, 72, 0.55)')
  grad.addColorStop(1, 'rgba(32, 44, 72, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

interface Cloud {
  group: THREE.Group
  shadow: THREE.Mesh
  speed: number
}

/**
 * Soft puffy clouds drifting high above the city, plus their soft shadows gliding across the map below.
 * The clouds fill the sky when the map is tilted towards the horizon.
 */
export function buildClouds(count = CLOUD_COUNT) {
  const root = new THREE.Group()
  const material = new THREE.MeshLambertMaterial({ color: '#FFF3EA', transparent: true, opacity: 0.93, emissive: '#FFE6D6', emissiveIntensity: 0.35 })
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity: 0.32, depthWrite: false })
  const shadowGeo = new THREE.PlaneGeometry(1, 1)
  const clouds: Cloud[] = []

  for (let i = 0; i < count; i++) {
    const g = new THREE.Group()
    const puffs = 5 + Math.floor(rand(i + 1) * 4)
    const size = 240 + rand(i + 2) * 340
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(geo, material)
      const r = size * (0.45 + rand(i * 13 + p) * 0.55)
      puff.scale.set(r, r * 0.55, r * 0.85) // flattened, like cumulus
      puff.position.set((p - puffs / 2) * size * 0.62 + (rand(i * 7 + p) - 0.5) * size * 0.3, (rand(i * 5 + p) - 0.3) * size * 0.28, (rand(i * 3 + p) - 0.5) * size * 0.7)
      g.add(puff)
    }
    g.position.set((rand(i + 40) - 0.5) * 2 * AREA, 3200 + rand(i + 50) * 2600, (rand(i + 60) - 0.5) * 2 * AREA)
    root.add(g)

    // ground shadow: a flat soft ellipse the size of the cloud's footprint
    const shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.scale.set(puffs * size * 0.62 + size * 1.2, size * 1.9, 1)
    shadow.renderOrder = 1
    root.add(shadow)

    clouds.push({ group: g, shadow, speed: 14 + rand(i + 70) * 22 })
  }

  let last = 0
  return {
    group: root,
    /** Drift every cloud (and its shadow) slowly east, wrapping around at the edge of the area. */
    update(t: number) {
      const dt = last ? Math.min(t - last, 0.1) : 0
      last = t
      for (const c of clouds) {
        c.group.position.x += c.speed * dt
        if (c.group.position.x > AREA) c.group.position.x = -AREA
        const h = c.group.position.y
        c.shadow.position.set(c.group.position.x + h * SUN.x, 3, c.group.position.z + h * SUN.z)
      }
    },
  }
}
