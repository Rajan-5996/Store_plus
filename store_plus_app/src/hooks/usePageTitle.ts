import { useEffect } from 'react'

/** Sets the browser tab title to "<page> · StorePulse AI". */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · StorePulse AI`
  }, [title])
}
