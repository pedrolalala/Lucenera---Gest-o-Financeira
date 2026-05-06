import { useEffect, useRef } from 'react'

export function useAutoScroll(dependencies: React.DependencyList) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, dependencies)

  return scrollRef
}
