import { CanvasTexture, SRGBColorSpace, TextureLoader, VideoTexture, type Texture } from 'three'

/**
 * 端末の画面に貼るテクスチャ。
 * 実際のスクリーンショットがあれば content.ts の `image` に指定してください（推奨：1179×2556 などの縦長 PNG/JPG）。
 * 指定がない場合はここで描いたモック UI を表示します。
 */

export type MockScreen = 'begit-home' | 'begit-stats' | 'quoline' | 'swift' | 'kotlin'

const W = 590
const H = 1280
const YELLOW = '#fcee0a'
const SANS = '600 32px Inter, -apple-system, "Hiragino Sans", sans-serif'
const MONO = '500 22px "IBM Plex Mono", ui-monospace, monospace'

type Ctx = CanvasRenderingContext2D

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function statusBar(ctx: Ctx, color: string) {
  ctx.fillStyle = color
  ctx.font = '600 26px Inter, -apple-system, sans-serif'
  ctx.fillText('9:41', 58, 66)
  // 電波・バッテリー
  for (let i = 0; i < 4; i += 1) ctx.fillRect(430 + i * 10, 60 - i * 5, 6, 8 + i * 5)
  roundRect(ctx, 480, 46, 50, 22, 6)
  ctx.lineWidth = 2
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.fillRect(484, 50, 36, 14)
}

function homeIndicator(ctx: Ctx, color: string) {
  ctx.fillStyle = color
  roundRect(ctx, W / 2 - 80, H - 26, 160, 8, 4)
  ctx.fill()
}

function drawBegitHome(ctx: Ctx) {
  ctx.fillStyle = '#0b0b0b'
  ctx.fillRect(0, 0, W, H)
  statusBar(ctx, '#f5f5f5')

  ctx.fillStyle = '#f5f5f5'
  ctx.font = '900 76px Inter, -apple-system, sans-serif'
  ctx.fillText('BeGit', 44, 190)
  ctx.fillStyle = YELLOW
  ctx.fillText(';', 44 + ctx.measureText('BeGit').width, 190)
  ctx.fillStyle = '#858585'
  ctx.font = MONO
  ctx.fillText("TODAY'S COMMIT", 46, 232)

  // ストリークカード
  ctx.fillStyle = YELLOW
  roundRect(ctx, 40, 270, W - 80, 230, 28)
  ctx.fill()
  ctx.fillStyle = '#0b0b0b'
  ctx.font = '900 120px Inter, -apple-system, sans-serif'
  ctx.fillText('128', 72, 420)
  ctx.font = '700 28px Inter, -apple-system, sans-serif'
  ctx.fillText('DAY STREAK', 76, 466)
  ctx.font = MONO
  ctx.fillText('+3 today', 380, 320)

  // コントリビューショングラフ
  ctx.fillStyle = '#f5f5f5'
  ctx.font = '700 28px Inter, -apple-system, sans-serif'
  ctx.fillText('Contributions', 44, 572)
  const cols = 15
  const rows = 7
  const size = 28
  const gap = 6
  let s = 3
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const v = rnd()
      ctx.fillStyle = v > 0.82 ? YELLOW : v > 0.6 ? '#9a9106' : v > 0.35 ? '#4a4604' : '#1c1c1c'
      roundRect(ctx, 44 + c * (size + gap), 600 + r * (size + gap), size, size, 6)
      ctx.fill()
    }
  }

  // コミット一覧
  const commits = [
    ['feat: share card UI', 'begit-ios', '2m'],
    ['fix: webhook retry', 'begit-api', '1h'],
    ['chore: deploy worker', 'infra', '3h'],
  ]
  commits.forEach(([msg, repo, time], i) => {
    const y = 880 + i * 110
    ctx.fillStyle = '#161616'
    roundRect(ctx, 40, y, W - 80, 92, 20)
    ctx.fill()
    ctx.fillStyle = YELLOW
    ctx.beginPath()
    ctx.arc(84, y + 46, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f5f5f5'
    ctx.font = '600 26px Inter, -apple-system, sans-serif'
    ctx.fillText(msg, 114, y + 42)
    ctx.fillStyle = '#858585'
    ctx.font = '500 20px "IBM Plex Mono", monospace'
    ctx.fillText(repo, 114, y + 72)
    ctx.fillText(time, W - 100, y + 42)
  })
  homeIndicator(ctx, '#f5f5f5')
}

function drawBegitStats(ctx: Ctx) {
  ctx.fillStyle = '#0b0b0b'
  ctx.fillRect(0, 0, W, H)
  statusBar(ctx, '#f5f5f5')
  ctx.fillStyle = '#f5f5f5'
  ctx.font = '800 56px Inter, -apple-system, sans-serif'
  ctx.fillText('Weekly', 44, 180)
  ctx.fillStyle = '#858585'
  ctx.font = MONO
  ctx.fillText('NOV 04 — NOV 10', 46, 220)

  const values = [0.4, 0.75, 0.55, 0.95, 0.6, 0.3, 0.85]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  values.forEach((v, i) => {
    const x = 56 + i * 70
    const h = v * 300
    ctx.fillStyle = i === 3 ? YELLOW : '#2a2a2a'
    roundRect(ctx, x, 580 - h, 44, h, 12)
    ctx.fill()
    ctx.fillStyle = '#858585'
    ctx.font = '600 22px Inter, sans-serif'
    ctx.fillText(days[i], x + 14, 620)
  })

  ctx.fillStyle = '#f5f5f5'
  ctx.font = '700 28px Inter, -apple-system, sans-serif'
  ctx.fillText('Friends', 44, 712)
  const friends = [
    ['@neko', '42 commits'],
    ['@kuro', '37 commits'],
    ['@mike', '21 commits'],
    ['@tora', '18 commits'],
  ]
  friends.forEach(([name, count], i) => {
    const y = 750 + i * 104
    ctx.fillStyle = i === 0 ? YELLOW : '#3a3a3a'
    ctx.beginPath()
    ctx.arc(84, y + 40, 32, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f5f5f5'
    ctx.font = '600 28px Inter, sans-serif'
    ctx.fillText(name, 136, y + 50)
    ctx.fillStyle = '#858585'
    ctx.font = '500 22px "IBM Plex Mono", monospace'
    ctx.fillText(count, W - 210, y + 50)
  })
  homeIndicator(ctx, '#f5f5f5')
}

function drawQuoline(ctx: Ctx) {
  ctx.fillStyle = '#f1eee6'
  ctx.fillRect(0, 0, W, H)
  statusBar(ctx, '#111')
  ctx.fillStyle = '#111'
  ctx.font = '900 64px Inter, -apple-system, sans-serif'
  ctx.fillText('Quoline', 44, 180)
  ctx.fillStyle = '#7b776b'
  ctx.font = MONO
  ctx.fillText('YOUR LINE OF QUOTES', 46, 222)

  // メインの引用カード
  ctx.fillStyle = '#111'
  roundRect(ctx, 40, 270, W - 80, 470, 30)
  ctx.fill()
  ctx.fillStyle = YELLOW
  ctx.font = '900 150px Georgia, serif'
  ctx.fillText('“', 70, 420)
  ctx.fillStyle = '#f5f5f5'
  ctx.font = '700 40px "Hiragino Mincho ProN", Georgia, serif'
  ;['自由とは、', '選ぶ制約を', '自分で決めること。'].forEach((line, i) => ctx.fillText(line, 76, 480 + i * 62))
  ctx.fillStyle = '#9a9a9a'
  ctx.font = '500 22px "IBM Plex Mono", monospace'
  ctx.fillText('— saved 2026.11.10', 76, 700)

  // タイムライン
  for (let i = 0; i < 3; i += 1) {
    const y = 790 + i * 140
    ctx.fillStyle = '#fff'
    roundRect(ctx, 40, y, W - 80, 118, 24)
    ctx.fill()
    ctx.fillStyle = '#111'
    ctx.fillRect(70, y + 34, 300 - i * 50, 14)
    ctx.fillStyle = '#c9c5b8'
    ctx.fillRect(70, y + 66, 380 - i * 30, 12)
    ctx.fillStyle = i === 0 ? YELLOW : '#e5e1d6'
    ctx.beginPath()
    ctx.arc(W - 90, y + 58, 22, 0, Math.PI * 2)
    ctx.fill()
  }
  homeIndicator(ctx, '#111')
}

function drawCode(ctx: Ctx, lang: 'swift' | 'kotlin') {
  const isSwift = lang === 'swift'
  ctx.fillStyle = isSwift ? '#0d0d0d' : '#101210'
  ctx.fillRect(0, 0, W, H)
  statusBar(ctx, '#f5f5f5')
  ctx.fillStyle = YELLOW
  ctx.font = MONO
  ctx.fillText(isSwift ? 'iOS / SWIFTUI' : 'ANDROID / KOTLIN', 46, 150)
  ctx.fillStyle = '#f5f5f5'
  ctx.font = '800 54px Inter, -apple-system, sans-serif'
  ctx.fillText(isSwift ? 'Feed.swift' : 'Feed.kt', 44, 220)

  const code = isSwift
    ? [
        ['k', 'struct '],
        ['t', 'FeedView'],
        ['p', ': View {'],
        ['n', ''],
        ['k', '  @State var '],
        ['p', 'items'],
        ['n', ''],
        ['k', '  var '],
        ['p', 'body: some View {'],
        ['n', ''],
        ['t', '    List'],
        ['p', '(items) {'],
        ['n', ''],
        ['t', '      Row'],
        ['p', '(item: $0)'],
        ['n', ''],
        ['p', '    }'],
        ['n', ''],
        ['p', '    .task { '],
        ['k', 'await '],
        ['p', 'load() }'],
        ['n', ''],
        ['p', '  }'],
        ['n', ''],
        ['p', '}'],
      ]
    : [
        ['k', '@Composable'],
        ['n', ''],
        ['k', 'fun '],
        ['t', 'FeedScreen'],
        ['p', '(vm: FeedVM) {'],
        ['n', ''],
        ['k', '  val '],
        ['p', 'items by vm.items'],
        ['n', ''],
        ['t', '  LazyColumn'],
        ['p', ' {'],
        ['n', ''],
        ['p', '    items(items) {'],
        ['n', ''],
        ['t', '      Row'],
        ['p', '(it)'],
        ['n', ''],
        ['p', '    }'],
        ['n', ''],
        ['p', '  }'],
        ['n', ''],
        ['p', '}'],
      ]

  ctx.fillStyle = '#161616'
  roundRect(ctx, 32, 270, W - 64, 560, 22)
  ctx.fill()
  let x = 60
  let y = 330
  ctx.font = '500 24px "IBM Plex Mono", ui-monospace, monospace'
  for (const [kind, text] of code) {
    if (kind === 'n') {
      x = 60
      y += 40
      continue
    }
    ctx.fillStyle = kind === 'k' ? YELLOW : kind === 't' ? '#f5f5f5' : '#9a9a9a'
    ctx.fillText(text, x, y)
    x += ctx.measureText(text).width
  }

  // ビルド結果
  ctx.fillStyle = '#161616'
  roundRect(ctx, 32, 860, W - 64, 300, 22)
  ctx.fill()
  const rows = isSwift
    ? ['✓ Build succeeded', '✓ 128 tests passed', '→ TestFlight uploaded']
    : ['✓ assembleRelease', '✓ 96 tests passed', '→ Play Console: internal']
  rows.forEach((row, i) => {
    ctx.fillStyle = i === 2 ? YELLOW : '#cfcfcf'
    ctx.font = '500 24px "IBM Plex Mono", monospace'
    ctx.fillText(row, 64, 930 + i * 70)
  })
  homeIndicator(ctx, '#f5f5f5')
}

function drawMock(kind: MockScreen): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'alphabetic'
  ctx.font = SANS
  switch (kind) {
    case 'begit-home':
      drawBegitHome(ctx)
      break
    case 'begit-stats':
      drawBegitStats(ctx)
      break
    case 'quoline':
      drawQuoline(ctx)
      break
    case 'swift':
      drawCode(ctx, 'swift')
      break
    case 'kotlin':
      drawCode(ctx, 'kotlin')
      break
  }
  return canvas
}

/** 端末の画面。画像・動画が読み込めたらテクスチャを差し替える */
export type Screen = {
  texture: Texture
  video: HTMLVideoElement | null
  /** テクスチャが差し替わった時に呼ばれる */
  onChange: (listener: (texture: Texture) => void) => void
  dispose: () => void
}

/**
 * 優先順位：動画 > 画像 > モック。
 * 読み込み中はモック（または画像）を表示し、準備ができ次第差し替えます。
 */
export function createScreen(mock: MockScreen, image?: string, video?: string): Screen {
  const canvasTexture = new CanvasTexture(drawMock(mock))
  canvasTexture.colorSpace = SRGBColorSpace
  canvasTexture.anisotropy = 4

  let current: Texture = canvasTexture
  let level = 0 // 0: モック / 1: 画像 / 2: 動画
  const owned: Texture[] = [canvasTexture]
  const listeners: ((texture: Texture) => void)[] = []
  const swap = (texture: Texture, nextLevel: number) => {
    if (nextLevel < level) return
    level = nextLevel
    current = texture
    listeners.forEach((listener) => listener(texture))
  }

  // フォントの読み込みが終わったらモックを描き直す
  void document.fonts?.ready.then(() => {
    const ctx = (canvasTexture.image as HTMLCanvasElement).getContext('2d')
    if (!ctx) return
    ctx.drawImage(drawMock(mock), 0, 0)
    canvasTexture.needsUpdate = true
  })

  if (image) {
    new TextureLoader().load(image, (loaded) => {
      loaded.colorSpace = SRGBColorSpace
      loaded.anisotropy = 4
      owned.push(loaded)
      swap(loaded, 1)
    })
  }

  let element: HTMLVideoElement | null = null
  if (video) {
    element = document.createElement('video')
    element.src = video
    element.muted = true
    element.loop = true
    element.playsInline = true
    element.preload = 'auto'
    element.setAttribute('muted', '')
    element.setAttribute('playsinline', '')
    element.addEventListener(
      'loadeddata',
      () => {
        const videoTexture = new VideoTexture(element!)
        videoTexture.colorSpace = SRGBColorSpace
        videoTexture.needsUpdate = true
        owned.push(videoTexture)
        swap(videoTexture, 2)
      },
      { once: true },
    )
    element.load()
  }

  return {
    get texture() {
      return current
    },
    video: element,
    onChange: (listener) => listeners.push(listener),
    dispose: () => {
      owned.forEach((texture) => texture.dispose())
      if (element) {
        element.pause()
        element.removeAttribute('src')
        element.load()
      }
    },
  }
}
