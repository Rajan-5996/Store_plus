import { useEffect } from 'react'
import { useMap } from '@/components/ui/map'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Trackpad / mouse / touch orbit controls (no on-screen console):
 *  - click-and-drag (one finger) rotates the map and tilts it, so a warehouse can be viewed from any side
 *  - Shift + drag pans
 *  - scroll / two-finger swipe moves (pans) the map to other regions
 *  - pinch (or Ctrl + scroll) zooms
 * Renders nothing; attaches pointer listeners to the surrounding <Map>.
 */
export default function OrbitGestures() {
  const { map } = useMap()

  useEffect(() => {
    if (!map) return
    const canvas = map.getCanvasContainer()
    map.dragPan.disable() // left-drag is used for orbiting instead
    map.scrollZoom.disable() // the wheel / two-finger swipe pans instead; pinch zooms (see onWheel)
    canvas.style.cursor = 'grab'
    canvas.style.touchAction = 'none'

    const active = new Set<number>()
    let last: { x: number; y: number; pan: boolean } | null = null

    const down = (e: PointerEvent) => {
      if (e.button > 0) return // right-click rotate stays MapLibre's own behaviour
      active.add(e.pointerId)
      if (active.size > 1) {
        last = null // two fingers: leave pinch-zoom / twist-rotate to MapLibre
        return
      }
      last = { x: e.clientX, y: e.clientY, pan: e.shiftKey }
      canvas.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      if (!last || active.size !== 1 || !active.has(e.pointerId)) return
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      if (last.pan) map.panBy([-dx, -dy], { duration: 0 })
      else {
        map.setBearing(map.getBearing() - dx * 0.4)
        map.setPitch(clamp(map.getPitch() - dy * 0.3, 0, 85))
      }
      last = { ...last, x: e.clientX, y: e.clientY }
    }
    const up = (e: PointerEvent) => {
      active.delete(e.pointerId)
      last = null
      canvas.style.cursor = 'grab'
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        // trackpad pinch arrives as a ctrl+wheel event
        const r = canvas.getBoundingClientRect()
        const around = map.unproject([e.clientX - r.left, e.clientY - r.top])
        map.easeTo({ zoom: map.getZoom() - e.deltaY * 0.012, around, duration: 0 })
      } else {
        map.panBy([e.deltaX, e.deltaY], { duration: 0 })
      }
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      map.dragPan.enable()
      map.scrollZoom.enable()
      canvas.style.cursor = ''
    }
  }, [map])

  return null
}
