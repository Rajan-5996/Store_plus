import * as THREE from 'three'
import type { Warehouse } from '@/data/warehouses'
import { buildRider } from './riderModel'

/** Riders are drawn much larger than life (a 4 m scooter would be invisible at city zoom). */
const RIDER_SCALE = 42

interface Bee {
  rider: THREE.Group
  cx: number
  cz: number
  radius: number
  speed: number
  phase: number
  dir: 1 | -1
  squash: number
  trips: number
}

/** Deterministic pseudo-random in [0,1) so the swarm looks the same on every load. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Delivery partners buzzing around each warehouse like bees: orbiting, drifting in and out, bobbing. */
export class Swarm {
  private bees: Bee[] = []

  /** More orders per day means more riders on the road (5 to 12). */
  addFor(scene: THREE.Scene, w: Warehouse, cx: number, cz: number) {
    const count = Math.max(5, Math.min(12, Math.round(w.orders / 95)))
    for (let i = 0; i < count; i++) {
      const seed = w.id.charCodeAt(2) * 31 + w.id.charCodeAt(3) * 7 + i * 13
      const rider = buildRider()
      rider.scale.setScalar(RIDER_SCALE)
      scene.add(rider)
      this.bees.push({
        rider,
        cx,
        cz,
        radius: 740 + rand(seed) * 340, // orbit sits between the building and the catchment ring
        speed: (0.16 + rand(seed + 1) * 0.22) * (rand(seed + 2) > 0.5 ? 1 : -1),
        phase: rand(seed + 3) * Math.PI * 2,
        dir: rand(seed + 2) > 0.5 ? 1 : -1,
        squash: 0.75 + rand(seed + 4) * 0.35,
        trips: 0.5 + rand(seed + 5) * 0.9,
      })
    }
  }

  private position(b: Bee, t: number) {
    const a = b.phase + t * b.speed
    // radius drifts in and out (heading to a drop-off and back), like bees weaving around a hive
    const r = b.radius * (1 + 0.28 * Math.sin(t * 0.55 * b.trips + b.phase * 3))
    return { x: b.cx + Math.cos(a) * r, z: b.cz + Math.sin(a) * r * b.squash }
  }

  update(t: number) {
    for (const b of this.bees) {
      const p = this.position(b, t)
      const next = this.position(b, t + 0.05)
      b.rider.position.set(p.x, 4 + Math.abs(Math.sin(t * 7 + b.phase)) * 8, p.z) // small hop = buzzing
      b.rider.rotation.y = -Math.atan2(next.z - p.z, next.x - p.x) // face the direction of travel
    }
  }
}
