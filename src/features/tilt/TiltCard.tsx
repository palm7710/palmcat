import { useRef, type ReactNode, type PointerEvent } from 'react'

type Props = {
  children: ReactNode
  className?: string
  /** 最大傾き（度） */
  max?: number
}

/**
 * マウスに合わせて立体的に傾くカード（CSS 3D）。
 * WebGL を使わない軽い立体表現。光の反射位置も一緒に動かします。
 */
export function TiltCard({ children, className = '', max = 10 }: Props) {
  const card = useRef<HTMLDivElement>(null)

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    const el = card.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    el.style.setProperty('--rx', `${(0.5 - y) * max}deg`)
    el.style.setProperty('--ry', `${(x - 0.5) * max}deg`)
    el.style.setProperty('--gx', `${x * 100}%`)
    el.style.setProperty('--gy', `${y * 100}%`)
  }

  const leave = () => {
    const el = card.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <div ref={card} className="tilt-inner">
        {children}
      </div>
    </div>
  )
}
