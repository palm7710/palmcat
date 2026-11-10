import { PMREMGenerator, type Texture } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { getStageRenderer } from './viewStage'

let envMap: Texture | null = null

/** 金属の映り込み用の環境マップ（全ビューで共有、1 回だけ生成） */
export function getEnvironment(): Texture | null {
  if (envMap) return envMap
  const renderer = getStageRenderer()
  if (!renderer) return null
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  envMap = pmrem.fromScene(room, 0.04).texture
  room.dispose()
  pmrem.dispose()
  // PMREM が scissor 設定を変えるので戻す
  renderer.setScissorTest(true)
  return envMap
}
