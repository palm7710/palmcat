import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  InstancedMesh,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { registerView, reduceMotion } from '@/features/stage/viewStage'
import { getEnvironment } from '@/features/stage/environment'
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

/** Blender で作ったモデル（public/models/system-map.glb） */
const MODEL_URL = `${import.meta.env.BASE_URL}models/system-map.glb`
const YELLOW = 0xfcee0a

// リクエストが通る経路（各層のノード番号）
const ROUTES = [
  [0, 0, 0],
  [1, 0, 1],
  [2, 2, 0],
  [0, 1, 1],
  [1, 2, 2],
  [2, 1, 2],
  [0, 0, 1],
  [1, 1, 0],
]
const PACKETS_PER_ROUTE = 3
const PACKET_COUNT = ROUTES.length * PACKETS_PER_ROUTE
/** 層の間を漂う光の粒 */
const DOT_COUNT = 140
// モデルの天板サイズ（Blender 側で 0.36 倍して書き出し）
const PLATE_W = 3.55
const PLATE_D = 2.11

function drawGrid() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = Math.round((1024 * PLATE_D) / PLATE_W)
  const ctx = canvas.getContext('2d')!
  const step = canvas.width / 20
  ctx.strokeStyle = 'rgba(245,245,235,0.12)'
  ctx.lineWidth = 1.5
  for (let x = step; x < canvas.width; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  for (let y = step; y < canvas.height; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
  return canvas
}

function drawDot() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.8)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return canvas
}

type LayerObjects = {
  group: Object3D
  nodes: Vector3[]
  glass: MeshPhysicalMaterial
  edge: MeshBasicMaterial
  accent: MeshBasicMaterial
  grid: MeshBasicMaterial
  text: MeshBasicMaterial
  node: MeshPhysicalMaterial
  nodeLine: LineBasicMaterial
  emphasis: number
}

/**
 * 「INTERFACE → SERVICE → INFRASTRUCTURE」を立体のレイヤーで見せる構成図。
 * ガラスの板は Blender で作ったモデルを読み込み、層の間をデータの光が行き来します。
 * スクロールでレイヤーが分解（エクスプロード）し、スキル一覧のホバーで層がハイライトされます。
 */
export function SystemMap() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (!element) return
    const still = reduceMotion()
    let disposed = false

    const scene = new Scene()
    const camera = new PerspectiveCamera(26, 1, 0.1, 100)
    const viewDir = new Vector3(5.2, 4.4, 6.6).normalize()

    scene.add(new AmbientLight(0xffffff, 0.4))
    const key = new DirectionalLight(0xffffff, 1.6)
    key.position.set(3, 6, 4)
    const rim = new DirectionalLight(YELLOW, 2.4)
    rim.position.set(-4, -2, -3)
    scene.add(key, rim)
    const envMap = getEnvironment()

    const rig = new Group()
    scene.add(rig)

    const disposables: { dispose: () => void }[] = []
    const keep = <T extends { dispose: () => void }>(item: T) => {
      disposables.push(item)
      return item
    }

    const gridTexture = keep(new CanvasTexture(drawGrid()))
    gridTexture.colorSpace = SRGBColorSpace
    gridTexture.anisotropy = 8
    const dotTexture = keep(new CanvasTexture(drawDot()))

    // ---------- レイヤー（GLB 読み込み後に組み立て） ----------
    let layers: LayerObjects[] = []

    const buildLayer = (group: Object3D): LayerObjects => {
      const glass = keep(
        new MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.06,
          metalness: 0,
          transparent: true,
          opacity: 0.16,
          clearcoat: 1,
          clearcoatRoughness: 0.04,
          envMap,
          envMapIntensity: 1.4,
          depthWrite: false,
          side: DoubleSide,
        }),
      )
      const edge = keep(new MeshBasicMaterial({ color: YELLOW, transparent: true, toneMapped: false }))
      const accent = keep(new MeshBasicMaterial({ color: YELLOW, transparent: true, toneMapped: false }))
      const grid = keep(new MeshBasicMaterial({ map: gridTexture, transparent: true, depthWrite: false, toneMapped: false }))
      const text = keep(new MeshBasicMaterial({ color: 0xf5f5f5, transparent: true, toneMapped: false }))
      const metal = keep(new MeshStandardMaterial({ color: 0xa0a0a0, metalness: 1, roughness: 0.3, envMap }))
      const node = keep(
        new MeshPhysicalMaterial({
          color: 0xffd400,
          emissive: new Color(YELLOW),
          emissiveIntensity: 0.08,
          roughness: 0.05,
          metalness: 0,
          transparent: true,
          opacity: 0.6,
          clearcoat: 1,
          envMap,
          envMapIntensity: 1.2,
        }),
      )
      const nodeLine = keep(new LineBasicMaterial({ color: YELLOW, transparent: true, opacity: 0.9 }))

      const nodes: Vector3[] = []
      for (const child of [...group.children]) {
        if (!(child instanceof Mesh)) continue
        keep(child.geometry)
        const name = child.name
        if (name.endsWith('_Glass')) {
          child.material = glass
          child.renderOrder = 1
        } else if (name.endsWith('_Edge')) {
          child.material = edge
        } else if (name.endsWith('_Grid')) {
          child.material = grid
          child.renderOrder = 2
        } else if (name.endsWith('_Brackets') || name.endsWith('_Tag')) {
          child.material = accent
        } else if (name.endsWith('_Screws')) {
          child.material = metal
        } else if (name.endsWith('_Title') || name.endsWith('_Labels')) {
          child.material = text
        } else if (name.startsWith('Node_')) {
          child.material = node
          child.renderOrder = 3
          // ガラスのキューブの輪郭を黄色い線で
          child.geometry.computeBoundingBox()
          const size = child.geometry.boundingBox!.getSize(new Vector3())
          const box = new BoxGeometry(size.x, size.y, size.z)
          const outline = new LineSegments(keep(new EdgesGeometry(box)), nodeLine)
          box.dispose()
          child.add(outline)
          nodes[Number(name.split('_').pop())] = child.position.clone()
        }
      }
      return { group, nodes, glass, edge, accent, grid, text, node, nodeLine, emphasis: 1 }
    }

    // ---------- データパケット（線は描かず、光の粒だけが行き来する） ----------
    const packetGeometry = keep(new SphereGeometry(0.03, 12, 12))
    const packetMaterial = keep(new MeshBasicMaterial({ color: 0xfff7a0, toneMapped: false }))
    const packets = new InstancedMesh(packetGeometry, packetMaterial, PACKET_COUNT)
    packets.visible = false
    rig.add(packets)

    const haloPositions = new Float32Array(PACKET_COUNT * 3)
    const haloGeometry = keep(new BufferGeometry())
    haloGeometry.setAttribute('position', new BufferAttribute(haloPositions, 3))
    const haloMaterial = keep(
      new PointsMaterial({
        color: 0xffe14a,
        size: 0.22,
        map: dotTexture,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    )
    const halos = new Points(haloGeometry, haloMaterial)
    halos.visible = false
    rig.add(halos)

    // ---------- 漂う光の粒 ----------
    const dotSeeds = Array.from({ length: DOT_COUNT }, () => ({
      x: MathUtils.randFloat(-PLATE_W / 2, PLATE_W / 2),
      z: MathUtils.randFloat(-PLATE_D / 2, PLATE_D / 2),
      t: Math.random(),
      phase: Math.random() * Math.PI * 2,
      speed: MathUtils.randFloat(0.15, 0.45),
      twinkle: MathUtils.randFloat(0.6, 2.2),
      level: MathUtils.randFloat(0.25, 1),
    }))
    const dotPositions = new Float32Array(DOT_COUNT * 3)
    const dotColors = new Float32Array(DOT_COUNT * 3)
    const dotGeometry = keep(new BufferGeometry())
    dotGeometry.setAttribute('position', new BufferAttribute(dotPositions, 3))
    dotGeometry.setAttribute('color', new BufferAttribute(dotColors, 3))
    const dotMaterial = keep(
      new PointsMaterial({
        size: 0.07,
        map: dotTexture,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    )
    const dots = new Points(dotGeometry, dotMaterial)
    dots.visible = false
    rig.add(dots)

    const loader = new GLTFLoader()
    loader.load(
      MODEL_URL,
      (gltf) => {
        const sources = ['L1', 'L2', 'L3'].map((id) => gltf.scene.getObjectByName(id))
        if (disposed || sources.some((source) => !source)) {
          gltf.scene.traverse((object) => {
            if (object instanceof Mesh) object.geometry.dispose()
          })
          return
        }
        layers = sources.map((source) => {
          const layer = buildLayer(source!)
          rig.add(layer.group)
          return layer
        })
        packets.visible = halos.visible = dots.visible = true
        element.parentElement?.classList.add('has-3d')
      },
      undefined,
      (error) => console.warn('[SystemMap] モデルを読み込めませんでした', error),
    )

    const matrix = new Matrix4()
    const a = new Vector3()
    const b = new Vector3()
    const point = new Vector3()
    const nodePoint = (layer: number, node: number, out: Vector3) =>
      out.copy(layers[layer].nodes[node]).add(layers[layer].group.position)

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
        if (layers.length === 0) return
        const ease = 1 - Math.pow(0.002, delta)
        pointer.x += (pointer.tx - pointer.x) * ease
        pointer.y += (pointer.ty - pointer.y) * ease

        // スクロールでレイヤーが分解していく
        const explode = still ? 1 : MathUtils.smoothstep(visibility, -0.85, -0.15)
        const gap = MathUtils.lerp(0.16, 1.1, explode)
        const ys = [gap, 0, -gap]

        rig.rotation.y = (still ? 0 : visibility * 0.4 + Math.sin(elapsed * 0.25) * 0.06) + pointer.x * 0.35
        rig.rotation.x = pointer.y * 0.12

        // ホバーが無いときは L1 → L2 → L3 → 全体 の順に自動で点灯
        let spotlight: number | null = highlighted
        if (spotlight === null && !still) {
          const phase = elapsed % 8
          spotlight = phase < 6 ? Math.floor(phase / 2) : null
        }

        layers.forEach((layer, index) => {
          layer.group.position.y = ys[index]
          const target =
            highlighted !== null
              ? highlighted === index
                ? 1.35
                : 0.25
              : spotlight === null
                ? 1
                : spotlight === index
                  ? 1.3
                  : 0.6
          layer.emphasis += (target - layer.emphasis) * ease
          const e = layer.emphasis
          const base = Math.min(1, e)
          layer.edge.opacity = Math.min(1, 0.3 + e * 0.6)
          layer.accent.opacity = Math.min(1, 0.25 + e * 0.7)
          layer.grid.opacity = 0.25 + base * 0.75
          layer.text.opacity = Math.min(1, 0.2 + e * 0.8)
          layer.glass.opacity = 0.08 + base * 0.1
          layer.node.opacity = 0.3 + base * 0.35
          layer.nodeLine.opacity = Math.min(1, 0.25 + e * 0.6)
          layer.node.emissiveIntensity =
            0.05 + Math.max(0, e - 1) * 1.5 + (still ? 0 : Math.sin(elapsed * 2 + index) * 0.02)
          // 選ばれた層は少し浮き上がる
          layer.group.position.y += Math.max(0, e - 1) * 0.35
        })

        // パケット：層をまたいでノード間を行き来する
        ROUTES.forEach((route, r) => {
          for (let p = 0; p < PACKETS_PER_ROUTE; p += 1) {
            const i = r * PACKETS_PER_ROUTE + p
            // 偶数パケットは下り（リクエスト）、奇数は上り（レスポンス）
            let u = (elapsed * (0.22 + (r % 3) * 0.04) + r * 0.21 + p / PACKETS_PER_ROUTE) % 1
            if (p % 2 === 1) u = 1 - u
            const segment = u < 0.5 ? 0 : 1
            const local = (u - segment * 0.5) * 2
            nodePoint(segment, route[segment], a)
            nodePoint(segment + 1, route[segment + 1], b)
            point.lerpVectors(a, b, MathUtils.smootherstep(local, 0, 1))
            // まっすぐではなく、少し弧を描く
            const bow = Math.sin(local * Math.PI) * 0.14
            point.x += bow * (r % 2 === 0 ? 1 : -1)
            point.z += bow * 0.5
            const pulse = 0.7 + Math.sin(local * Math.PI) * 0.7
            matrix.makeScale(pulse, pulse, pulse).setPosition(point)
            packets.setMatrixAt(i, matrix)
            haloPositions.set([point.x, point.y, point.z], i * 3)
          }
        })
        packets.instanceMatrix.needsUpdate = true
        haloGeometry.attributes.position.needsUpdate = true
        const showPackets = explode > 0.4
        packets.visible = halos.visible = showPackets

        // 漂う粒：分解した層の間の空間をゆっくり漂い、明滅する
        const top = ys[0] + 0.35
        const bottom = ys[2] - 0.05
        dotSeeds.forEach((seed, i) => {
          const t = still ? seed.t : (seed.t + elapsed * seed.speed * 0.04) % 1
          dotPositions[i * 3] = seed.x + Math.sin(elapsed * seed.speed + seed.phase) * 0.12
          dotPositions[i * 3 + 1] = MathUtils.lerp(bottom, top, t)
          dotPositions[i * 3 + 2] = seed.z + Math.cos(elapsed * seed.speed * 0.8 + seed.phase) * 0.1
          const flicker = still ? 0.6 : Math.max(0, Math.sin(elapsed * seed.twinkle + seed.phase)) ** 2
          // 端に近い位置（上下）ではフェード
          const fade = Math.sin(t * Math.PI)
          const level = seed.level * flicker * fade * explode
          dotColors[i * 3] = 1 * level
          dotColors[i * 3 + 1] = 0.85 * level
          dotColors[i * 3 + 2] = 0.3 * level
        })
        dotGeometry.attributes.position.needsUpdate = true
        dotGeometry.attributes.color.needsUpdate = true
      },
    })

    return () => {
      disposed = true
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
