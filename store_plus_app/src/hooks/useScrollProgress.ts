import { useEffect, useState } from 'react'

/** Returns 0..1 — how far the window has scrolled through the first `distance` px. */
export function useScrollProgress(distance = 96): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setProgress(Math.min(window.scrollY / distance, 1))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [distance])

  return progress
}
