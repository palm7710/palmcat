import { useEffect, useRef } from 'react'
import { DirectionalLight, Group, HemisphereLight, MathUtils, PerspectiveCamera, Scene } from 'three'
import type { ProjectDevice } from '@/data/content'
import { registerView, reduceMotion } from '@/features/stage/viewStage'
import { getEnvironment } from '@/features/stage/environment'
import { createPhone, type Phone } from './phone'
import { createScreen } from './screens'

type Props = {
  devices: ProjectDevice[]
  /** ホバー・ドラッグを受け付ける要素（カード全体）。省略時は自身 */
  interactionRoot?: HTMLElement | null
}

// 端末の並べ方（台数ごと）。x はずらし量、rz/ry は角度
const LAYOUTS: Record<number, { x: number; y: number; z: number; ry: number; rz: number }[]> = {
  1: [{ x: 0, y: 0, z: 0, ry: -0.25, rz: 0.04 }],
  2: [
    { x: -0.42, y: -0.02, z: 0.15, ry: 0.32, rz: 0.03 },
    { x: 0.46, y: 0.08, z: -0.25, ry: -0.38, rz: -0.05 },
  ],
}

/**
 * 作品カードの中に iPhone / Android を 3D で表示。
 * - スクロールで端末が回り込む
 * - カードにホバーするとマウス方向に傾く
 * - ドラッグで回転（離すと元に戻る）
 */
export function DeviceShowcase({ devices, interactionRoot }: Props) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (!element) return

    const scene = new Scene()
    const camera = new PerspectiveCamera(28, 1, 0.1, 50)
    const envMap = getEnvironment()

    scene.add(new HemisphereLight(0xffffff, 0x111111, 0.6))
    const key = new DirectionalLight(0xffffff, 1.6)
    key.position.set(2, 3, 4)
    const rim = new DirectionalLight(0xfcee0a, 3.2)
    rim.position.set(-3, 1, -2)
    scene.add(key, rim)

    const rig = new Group()
    scene.add(rig)
    const layout = LAYOUTS[Math.min(devices.length, 2)]
    const videos: HTMLVideoElement[] = []
    const phones: Phone[] = devices.slice(0, 2).map((device, index) => {
      const screen = createScreen(device.mock, device.image, device.video)
      if (screen.video) videos.push(screen.video)
      const phone = createPhone(device.kind, screen, envMap)
      const slot = layout[index]
      phone.group.position.set(slot.x, slot.y, slot.z)
      phone.group.rotation.set(0, slot.ry, slot.rz)
      phone.group.userData.slot = slot
      phone.group.userData.phase = index * 1.7
      rig.add(phone.group)
      return phone
    })

    // 全端末が収まる距離を計算
    const contentWidth = devices.length > 1 ? 1.9 : 0.95
    const contentHeight = 1.75
    const fit = (width: number, height: number) => {
      const aspect = width / height
      const tan = Math.tan(MathUtils.degToRad(camera.fov / 2))
      const distV = contentHeight / 2 / tan
      const distH = contentWidth / 2 / (tan * aspect)
      camera.position.set(0, 0, Math.max(distV, distH) * 1.08)
      camera.lookAt(0, 0, 0)
    }

    // ---------- インタラクション ----------
    const root = interactionRoot ?? element
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const drag = { active: false, startX: 0, offset: 0, velocity: 0, lastX: 0 }
    let hover = 0
    let hoverTarget = 0

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      pointer.tx = MathUtils.clamp((event.clientX - rect.left) / rect.width - 0.5, -0.7, 0.7)
      pointer.ty = MathUtils.clamp((event.clientY - rect.top) / rect.height - 0.5, -0.7, 0.7)
      if (drag.active) {
        const dx = event.clientX - drag.lastX
        drag.lastX = event.clientX
        drag.offset += dx * 0.012
        drag.velocity = dx * 0.012
      }
    }
    const onEnter = () => (hoverTarget = 1)
    const onLeave = () => {
      hoverTarget = 0
      pointer.tx = 0
      pointer.ty = 0
    }
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return // スマホではスクロールを優先
      drag.active = true
      drag.lastX = event.clientX
      drag.velocity = 0
      element.setPointerCapture(event.pointerId)
    }
    const onUp = () => (drag.active = false)

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerenter', onEnter)
    root.addEventListener('pointerleave', onLeave)
    element.addEventListener('pointerdown', onDown)
    element.addEventListener('pointerup', onUp)
    element.addEventListener('pointercancel', onUp)

    const still = reduceMotion()

    const unregister = registerView({
      element,
      scene,
      camera,
      resize: fit,
      update: (elapsed, delta, visibility) => {
        const ease = 1 - Math.pow(0.001, delta) // フレームレートに依存しない補間
        pointer.x += (pointer.tx - pointer.x) * ease
        pointer.y += (pointer.ty - pointer.y) * ease
        hover += (hoverTarget - hover) * ease

        if (!drag.active) {
          // 離したら慣性 → ゆっくり元の角度へ
          drag.offset += drag.velocity
          drag.velocity *= 0.92
          drag.offset *= 1 - ease * 0.35
        }

        // 画面に入ってくる時に起き上がる（-1 → -0.35 の区間）
        const enter = still ? 1 : MathUtils.smoothstep(visibility, -0.95, -0.3)

        rig.rotation.y = (still ? 0 : -visibility * 0.55) + pointer.x * 0.6 + drag.offset
        rig.rotation.x = (1 - enter) * -0.9 + pointer.y * 0.35
        rig.position.y = (1 - enter) * -0.6
        rig.scale.setScalar(0.92 + hover * 0.06)

        for (const child of rig.children) {
          const slot = child.userData.slot as (typeof layout)[number]
          const phase = child.userData.phase as number
          child.position.y = slot.y + (still ? 0 : Math.sin(elapsed * 1.1 + phase) * 0.025)
          // ホバーで 2 台がふわっと離れる
          child.position.x = slot.x * (1 + hover * 0.12)
          child.rotation.z = slot.rz + (still ? 0 : Math.sin(elapsed * 0.8 + phase) * 0.015)
        }
      },
    })

    if (unregister) element.parentElement?.classList.add('has-3d')

    // 画面録画は見えている間だけ再生（「動きを減らす」設定では止めたまま）
    const observer = new IntersectionObserver(
      ([entry]) => {
        for (const video of videos) {
          if (entry.isIntersecting && !still) void video.play().catch(() => {})
          else video.pause()
        }
      },
      { threshold: 0.15 },
    )
    if (videos.length) observer.observe(element)

    return () => {
      unregister?.()
      observer.disconnect()
      element.parentElement?.classList.remove('has-3d')
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerenter', onEnter)
      root.removeEventListener('pointerleave', onLeave)
      element.removeEventListener('pointerdown', onDown)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', onUp)
      phones.forEach((phone) => phone.dispose())
    }
  }, [devices, interactionRoot])

  return <div ref={host} className="device-stage" aria-hidden="true" />
}
