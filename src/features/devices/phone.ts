import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Shape,
  ShapeGeometry,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Screen } from './screens'

export type PhoneKind = 'iphone' | 'android'

// 単位はおおよそ「1 = 10cm」。iPhone 15 Pro 程度の比率
const SIZE = {
  iphone: { w: 0.72, h: 1.47, d: 0.082, r: 0.11, screenInset: 0.028, screenR: 0.09 },
  android: { w: 0.72, h: 1.52, d: 0.086, r: 0.06, screenInset: 0.024, screenR: 0.05 },
}

function roundedRectShape(w: number, h: number, r: number) {
  const shape = new Shape()
  const x = -w / 2
  const y = -h / 2
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}

/** ShapeGeometry の UV を 0〜1 に正規化（画面テクスチャを全面に貼るため） */
function normalizeUv(geometry: ShapeGeometry, w: number, h: number) {
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < pos.count; i += 1) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5)
  uv.needsUpdate = true
}

export type Phone = {
  group: Group
  dispose: () => void
}

export function createPhone(kind: PhoneKind, screen: Screen, envMap: Texture | null): Phone {
  const s = SIZE[kind]
  const group = new Group()
  const geometries: BufferGeometry[] = []
  const materials: Material[] = []
  const track = <G extends BufferGeometry, M extends Material>(g: G, m: M) => {
    geometries.push(g)
    materials.push(m)
    return new Mesh(g, m)
  }

  // 本体（チタン調ブラック）
  const frameMaterial = new MeshPhysicalMaterial({
    color: kind === 'iphone' ? 0x1b1b1d : 0x161816,
    metalness: 0.95,
    roughness: 0.28,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMap,
    envMapIntensity: 1.1,
  })
  const body = track(new RoundedBoxGeometry(s.w, s.h, s.d, 6, s.r), frameMaterial)
  group.add(body)

  // 画面（自己発光扱い：ライティングに左右されず読める）
  const sw = s.w - s.screenInset * 2
  const sh = s.h - s.screenInset * 2
  const screenGeometry = new ShapeGeometry(roundedRectShape(sw, sh, s.screenR), 12)
  normalizeUv(screenGeometry, sw, sh)
  const screenMaterial = new MeshBasicMaterial({ map: screen.texture, toneMapped: false })
  // 画像や動画の読み込みが終わったら差し替える
  screen.onChange((texture) => {
    screenMaterial.map = texture
    screenMaterial.needsUpdate = true
  })
  const screenMesh = track(screenGeometry, screenMaterial)
  screenMesh.position.z = s.d / 2 + 0.0015
  group.add(screenMesh)

  // 前面ガラスの反射
  const glass = track(
    new ShapeGeometry(roundedRectShape(s.w - 0.012, s.h - 0.012, s.r - 0.006), 12),
    new MeshPhysicalMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.18,
      envMap,
      envMapIntensity: 1.6,
      depthWrite: false,
    }),
  )
  glass.position.z = s.d / 2 + 0.003
  group.add(glass)

  const black = new MeshBasicMaterial({ color: 0x000000 })
  materials.push(black)
  if (kind === 'iphone') {
    // Dynamic Island
    const island = new Mesh(new ShapeGeometry(roundedRectShape(0.2, 0.058, 0.029), 8), black)
    geometries.push(island.geometry)
    island.position.set(0, sh / 2 - 0.06, s.d / 2 + 0.0025)
    group.add(island)
  } else {
    // パンチホールカメラ
    const hole = new Mesh(new CylinderGeometry(0.018, 0.018, 0.002, 20), black)
    geometries.push(hole.geometry)
    hole.rotation.x = Math.PI / 2
    hole.position.set(0, sh / 2 - 0.045, s.d / 2 + 0.0025)
    group.add(hole)
  }

  // サイドボタン
  const buttonGeometry = new BoxGeometry(0.012, 1, 0.03)
  geometries.push(buttonGeometry)
  const addButton = (x: number, y: number, len: number) => {
    const b = new Mesh(buttonGeometry, frameMaterial)
    b.scale.y = len
    b.position.set(x, y, 0)
    group.add(b)
  }
  addButton(s.w / 2 + 0.003, 0.28, 0.22)
  addButton(-s.w / 2 - 0.003, 0.38, 0.1)
  addButton(-s.w / 2 - 0.003, 0.22, 0.14)

  // 背面のカメラユニット
  const lensMaterial = new MeshPhysicalMaterial({ color: 0x050505, metalness: 0.2, roughness: 0.05, clearcoat: 1, envMap })
  const ringMaterial = new MeshPhysicalMaterial({ color: 0x2a2a2a, metalness: 1, roughness: 0.25, envMap })
  materials.push(lensMaterial, ringMaterial)
  const lensGeometry = new CylinderGeometry(0.058, 0.058, 0.03, 28)
  const ringGeometry = new CylinderGeometry(0.068, 0.068, 0.022, 28)
  geometries.push(lensGeometry, ringGeometry)

  if (kind === 'iphone') {
    const bump = track(new RoundedBoxGeometry(0.34, 0.34, 0.03, 4, 0.07), frameMaterial)
    bump.position.set(s.w / 2 - 0.22, s.h / 2 - 0.22, -s.d / 2 - 0.01)
    group.add(bump)
    const lenses: [number, number][] = [
      [-0.075, 0.075],
      [-0.075, -0.075],
      [0.08, 0],
    ]
    for (const [lx, ly] of lenses) {
      const ring = new Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      ring.position.set(bump.position.x + lx, bump.position.y + ly, -s.d / 2 - 0.03)
      const lens = new Mesh(lensGeometry, lensMaterial)
      lens.rotation.x = Math.PI / 2
      lens.scale.set(0.8, 1, 0.8)
      lens.position.copy(ring.position)
      lens.position.z -= 0.006
      group.add(ring, lens)
    }
  } else {
    const bar = track(new RoundedBoxGeometry(s.w - 0.1, 0.2, 0.03, 4, 0.06), frameMaterial)
    bar.position.set(0, s.h / 2 - 0.2, -s.d / 2 - 0.01)
    group.add(bar)
    for (const lx of [-0.17, 0, 0.17]) {
      const ring = new Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      ring.scale.set(0.75, 1, 0.75)
      ring.position.set(lx, bar.position.y, -s.d / 2 - 0.03)
      const lens = new Mesh(lensGeometry, lensMaterial)
      lens.rotation.x = Math.PI / 2
      lens.scale.set(0.6, 1, 0.6)
      lens.position.copy(ring.position)
      lens.position.z -= 0.006
      group.add(ring, lens)
    }
  }

  return {
    group,
    dispose: () => {
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      screen.dispose()
    },
  }
}
