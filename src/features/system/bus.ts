/**
 * スキル一覧（DOM）とシステム構成図（3D）をつなぐ小さなイベントバス。
 * three.js を読み込まずに HomePage から使えるよう、別ファイルにしています。
 */
type Listener = (layer: number | null) => void

const listeners = new Set<Listener>()

export function highlightLayer(layer: number | null) {
  listeners.forEach((listener) => listener(layer))
}

export function onHighlightLayer(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
