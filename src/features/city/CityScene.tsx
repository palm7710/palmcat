import { useEffect, useRef } from 'react'
import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  FogExp2,
  GridHelper,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function CityScene() {
  const mount = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const compactViewport = window.matchMedia('(max-width: 800px)')
    if (!mount.current || compactViewport.matches) return

    const host = mount.current
    const scene = new Scene()
    scene.fog = new FogExp2(0x090909, 0.026)

    const camera = new PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 180)
    camera.position.set(11, 10, 25)
    camera.lookAt(0, 3, -8)

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      host.dataset.webgl = 'unavailable'
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.setClearColor(0x090909, 0)
    host.appendChild(renderer.domElement)

    const city = new Group()
    const buildingGeometry = new BoxGeometry(1, 1, 1)
    const stripGeometry = new BoxGeometry(1, 1, 1)
    const darkMaterial = new MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.86, metalness: 0.4 })
    const yellowMaterial = new MeshBasicMaterial({ color: 0xfcee0a })
    const buildings = new InstancedMesh(buildingGeometry, darkMaterial, 46)
    const strips = new InstancedMesh(stripGeometry, yellowMaterial, 23)
    const matrix = new Matrix4()
    const position = new Vector3()
    const scale = new Vector3()
    const rotation = new Quaternion()
    const rotationAxis = new Vector3(0, 1, 0)

    let seed = 17
    let stripIndex = 0
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)

    for (let index = 0; index < 46; index += 1) {
      const width = 0.8 + random() * 2.8
      const height = 2 + random() * 16
      const depth = 0.8 + random() * 3.2
      const x = (random() - 0.5) * 32
      const z = -random() * 46 + 6
      const angle = (random() - 0.5) * 0.08

      position.set(x, height / 2 - 3, z)
      rotation.setFromAxisAngle(rotationAxis, angle)
      scale.set(width, height, depth)
      matrix.compose(position, rotation, scale)
      buildings.setMatrixAt(index, matrix)

      if (index % 2 === 0) {
        position.set(x, Math.max(0.2, height * (0.15 + random() * 0.55) - 3), z)
        scale.set(width * 1.01, 0.025, depth * 1.01)
        matrix.compose(position, rotation, scale)
        strips.setMatrixAt(stripIndex, matrix)
        stripIndex += 1
      }
    }

    buildings.instanceMatrix.needsUpdate = true
    strips.instanceMatrix.needsUpdate = true
    city.add(buildings, strips)

    const floor = new GridHelper(90, 45, 0x3a3805, 0x161616)
    floor.position.y = -3
    city.add(floor)
    scene.add(city)
    scene.add(new AmbientLight(0xffffff, 0.25))

    const key = new DirectionalLight(0xfcee0a, 2)
    key.position.set(-4, 12, 8)
    scene.add(key)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let running = false
    let previousFrame = 0
    const frameInterval = 1000 / 30

    const renderFrame = () => renderer.render(scene, camera)
    const draw = (time = 0) => {
      if (!running) return
      if (time - previousFrame >= frameInterval) {
        const elapsedFrames = previousFrame === 0 ? 1 : (time - previousFrame) / (1000 / 60)
        city.rotation.y += 0.00035 * elapsedFrames
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
    const handleViewport = () => (compactViewport.matches ? stop() : start())

    if (reduceMotion) renderFrame()
    else start()

    const timeline = reduceMotion
      ? null
      : gsap.timeline({
          scrollTrigger: { trigger: '#experience', start: 'top top', end: 'bottom bottom', scrub: 1.4 },
        })

    timeline
      ?.to(city.rotation, { z: 0.025, x: -0.04, duration: 1 })
      .to(city.rotation, { z: -0.11, y: 0.18, x: 0.08, duration: 1 })
      .to(city.position, { y: -2.5, z: 5, duration: 1 })
      .to(city.rotation, { z: 0.03, y: -0.12, x: -0.03, duration: 1 })

    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
      renderer.setSize(width, height)
      renderFrame()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    document.addEventListener('visibilitychange', handleVisibility)
    compactViewport.addEventListener('change', handleViewport)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
      compactViewport.removeEventListener('change', handleViewport)
      resizeObserver.disconnect()
      timeline?.scrollTrigger?.kill()
      timeline?.kill()
      buildingGeometry.dispose()
      stripGeometry.dispose()
      darkMaterial.dispose()
      yellowMaterial.dispose()
      floor.geometry.dispose()
      if (Array.isArray(floor.material)) floor.material.forEach((material) => material.dispose())
      else floor.material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={mount} className="city" aria-hidden="true" />
}
