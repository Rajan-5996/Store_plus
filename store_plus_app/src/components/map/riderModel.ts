import * as THREE from 'three'

// Shared geometries / materials: dozens of riders are created, so everything is reused.
const matte = (color: string, emissive?: string) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1, emissive: emissive ?? '#000000', emissiveIntensity: emissive ? 0.35 : 0 })

const M = {
  body: matte('#2B2F3A'),
  wheel: matte('#111318'),
  jacket: matte('#1E293B'),
  skin: matte('#E8B98F'),
  helmet: matte('#FF5200', '#FF5200'),
  bag: matte('#FF7A33', '#FF5200'),
}

const G = {
  body: new THREE.BoxGeometry(2.6, 0.7, 0.9),
  shield: new THREE.BoxGeometry(0.3, 1.4, 0.8),
  wheel: new THREE.CylinderGeometry(0.5, 0.5, 0.3, 14),
  torso: new THREE.BoxGeometry(0.75, 1.15, 0.75),
  head: new THREE.SphereGeometry(0.36, 12, 12),
  helmet: new THREE.SphereGeometry(0.42, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
  bag: new THREE.BoxGeometry(1.15, 1.15, 1.15),
}

function part(geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  return m
}

/**
 * A tiny delivery partner on a scooter with an orange delivery bag. Metres, Y up, facing +X, about 4 m long —
 * scale the returned group up for visibility.
 */
export function buildRider(): THREE.Group {
  const g = new THREE.Group()
  g.add(part(G.body, M.body, 0, 0.95, 0))
  g.add(part(G.shield, M.body, 1.05, 1.7, 0))
  const front = part(G.wheel, M.wheel, 1.0, 0.5, 0)
  const rear = part(G.wheel, M.wheel, -1.0, 0.5, 0)
  front.rotation.x = rear.rotation.x = Math.PI / 2
  g.add(front, rear)
  g.add(part(G.torso, M.jacket, -0.15, 2.0, 0))
  g.add(part(G.head, M.skin, -0.05, 2.95, 0))
  g.add(part(G.helmet, M.helmet, -0.05, 3.0, 0))
  g.add(part(G.bag, M.bag, -1.05, 2.3, 0))
  return g
}
