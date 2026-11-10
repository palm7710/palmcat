import { PerspectiveCamera, Scene, WebGLRenderer, Vector4 } from 'three'

/**
 * ページ内の小さな 3D（作品の iPhone、システム構成図など）を
 * 1 枚の固定キャンバス・1 つの WebGL コンテキストでまとめて描画する仕組み。
 *
 * 各ビューは DOM 要素（プレースホルダー）を持ち、毎フレームその要素の位置に
 * scissor で切り抜いて描画します。キャンバスを複数作るより軽く、
 * スクロールにもぴったり追従します。
 */

export type StageView = {
  /** 3D を表示したい位置の DOM 要素 */
  element: HTMLElement
  scene: Scene
  camera: PerspectiveCamera
  /**
   * 毎フレーム呼ばれる。
   * @param elapsed 経過秒
   * @param delta 前フレームからの秒
   * @param visibility 要素がビューポートを通過する進捗（-1: 下から入る直前 / 0: 中央 / 1: 上へ抜けた直後）
   */
  update?: (elapsed: number, delta: number, visibility: number) => void
  /** 要素サイズが変わったとき（アスペクト比の変化） */
  resize?: (width: number, height: number) => void
}

type Registered = StageView & { width: number; height: number }

const views = new Set<Registered>()
let renderer: WebGLRenderer | null = null
let canvas: HTMLCanvasElement | null = null
let frame = 0
let running = false
let lastTime = 0
let elapsed = 0
let failed = false
const viewport = new Vector4()

export const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isCompact = () => window.matchMedia('(max-width: 800px)').matches

function ensureRenderer(): WebGLRenderer | null {
  if (renderer || failed) return renderer
  try {
    canvas = document.createElement('canvas')
    canvas.className = 'view-stage'
    canvas.setAttribute('aria-hidden', 'true')
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  } catch {
    failed = true
    canvas = null
    return null
  }
  renderer.setClearColor(0x000000, 0)
  renderer.setScissorTest(true)
  document.body.appendChild(canvas)
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  document.addEventListener('visibilitychange', handleVisibility)
  return renderer
}

function resizeCanvas() {
  if (!renderer) return
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact() ? 1.5 : 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
}

function handleVisibility() {
  if (document.hidden) stop()
  else start()
}

function render(time: number) {
  if (!running || !renderer || !canvas) return
  const delta = lastTime === 0 ? 1 / 60 : Math.min(0.064, (time - lastTime) / 1000)
  lastTime = time
  elapsed += reduceMotion() ? 0 : delta

  const vw = window.innerWidth
  const vh = window.innerHeight
  // ページのスクロールに合わせてキャンバス全体をクリア
  renderer.setScissor(0, 0, vw, vh)
  renderer.clear()

  for (const view of views) {
    const rect = view.element.getBoundingClientRect()
    // 画面外はスキップ（少し余白を持たせる）
    if (rect.bottom < -50 || rect.top > vh + 50 || rect.width === 0) continue

    if (rect.width !== view.width || rect.height !== view.height) {
      view.width = rect.width
      view.height = rect.height
      view.camera.aspect = rect.width / rect.height
      view.camera.updateProjectionMatrix()
      view.resize?.(rect.width, rect.height)
    }

    const center = rect.top + rect.height / 2
    const visibility = Math.max(-1, Math.min(1, (vh / 2 - center) / (vh / 2 + rect.height / 2)))
    view.update?.(elapsed, delta, visibility)

    // WebGL の座標は左下原点
    const bottom = vh - rect.bottom
    viewport.set(rect.left, bottom, rect.width, rect.height)
    renderer.setViewport(viewport)
    renderer.setScissor(viewport)
    renderer.render(view.scene, view.camera)
  }

  frame = requestAnimationFrame(render)
}

function start() {
  if (running || document.hidden || views.size === 0) return
  running = true
  lastTime = 0
  frame = requestAnimationFrame(render)
}

function stop() {
  running = false
  cancelAnimationFrame(frame)
}

/** ビューを登録。WebGL が使えない場合は null を返す（呼び出し側は CSS のフォールバックを残す） */
export function registerView(view: StageView): (() => void) | null {
  const gl = ensureRenderer()
  if (!gl) return null
  const entry: Registered = Object.assign(view, { width: 0, height: 0 })
  views.add(entry)
  if (canvas) canvas.style.display = ''
  start()
  return () => {
    views.delete(entry)
    if (views.size === 0) {
      // ページ遷移などで全ビューが消えたら、最後のフレームが残らないよう隠す
      stop()
      renderer?.setScissor(0, 0, window.innerWidth, window.innerHeight)
      renderer?.clear()
      if (canvas) canvas.style.display = 'none'
    }
  }
}

/** テクスチャ生成などで renderer が必要なとき */
export function getStageRenderer() {
  return ensureRenderer()
}
