import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useRevealAnimation(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!scope.current) return

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((item) => {
        gsap.fromTo(
          item,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 88%', once: true },
          },
        )
      })
    }, scope)

    return () => context.revert()
  }, [scope])
}
