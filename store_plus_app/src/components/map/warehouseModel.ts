import * as THREE from 'three'

const mat = (color: string | number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1, ...extra })

function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.position.set(x, y, z)
  return mesh
}

/**
 * A stylised two-storey dark-store warehouse, modelled in metres (Y is up, +Z is the south-facing front):
 * yard slab, ground-floor hall with loading docks, orange brand band, a smaller upper floor with
 * glazing, rooftop units, a parked truck, crates and a status beacon.
 */
export function buildWarehouse(statusColor: string): THREE.Group {
  const g = new THREE.Group()
  const wall = mat('#F1E9E1')
  const orange = mat('#FF5200', { emissive: '#FF5200', emissiveIntensity: 0.25 })
  const dark = mat('#2B2F3A')
  const roofMat = mat('#CFC6BC')
  const glass = mat('#6FA8DC', { emissive: '#3B7DD8', emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.4 })

  g.add(box(84, 1, 64, mat('#4A4F5C'), 0, 0.5, 0)) // yard slab

  // ---- ground floor
  g.add(box(62, 12, 42, wall, 0, 7, 0))
  g.add(box(62.4, 2.4, 42.4, orange, 0, 14.2, 0)) // brand band / slab between floors
  for (let i = 0; i < 4; i++) {
    g.add(box(8, 9, 1.2, dark, -21 + i * 14, 5.5, 21.6)) // dock doors
    g.add(box(8.4, 0.9, 1.6, orange, -21 + i * 14, 10.6, 21.8)) // dock lights
  }

  // ---- upper floor (set back, leaving a roof terrace around it)
  g.add(box(50, 12, 32, wall, 0, 21.4, 0))
  for (let i = 0; i < 6; i++) {
    g.add(box(5.4, 5, 0.5, glass, -20.5 + i * 8.2, 22.4, 16.2)) // front windows
    g.add(box(5.4, 5, 0.5, glass, -20.5 + i * 8.2, 22.4, -16.2)) // back windows
  }
  for (let j = 0; j < 3; j++) {
    g.add(box(0.5, 5, 5.4, glass, 25.2, 22.4, -9 + j * 9)) // side windows
    g.add(box(0.5, 5, 5.4, glass, -25.2, 22.4, -9 + j * 9))
  }
  g.add(box(52, 1.4, 34, roofMat, 0, 28.1, 0)) // upper roof
  g.add(box(52.4, 0.9, 34.4, orange, 0, 27.2, 0)) // roof trim

  // rooftop units + terrace units
  g.add(box(7, 2.6, 5, dark, -14, 30, -4))
  g.add(box(7, 2.6, 5, dark, 8, 30, 5))
  g.add(box(5, 2, 4, dark, 22, 16.8, 15))
  g.add(box(5, 2, 4, dark, -22, 16.8, -15))

  // ---- delivery truck parked in the yard
  g.add(box(20, 7.5, 7, mat('#F8F5F1'), -28, 4.7, 36)) // trailer
  g.add(box(6, 6, 7, mat('#1F6FEB'), -15.5, 4.2, 36)) // cab
  g.add(box(21, 0.8, 7.4, dark, -28, 1.3, 36)) // chassis

  // ---- crates
  g.add(box(6, 6, 6, orange, 30, 3.5, 33))
  g.add(box(6, 6, 6, orange, 37, 3.5, 33))
  g.add(box(6, 6, 6, mat('#FFB892'), 33.5, 9.3, 33))

  // ---- status beacon (mast + glowing orb)
  const beaconMat = mat(statusColor, { emissive: statusColor, emissiveIntensity: 0.9 })
  g.add(box(1.2, 44, 1.2, mat('#3A3F4C'), 0, 50, 0))
  const orb = new THREE.Mesh(new THREE.SphereGeometry(4.2, 24, 24), beaconMat)
  orb.position.set(0, 74, 0)
  orb.name = 'beacon'
  g.add(orb)

  return g
}

/** Flat catchment disc + ring on the ground (true metres, not exaggerated). */
export function buildCatchment(statusColor: string, radius = 1150): THREE.Group {
  const g = new THREE.Group()
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 72),
    new THREE.MeshBasicMaterial({ color: statusColor, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }),
  )
  disc.rotation.x = -Math.PI / 2
  disc.position.y = 0.6
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius - 16, radius, 96),
    new THREE.MeshBasicMaterial({ color: statusColor, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.8
  ring.name = 'ring'
  g.add(disc, ring)
  return g
}
