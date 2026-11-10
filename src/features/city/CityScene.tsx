import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Euler,
  FogExp2,
  GridHelper,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * スクロールに合わせてカメラが街へ降りていく背景シーン。
 * PHASE 01〜04 の進行に合わせて、ビルの黄色いラインが段階的に点灯します。
 */

// カメラが通る道（位置）と、その時に見ている点。どちらもスクロール進捗 0→1 で補間します。
const CAMERA_PATH = [
  new Vector3(13, 12, 31), // 0.0 HERO：街を俯瞰
  new Vector3(5, 6.5, 13), // 0.2 ABOUT〜SKILLS：街へ近づく
  new Vector3(0.6, 2.2, 1), // 0.4 WORK：通りへ降りる
  new Vector3(-0.4, 1.2, -12), // 0.6 WORK〜PHILOSOPHY：ビルの谷間を進む
  new Vector3(0, 4, -24), // 0.8 PHILOSOPHY〜LIBRARY：崩れた街の中
  new Vector3(2, 27, 6), // 1.0 CONTACT：再構築された街を見下ろす
]
const LOOK_PATH = [
  new Vector3(0, 3, -8),
  new Vector3(-1, 2.5, -12),
  new Vector3(-0.5, 2.4, -20),
  new Vector3(0.5, 2.5, -34),
  new Vector3(0, 1, -42),
  new Vector3(0, -3, -27),
]
// 各 PHASE に入るスクロール進捗（ライン点灯のタイミング）
// 1: HERO から点灯 / 2: WORK / 3: PHILOSOPHY / 4: LIBRARY
const PHASE_STARTS = [-1, 0.0, 0.42, 0.66, 0.84]
// CORRUPTION（街が崩れる）と RECONSTRUCTION（組み上がる）の区間
const CORRUPTION = { start: 0.56, peak: 0.72, hold: 0.84, end: 0.95 }

const smooth = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
const STREET_HALF_WIDTH = 1.9

export function CityScene() {
  const mount = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mount.current) return

    const host = mount.current
    const compact = window.matchMedia('(max-width: 800px)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new Scene()
    const fogDensity = compact ? 0.034 : 0.028
    const fog = new FogExp2(0x090909, fogDensity)
    scene.fog = fog

    const camera = new PerspectiveCamera(compact ? 55 : 42, host.clientWidth / host.clientHeight, 0.1, 180)

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: !compact, alpha: false, powerPreference: 'high-performance' })
    } catch {
      host.dataset.webgl = 'unavailable'
      return
    }

    const pixelRatio = () => Math.min(window.devicePixelRatio, compact ? 1 : 1.6)
    renderer.setPixelRatio(pixelRatio())
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.setClearColor(0x090909, 1)
    host.appendChild(renderer.domElement)

    // ---------- 街 ----------
    const city = new Group()
    const count = compact ? 44 : 92
    const boxGeometry = new BoxGeometry(1, 1, 1)
    const darkMaterial = new MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.86, metalness: 0.4 })
    const stripMaterial = new MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
    const buildings = new InstancedMesh(boxGeometry, darkMaterial, count)
    const strips = new InstancedMesh(boxGeometry, stripMaterial, count)
    // ラインの周りのにじみ（Bloom の代わりの軽い発光表現）
    const haloMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const halos = new InstancedMesh(boxGeometry, haloMaterial, count)
    const matrix = new Matrix4()
    const position = new Vector3()
    const scale = new Vector3()
    const rotation = new Quaternion()
    const up = new Vector3(0, 1, 0)

    let seed = 17
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)

    // ビルとラインの元の配置。崩壊（CORRUPTION）時のずれ量もここで決めておく
    type Block = { x: number; y: number; z: number; w: number; h: number; d: number; angle: number; drift: number[] }
    type Strip = { block: number; y: number; phase: number }
    const blocks: Block[] = []
    const stripData: Strip[] = []

    for (let index = 0; index < count; index += 1) {
      const w = 0.8 + random() * 2.6
      const h = 2 + random() * 16
      const d = 0.8 + random() * 3.2
      let x = (random() - 0.5) * 34
      const z = -random() * 54 + 2
      const angle = (random() - 0.5) * 0.08

      // カメラが通る「通り」を空けておく
      const minX = STREET_HALF_WIDTH + w / 2
      if (Math.abs(x) < minX) x = Math.sign(x || 1) * (minX + random() * 1.5)

      // 崩壊時：横ずれ・浮き上がり・傾き・回転
      const drift = [
        (random() - 0.5) * 2.4,
        random() * 6 + 1,
        (random() - 0.5) * 2.4,
        (random() - 0.5) * 0.7,
        (random() - 0.5) * 0.7,
        (random() - 0.5) * 1.4,
      ]
      blocks.push({ x, y: h / 2 - 3, z, w, h, d, angle, drift })

      const stripsHere = random() > 0.35 ? (random() > 0.7 ? 2 : 1) : 0
      for (let s = 0; s < stripsHere && stripData.length < count; s += 1) {
        // 一部は最初から点灯、残りは奥にあるほど後の PHASE で点灯
        const phase = random() < 0.35 ? 1 : Math.min(4, Math.max(1, Math.ceil(((2 - z) / 54) * 4)))
        stripData.push({ block: index, y: Math.max(0.2, h * (0.15 + random() * 0.75) - 3) - (h / 2 - 3), phase })
      }
    }
    const stripCount = stripData.length
    strips.count = stripCount
    halos.count = stripCount

    const euler = new Euler()
    const blockMatrix = new Matrix4()
    const local = new Matrix4()
    let laidOut = -1

    /** amount 0 = 整然とした街 / 1 = 完全に崩れた街 */
    const layoutCity = (amount: number, elapsed: number) => {
      const key = Math.round(amount * 400) + (amount > 0 ? Math.floor(elapsed * 30) * 1000 : 0)
      if (key === laidOut) return
      laidOut = key
      blocks.forEach((b, index) => {
        const [dx, dy, dz, tx, tz, ry] = b.drift
        const wobble = amount > 0 ? Math.sin(elapsed * 1.3 + index) * 0.25 * amount : 0
        position.set(b.x + dx * amount, b.y + (dy + wobble) * amount * amount, b.z + dz * amount)
        euler.set(tx * amount, b.angle + ry * amount, tz * amount)
        rotation.setFromEuler(euler)
        scale.set(b.w, b.h, b.d)
        matrix.compose(position, rotation, scale)
        buildings.setMatrixAt(index, matrix)
      })
      stripData.forEach((strip, index) => {
        const b = blocks[strip.block]
        const [dx, dy, dz, tx, tz, ry] = b.drift
        const wobble = amount > 0 ? Math.sin(elapsed * 1.3 + strip.block) * 0.25 * amount : 0
        position.set(b.x + dx * amount, b.y + (dy + wobble) * amount * amount, b.z + dz * amount)
        euler.set(tx * amount, b.angle + ry * amount, tz * amount)
        rotation.setFromEuler(euler)
        blockMatrix.compose(position, rotation, scale.set(1, 1, 1))
        // ビルのローカル座標でラインを置く
        local.compose(position.set(0, strip.y, 0), rotation.identity(), scale.set(b.w * 1.01, 0.03, b.d * 1.01))
        strips.setMatrixAt(index, matrix.multiplyMatrices(blockMatrix, local))
        local.compose(position.set(0, strip.y, 0), rotation.identity(), scale.set(b.w * 1.04, 0.16, b.d * 1.04))
        halos.setMatrixAt(index, matrix.multiplyMatrices(blockMatrix, local))
      })
      buildings.instanceMatrix.needsUpdate = true
      strips.instanceMatrix.needsUpdate = true
      halos.instanceMatrix.needsUpdate = true
    }
    layoutCity(0, 0)

    const off = new Color(0x2a2803)
    const on = new Color(0xfcee0a)
    const hot = new Color(0xffffff)
    const tmpColor = new Color()
    for (let i = 0; i < stripCount; i += 1) {
      strips.setColorAt(i, off)
      halos.setColorAt(i, off)
    }

    city.add(buildings, strips, halos)

    const floor = new GridHelper(110, 55, 0x3a3805, 0x161616)
    floor.position.y = -3
    city.add(floor)

    // 空中に漂う光の粒子（データの粒）
    const dustCount = compact ? 160 : 520
    const dustPositions = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i += 1) {
      dustPositions[i * 3] = (random() - 0.5) * 40
      dustPositions[i * 3 + 1] = random() * 22 - 3
      dustPositions[i * 3 + 2] = -random() * 60 + 12
    }
    const dustGeometry = new BufferGeometry()
    dustGeometry.setAttribute('position', new BufferAttribute(dustPositions, 3))
    const dustMaterial = new PointsMaterial({
      color: 0xfcee0a,
      size: compact ? 0.06 : 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    const dust = new Points(dustGeometry, dustMaterial)
    city.add(dust)

    scene.add(city)
    scene.add(new AmbientLight(0xffffff, 0.25))
    const key = new DirectionalLight(0xfcee0a, 2)
    key.position.set(-4, 12, 8)
    scene.add(key)

    // ---------- カメラパス ----------
    const cameraCurve = new CatmullRomCurve3(CAMERA_PATH, false, 'catmullrom', 0.35)
    const lookCurve = new CatmullRomCurve3(LOOK_PATH, false, 'catmullrom', 0.35)
    const lookAt = new Vector3()
    const state = { progress: 0 }
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    let litLevel = -1
    let elapsed = 0

    const updateStrips = (progress: number, corruption: number, elapsed: number) => {
      // 現在の PHASE と、その PHASE 内の進み具合
      let phase = 0
      for (let i = 0; i < PHASE_STARTS.length; i += 1) if (progress >= PHASE_STARTS[i]) phase = i
      // 変化があった時だけ色を書き換える（崩壊中はちらつかせるため毎フレーム）
      const level = corruption > 0.05 ? -2 - Math.floor(elapsed * 20) : Math.round(progress * 200)
      if (level === litLevel) return
      litLevel = level
      for (let i = 0; i < stripCount; i += 1) {
        const p = stripData[i].phase
        if (p < phase) tmpColor.copy(on)
        else if (p === phase) {
          // 点灯直後は白く光ってから黄色に落ち着く
          const start = PHASE_STARTS[p]
          const t = start <= 0 ? 1 : Math.min(1, (progress - start) / 0.06)
          tmpColor.copy(hot).lerp(on, t)
        } else tmpColor.copy(off)
        // 崩壊中はランダムに明滅（グリッチ）
        if (corruption > 0.05 && Math.sin(i * 12.9898 + Math.floor(elapsed * 14) * 78.233) > 1 - corruption * 0.35)
          tmpColor.copy(i % 3 === 0 ? hot : off)
        strips.setColorAt(i, tmpColor)
        halos.setColorAt(i, tmpColor)
      }
      if (strips.instanceColor) strips.instanceColor.needsUpdate = true
      if (halos.instanceColor) halos.instanceColor.needsUpdate = true
    }

    const applyCamera = () => {
      const t = Math.min(0.9999, Math.max(0, state.progress))
      // getPoint は制御点を等間隔（0, 0.2, … 1.0）に割り当てるので、セクションと同期させやすい
      cameraCurve.getPoint(t, camera.position)
      lookCurve.getPoint(t, lookAt)
      // マウスで少しだけ視点が揺れる（立体感）
      camera.position.x += pointer.x * 0.9
      camera.position.y += pointer.y * 0.5
      camera.lookAt(lookAt)
      // CORRUPTION：街が崩れ、カメラも傾く → RECONSTRUCTION：元に戻る
      const corruption =
        smooth(CORRUPTION.start, CORRUPTION.peak, t) * (1 - smooth(CORRUPTION.hold, CORRUPTION.end, t))
      camera.rotateZ(corruption * 0.14 * Math.sin(t * 40))
      // 再構築：霧が晴れて街の全景が見える
      fog.density = fogDensity * (1 - smooth(0.88, 1, t) * 0.55)
      layoutCity(corruption, elapsed)
      updateStrips(t, corruption, elapsed)
    }

    const renderFrame = () => {
      applyCamera()
      renderer.render(scene, camera)
    }

    let frame = 0
    let running = false
    let previousFrame = 0
    const frameInterval = 1000 / (compact ? 30 : 60)

    const draw = (time = 0) => {
      if (!running) return
      if (time - previousFrame >= frameInterval) {
        const delta = previousFrame === 0 ? 16 : Math.min(64, time - previousFrame)
        elapsed += delta / 1000
        pointer.x += (pointer.tx - pointer.x) * 0.05
        pointer.y += (pointer.ty - pointer.y) * 0.05
        dust.rotation.y = elapsed * 0.01
        dust.position.y = Math.sin(elapsed * 0.3) * 0.3
        renderFrame()
        previousFrame = time
      }
      frame = requestAnimationFrame(draw)
    }
    const start = () => {
      if (reduceMotion || running || document.hidden) return
      running = true
      previousFrame = 0
      draw()
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }
    const handleVisibility = () => (document.hidden ? stop() : start())
    const handlePointer = (event: PointerEvent) => {
      pointer.tx = event.clientX / window.innerWidth - 0.5
      pointer.ty = -(event.clientY / window.innerHeight - 0.5)
    }

    const trigger = ScrollTrigger.create({
      trigger: '#experience',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        // reduce-motion 時はスクロールに追従するだけ（慣性なし）
        if (reduceMotion) {
          state.progress = self.progress
          renderFrame()
        } else gsap.to(state, { progress: self.progress, duration: 1.2, ease: 'power3.out', overwrite: true })
      },
    })

    if (reduceMotion) renderFrame()
    else start()

    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(pixelRatio())
      renderer.setSize(width, height)
      renderFrame()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    document.addEventListener('visibilitychange', handleVisibility)
    if (!compact) window.addEventListener('pointermove', handlePointer, { passive: true })

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pointermove', handlePointer)
      resizeObserver.disconnect()
      trigger.kill()
      gsap.killTweensOf(state)
      boxGeometry.dispose()
      darkMaterial.dispose()
      stripMaterial.dispose()
      haloMaterial.dispose()
      dustGeometry.dispose()
      dustMaterial.dispose()
      floor.geometry.dispose()
      if (Array.isArray(floor.material)) floor.material.forEach((material) => material.dispose())
      else floor.material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={mount} className="city" aria-hidden="true" />
}
