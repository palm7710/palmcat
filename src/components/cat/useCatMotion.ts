import { useEffect, type RefObject } from 'react'

export function useCatMotion(target: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = target.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let disposed = false
    let cleanup = () => {}

    void import('gsap').then(({ gsap }) => {
      if (disposed) return

      const context = gsap.context(() => {
        gsap.timeline({ repeat: -1, repeatDelay: gsap.utils.random(1.2, 2.8) })
          .to(element, {
            yPercent: -0.35,
            scaleY: 1.004,
            scaleX: 0.998,
            duration: gsap.utils.random(2.4, 3.2),
            ease: 'sine.inOut',
          })
          .to(element, {
            yPercent: 0,
            scaleY: 1,
            scaleX: 1,
            duration: gsap.utils.random(2.8, 3.8),
            ease: 'sine.inOut',
          })
      }, element)

      cleanup = () => context.revert()
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [target])
}
