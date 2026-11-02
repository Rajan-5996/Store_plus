import * as THREE from 'three'
import type { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl'
import type { MapLibreModule } from '@/components/ui/map/mapLib'
import { STATUS_COLORS, type Warehouse } from '@/data/warehouses'
import { buildCatchment, buildWarehouse } from './warehouseModel'
import { Swarm } from './riderSwarm'
import { buildClouds } from './cloudScene'

export const WAREHOUSE_LAYER_ID = 'storepulse-3d-warehouses'

/** The buildings are drawn larger than life so they are readable at city zoom levels. */
const BUILDING_EXAGGERATION = 11

/** Local east/north offsets in metres from an origin. */
function toMetres(lng: number, lat: number, lng0: number, lat0: number) {
  return {
    east: (lng - lng0) * 111320 * Math.cos((lat0 * Math.PI) / 180),
    north: (lat - lat0) * 110574,
  }
}

/** A MapLibre custom layer that renders 3D warehouses, catchment zones and swarming delivery partners with three.js. */
export function createWarehouseLayer(mapLib: MapLibreModule, items: Warehouse[], id: string = WAREHOUSE_LAYER_ID, cloudCount?: number): CustomLayerInterface {
  const lng0 = items.reduce((a, w) => a + w.lng, 0) / items.length
  const lat0 = items.reduce((a, w) => a + w.lat, 0) / items.length
  const origin = mapLib.MercatorCoordinate.fromLngLat([lng0, lat0], 0)
  const unit = origin.meterInMercatorCoordinateUnits()

  const camera = new THREE.Camera()
  const scene = new THREE.Scene()
  const swarm = new Swarm()
  const clouds = buildClouds(cloudCount)
  let renderer: THREE.WebGLRenderer | null = null
  let map: MapLibreMap | null = null
  const rings: THREE.Object3D[] = []
  const beacons: THREE.Object3D[] = []

  return {
    id,
    type: 'custom',
    renderingMode: '3d',

    onAdd(m, gl) {
      map = m
      scene.add(new THREE.AmbientLight(0xffffff, 1.35))
      const sun = new THREE.DirectionalLight(0xfff1e6, 1.9)
      sun.position.set(-120, 260, 160)
      scene.add(sun)
      scene.add(clouds.group)

      for (const w of items) {
        const { east, north } = toMetres(w.lng, w.lat, lng0, lat0)
        const colour = STATUS_COLORS[w.status]
        const holder = new THREE.Group()
        holder.position.set(east, 0, -north) // model +Z is south

        const building = buildWarehouse(colour)
        building.scale.setScalar(BUILDING_EXAGGERATION)
        building.rotation.y = ((w.id.charCodeAt(2) % 4) * Math.PI) / 8 // slight variety in orientation
        holder.add(building)

        const catchment = buildCatchment(colour)
        holder.add(catchment)
        rings.push(catchment.getObjectByName('ring')!)
        beacons.push(building.getObjectByName('beacon')!)
        scene.add(holder)

        swarm.addFor(scene, w, east, -north)
      }

      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true })
      renderer.autoClear = false
    },

    render(_gl, options) {
      if (!renderer || !map) return
      const t = performance.now() / 1000
      rings.forEach((r, i) => {
        const s = 1 + 0.02 * Math.sin(t * 1.6 + i)
        r.scale.set(s, s, 1)
      })
      beacons.forEach((b, i) => b.scale.setScalar(1 + 0.12 * Math.sin(t * 2.4 + i)))
      swarm.update(t)
      clouds.update(t)

      const matrix = options.defaultProjectionData?.mainMatrix ?? options.modelViewProjectionMatrix
      if (!matrix) return
      const rotateX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
      const m = new THREE.Matrix4().fromArray(Array.from(matrix))
      const l = new THREE.Matrix4()
        .makeTranslation(origin.x, origin.y, origin.z ?? 0)
        .scale(new THREE.Vector3(unit, -unit, unit))
        .multiply(rotateX)
      camera.projectionMatrix = m.multiply(l)
      renderer.resetState()
      renderer.render(scene, camera)
      map.triggerRepaint()
    },

    onRemove() {
      renderer?.dispose()
      renderer = null
    },
  }
}
