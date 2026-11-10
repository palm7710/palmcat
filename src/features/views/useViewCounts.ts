import { useEffect, useRef, useState } from 'react'

type ViewCountResponse = {
  count: number
}

type ViewCountsResponse = {
  counts: Record<string, number>
}

export function formatViewCount(count: number | undefined): string {
  return count === undefined ? '—' : new Intl.NumberFormat('en-US').format(count)
}

export function usePostViewCount(postNumber: string | undefined): number | undefined {
  const [count, setCount] = useState<number>()
  const requestedPost = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!postNumber || requestedPost.current === postNumber) return
    requestedPost.current = postNumber

    const controller = new AbortController()
    const storageKey = `palm:viewed:${postNumber}`
    let shouldIncrement = false

    try {
      shouldIncrement = localStorage.getItem(storageKey) === null
      if (shouldIncrement) localStorage.setItem(storageKey, '1')
    } catch {
      shouldIncrement = true
    }

    void fetch(`/api/views/${postNumber}`, {
      method: shouldIncrement ? 'POST' : 'GET',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`View request failed: ${response.status}`)
        return response.json() as Promise<ViewCountResponse>
      })
      .then((data) => setCount(data.count))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (shouldIncrement) {
          try {
            localStorage.removeItem(storageKey)
          } catch {
            // Storage is unavailable; a later visit can retry.
          }
        }
        console.error(error)
      })

    return () => controller.abort()
  }, [postNumber])

  return count
}

export function useViewCounts(postNumbers: string[]): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const postNumberList = postNumbers.join(',')

  useEffect(() => {
    if (!postNumberList) return

    const controller = new AbortController()
    void fetch(`/api/views?posts=${encodeURIComponent(postNumberList)}`, {
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`View request failed: ${response.status}`)
        return response.json() as Promise<ViewCountsResponse>
      })
      .then((data) => setCounts(data.counts))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.error(error)
      })

    return () => controller.abort()
  }, [postNumberList])

  return counts
}
