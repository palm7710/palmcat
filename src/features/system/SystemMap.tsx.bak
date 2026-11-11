import { useEffect, useRef } from 'react'
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { registerView, reduceMotion } from '@/features/stage/viewStage'
import { onHighlightLayer } from './bus'

type Node = { label: string; x: number; z: number }
type Layer = { id: string; name: string; tech: string; nodes: Node[] }

export const LAYERS: Layer[] = [
  {
    id: 'L1',
    name: 'INTERFACE',
    tech: 'SWIFT · SWIFTUI · KOTLIN',
    nodes: [
      { label: 'iOS APP', x: -1.05, z: -0.55 },
      { label: 'ANDROID', x: 0.1, z: -0.05 },
      { label: 'WIDGET', x: 1.15, z: -0.6 },
    ],
  },
  {
    id: 'L2',
    name: 'SERVICE',
    tech: 'GO · REST · GITHUB API',
    nodes: [
      { label: 'API', x: -0.7, z: -0.1 },
      { label: 'AUTH', x: 0.45, z: -0.65 },
      { label: 'WORKER', x: 1.25, z: -0.05 },
    ],
  },
  {
    id: 'L3',
    name: 'INFRASTRUCTURE',
    tech: 'CLOUDFLARE · VPS · LINUX',
    nodes: [
      { label: 'EDGE', x: -1.0, z: -0.5 },
      { label: 'VPS', x: 0.3, z: -0.05 },
      { label: 'DB', x: 1.2, z: -0.6 },
    ],
  },
]

// リクエストが通る経路（各層のノード番号）
const ROUTES = [
  [0, 0, 0],
  [1, 0, 1],
  [2, 2, 0],
  [0, 1, 1],
  [1, 2, 2],
]
const PACKETS_PER_ROUTE = 2
const PLATE_W = 3.6
const PLATE_D = 2.4

function drawPlateLabel(layer: Layer, index: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 800
  const ctx = canvas.getContext('2d')!
  const toX = (x: number) => (x / PLATE_W + 0.5) * canvas.width
  const toY = (z: number) => (z / PLATE_D + 0.5) * canvas.height

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // グリッド
  ctx.strokeStyle = 'rgba(252,238,10,0.10)'
  ctx.lineWidth = 2
  for (let x = 0; x <= canvas.width; x += 60) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  for (let y = 0; y <= canvas.height; y += 60) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
  // コーナーマーク
  ctx.strokeStyle = '#fcee0a'
  ctx.lineWidth = 6
  const c = 50
  for (const [x, y, dx, dy] of [
    [16, 16, 1, 1],
    [canvas.width - 16, 16, -1, 1],
    [16, canvas.height - 16, 1, -1],
    [canvas.width - 16, canvas.height - 16, -1, -1],
  ]) {
    ctx.beginPath()
    ctx.moveTo(x + dx * c, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + dy * c)
    ctx.stroke()
  }

  // 手前（カメラ側）の辺に層の名前を置く
  ctx.fillStyle = '#fcee0a'
  ctx.font = '600 30px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillText(`${layer.id} / 0${index + 1}`, 60, canvas.height - 200)
  ctx.fillStyle = '#f5f5f5'
  ctx.font = '900 104px Inter, -apple-system, sans-serif'
  ctx.fillText(layer.name, 54, canvas.height - 96)
  ctx.fillStyle = '#9a9a9a'
  ctx.font = '500 30px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillText(layer.tech, 60, canvas.height - 44)

  ctx.font = '600 30px "IBM Plex Mono", ui-monospace, monospace'
  for (const node of layer.nodes) {
    ctx.fillStyle = '#fcee0a'
    ctx.fillText(node.label, toX(node.x) - ctx.measureText(node.label).width / 2, toY(node.z) + 92)
  }
  return canvas
}

/**
 * 「INTERFACE → SERVICE → INFRASTRUCTURE」を立体のレイヤーで見せる構成図。
 * スクロールでレイヤーが分解（エクスプロード）し、層の間をデータの光が行き来します。
 */
export function SystemMap() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (!element) return
    const still = reduceMotion()

    const scene = new Scene()
    const camera = new PerspectiveCamera(26, 1, 0.1, 100)
    const viewDir = new Vector3(5.2, 4.4, 6.6).normalize()

    scene.add(new AmbientLight(0xffffff, 0.35))
    const key = new DirectionalLight(0xffffff, 1.4)
    key.position.set(3, 6, 4)
    const rim = new DirectionalLight(0xfcee0a, 2.2)
    rim.position.set(-4, -2, -3)
    scene.add(key, rim)

    const rig = new Group()
    scene.add(rig)

    const disposables: { dispose: () => void }[] = []
    const keep = <T extends { dispose: () => void }>(item: T) => {
      disposables.push(item)
      return item
    }

    const plateGeometry = keep(new BoxGeometry(PLATE_W, 0.06, PLATE_D))
    const plateEdges = keep(new EdgesGeometry(plateGeometry))
    const labelGeometry = keep(new PlaneGeometry(PLATE_W, PLATE_D))
    const nodeGeometry = keep(new BoxGeometry(0.34, 0.16, 0.34))
    const nodeEdges = keep(new EdgesGeometry(nodeGeometry))

    type LayerObjects = {
      group: Group
      plateMaterial: MeshPhysicalMaterial
      edgeMaterial: LineBasicMaterial
      labelMaterial: MeshBasicMaterial
      nodeMaterial: MeshStandardMaterial
      emphasis: number
    }

    const layers: LayerObjects[] = LAYERS.map((layer, index) => {
      const group = new Group()
      const plateMaterial = keep(
        new MeshPhysicalMaterial({
          color: 0x0d0d0d,
          metalness: 0.3,
          roughness: 0.35,
          transparent: true,
          opacity: 0.86,
          clearcoat: 1,
        }),
      )
      group.add(new Mesh(plateGeometry, plateMaterial))
      const edgeMaterial = keep(new LineBasicMaterial({ color: 0xfcee0a, transparent: true, opacity: 0.8 }))
      group.add(new LineSegments(plateEdges, edgeMaterial))

      const texture = keep(new CanvasTexture(drawPlateLabel(layer, index)))
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 8
      void document.fonts?.ready.then(() => {
        texture.image = drawPlateLabel(layer, index)
        texture.needsUpdate = true
      })
      const labelMaterial = keep(
        new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
      )
      const label = new Mesh(labelGeometry, labelMaterial)
      label.rotation.x = -Math.PI / 2
      label.position.y = 0.032
      group.add(label)

      const nodeMaterial = keep(
        new MeshStandardMaterial({ color: 0x111111, emissive: new Color(0xfcee0a), emissiveIntensity: 0.05, roughness: 0.4 }),
      )
      for (const node of layer.nodes) {
        const box = new Mesh(nodeGeometry, nodeMaterial)
        box.position.set(node.x, 0.11, node.z)
        const outline = new LineSegments(nodeEdges, edgeMaterial)
        outline.position.copy(box.position)
        group.add(box, outline)
      }
      rig.add(group)
      return { group, plateMaterial, edgeMaterial, labelMaterial, nodeMaterial, emphasis: 1 }
    })

    // 層をつなぐ線
    const linkPositions = new Float32Array(ROUTES.length * 2 * 2 * 3)
    const linkGeometry = keep(new BufferGeometry())
    linkGeometry.setAttribute('position', new BufferAttribute(linkPositions, 3))
    const linkMaterial = keep(new LineBasicMaterial({ color: 0xfcee0a, transparent: true, opacity: 0.28 }))
    rig.add(new LineSegments(linkGeometry, linkMaterial))

    // データパケット
    const packetGeometry = keep(new SphereGeometry(0.045, 12, 12))
    const packetMaterial = keep(new MeshBasicMaterial({ color: 0xfff98a, toneMapped: false }))
    const packets = new InstancedMesh(packetGeometry, packetMaterial, ROUTES.length * PACKETS_PER_ROUTE)
    rig.add(packets)

    const matrix = new Matrix4()
    const a = new Vector3()
    const b = new Vector3()
    const point = new Vector3()
    const nodePoint = (layer: number, node: number, y: number, out: Vector3) =>
      out.set(LAYERS[layer].nodes[node].x, y + 0.11, LAYERS[layer].nodes[node].z)

    // ---------- ハイライト（スキル一覧のホバーと連動） ----------
    let highlighted: number | null = null
    const stopListening = onHighlightLayer((layer) => (highlighted = layer))

    // ---------- カメラ ----------
    const fit = (width: number, height: number) => {
      const aspect = width / height
      const tan = Math.tan(MathUtils.degToRad(camera.fov / 2))
      const dist = Math.max(4.6 / 2 / (tan * aspect), 3.9 / 2 / tan) * 1.05
      camera.position.copy(viewDir).multiplyScalar(dist)
      camera.lookAt(0, -0.05, 0)
    }

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      pointer.tx = MathUtils.clamp((event.clientX - rect.left) / rect.width - 0.5, -0.6, 0.6)
      pointer.ty = MathUtils.clamp((event.clientY - rect.top) / rect.height - 0.5, -0.6, 0.6)
    }
    const onLeave = () => {
      pointer.tx = 0
      pointer.ty = 0
    }
    const root = element.parentElement ?? element
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)

    const unregister = registerView({
      element,
      scene,
      camera,
      resize: fit,
      update: (elapsed, delta, visibility) => {
        const ease = 1 - Math.pow(0.002, delta)
        pointer.x += (pointer.tx - pointer.x) * ease
        pointer.y += (pointer.ty - pointer.y) * ease

        // スクロールでレイヤーが分解していく
        const explode = still ? 1 : MathUtils.smoothstep(visibility, -0.85, -0.15)
        const gap = MathUtils.lerp(0.14, 1.05, explode)
        const ys = [gap, 0, -gap]

        rig.rotation.y = (still ? 0 : visibility * 0.4 + Math.sin(elapsed * 0.25) * 0.06) + pointer.x * 0.35
        rig.rotation.x = pointer.y * 0.12

        layers.forEach((layer, index) => {
          layer.group.position.y = ys[index]
          const target = highlighted === null ? 1 : highlighted === index ? 1.35 : 0.25
          layer.emphasis += (target - layer.emphasis) * ease
          const e = layer.emphasis
          layer.edgeMaterial.opacity = Math.min(1, 0.25 + e * 0.55)
          layer.labelMaterial.opacity = Math.min(1, 0.2 + e * 0.8)
          layer.plateMaterial.opacity = 0.5 + Math.min(1, e) * 0.36
          layer.nodeMaterial.emissiveIntensity = 0.04 + Math.max(0, e - 1) * 1.6 + (still ? 0 : Math.sin(elapsed * 2 + index) * 0.02)
          // 選ばれた層は少し浮き上がる
          layer.group.position.y += Math.max(0, e - 1) * 0.35
        })

        // 線とパケットの位置を更新
        let li = 0
        ROUTES.forEach((route, r) => {
          for (let s = 0; s < 2; s += 1) {
            nodePoint(s, route[s], layers[s].group.position.y, a)
            nodePoint(s + 1, route[s + 1], layers[s + 1].group.position.y, b)
            linkPositions.set([a.x, a.y, a.z, b.x, b.y, b.z], li)
            li += 6
          }
          for (let p = 0; p < PACKETS_PER_ROUTE; p += 1) {
            // 偶数パケットは下り（リクエスト）、奇数は上り（レスポンス）
            let u = (elapsed * 0.32 + r * 0.21 + p * 0.5) % 1
            if (p % 2 === 1) u = 1 - u
            const segment = u < 0.5 ? 0 : 1
            const local = (u - segment * 0.5) * 2
            nodePoint(segment, route[segment], layers[segment].group.position.y, a)
            nodePoint(segment + 1, route[segment + 1], layers[segment + 1].group.position.y, b)
            point.lerpVectors(a, b, local)
            const pulse = 0.8 + Math.sin(local * Math.PI) * 0.6
            matrix.makeScale(pulse, pulse, pulse).setPosition(point)
            packets.setMatrixAt(r * PACKETS_PER_ROUTE + p, matrix)
          }
        })
        linkGeometry.attributes.position.needsUpdate = true
        packets.instanceMatrix.needsUpdate = true
        packets.visible = explode > 0.4
      },
    })

    if (unregister) element.parentElement?.classList.add('has-3d')

    return () => {
      unregister?.()
      stopListening()
      element.parentElement?.classList.remove('has-3d')
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      packets.dispose()
      disposables.forEach((item) => item.dispose())
    }
  }, [])

  return <div ref={host} className="system-stage-gl" aria-hidden="true" />
}
