import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useCatMotion } from './useCatMotion'

const CAT_IMAGE =
  'https://images.unsplash.com/photo-1503431128871-cd250803fa41?auto=format&fit=crop&w=1400&q=88'

type BlackCatProps = {
  small?: boolean
}

export function BlackCat({ small = false }: BlackCatProps) {
  const [active, setActive] = useState(false)
  const motion = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLImageElement>(null)
  useCatMotion(motion)

  const resetGaze = () => {
    image.current?.style.removeProperty('--cat-focus-x')
    image.current?.style.removeProperty('--cat-focus-y')
    setActive(false)
  }

  const followPointer = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    image.current?.style.setProperty('--cat-focus-x', `${50 + x * 3}%`)
    image.current?.style.setProperty('--cat-focus-y', `${50 + y * 2}%`)
  }

  const toggleWithKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setActive((value) => !value)
  }

  return (
    <figure
      className={`cat ${small ? 'cat-small' : ''} ${active ? 'cat-react' : ''}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={resetGaze}
      onPointerMove={followPointer}
      onClick={() => setActive((value) => !value)}
      onKeyDown={toggleWithKeyboard}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label="黒猫に反応してもらう"
    >
      <div ref={motion} className="cat-motion">
        <img
          ref={image}
          src={CAT_IMAGE}
          alt="琥珀色の瞳を持つ黒猫"
          decoding="async"
          loading={small ? 'lazy' : 'eager'}
          fetchPriority={small ? 'auto' : 'high'}
        />
      </div>
      <figcaption>
        <span>FREEDOM ENTITY</span>
        <span>BC—01</span>
      </figcaption>
    </figure>
  )
}
