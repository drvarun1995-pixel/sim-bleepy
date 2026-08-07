'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const COLORS = [0x22d3ee, 0xa78bfa, 0x34d399]

export function BleepyThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 42

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const nodes: THREE.Mesh[] = []
    const nodeBasePositions: THREE.Vector3[] = []
    const nodePhases: number[] = []
    const nodeCount = 55
    const nodeGeometry = new THREE.SphereGeometry(0.22, 12, 12)

    for (let i = 0; i < nodeCount; i++) {
      const radius = 14 + Math.random() * 14
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const material = new THREE.MeshBasicMaterial({
        color: COLORS[i % COLORS.length],
        transparent: true,
        opacity: 0.75 + Math.random() * 0.2,
      })
      const node = new THREE.Mesh(nodeGeometry, material)
      node.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
      node.scale.setScalar(0.7 + Math.random() * 1.4)
      nodeBasePositions.push(node.position.clone())
      nodePhases.push(Math.random() * Math.PI * 2)
      group.add(node)
      nodes.push(node)
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.25,
    })
    const maxDistance = 7.5
    const lineGeometries: THREE.BufferGeometry[] = []
    const lines: THREE.Line[] = []

    const glowGeometry = new THREE.SphereGeometry(2.5, 16, 16)
    const glowMeshes: THREE.Mesh[] = []
    const glowBasePositions: THREE.Vector3[] = []
    const glowPhases: number[] = []
    for (let i = 0; i < 5; i++) {
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: COLORS[i % COLORS.length],
        transparent: true,
        opacity: 0.08,
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      glow.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      )
      glow.scale.setScalar(0.85 + Math.random() * 0.5)
      glowBasePositions.push(glow.position.clone())
      glowPhases.push(Math.random() * Math.PI * 2)
      group.add(glow)
      glowMeshes.push(glow)
    }

    let targetRotationX = 0
    let targetRotationY = 0
    let frameId = 0
    let time = 0
    let lineUpdateCounter = 0

    const updateLines = () => {
      lines.forEach((line) => {
        group.remove(line)
        line.geometry.dispose()
      })
      lines.length = 0
      lineGeometries.length = 0

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dist = nodes[i].position.distanceTo(nodes[j].position)
          if (dist < maxDistance) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
              nodes[i].position,
              nodes[j].position,
            ])
            const line = new THREE.Line(geometry, lineMaterial)
            group.add(line)
            lines.push(line)
            lineGeometries.push(geometry)
          }
        }
      }
    }

    updateLines()

    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2
      const y = (event.clientY / window.innerHeight - 0.5) * 2
      targetRotationY = x * 0.25
      targetRotationX = y * 0.18
    }

    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      time += 0.006

      const idleRotationY = Math.sin(time * 0.25) * 0.22
      const idleRotationX = Math.cos(time * 0.2) * 0.12

      group.rotation.y += 0.0025
      group.rotation.y += (targetRotationY + idleRotationY - group.rotation.y) * 0.03
      group.rotation.x += (targetRotationX + idleRotationX - group.rotation.x) * 0.03

      nodes.forEach((node, index) => {
        const base = nodeBasePositions[index]
        const phase = nodePhases[index]
        node.position.x = base.x + Math.sin(time * 0.28 + phase) * 0.9
        node.position.y = base.y + Math.cos(time * 0.24 + phase * 1.1) * 0.75
        node.position.z = base.z + Math.sin(time * 0.22 + phase * 0.9) * 0.6
      })

      glowMeshes.forEach((glow, index) => {
        const base = glowBasePositions[index]
        const phase = glowPhases[index]
        const material = glow.material as THREE.MeshBasicMaterial
        material.opacity = 0.06 + Math.abs(Math.sin(time * 0.4 + phase)) * 0.12
        glow.position.x = base.x + Math.sin(time * 0.14 + phase) * 4
        glow.position.y = base.y + Math.cos(time * 0.12 + phase * 1.2) * 3.5
        glow.position.z = base.z + Math.sin(time * 0.13 + phase * 0.8) * 2.5
        glow.scale.setScalar(
          (0.85 + index * 0.08) + Math.sin(time * 0.35 + phase) * 0.12
        )
      })

      if (++lineUpdateCounter % 3 === 0) {
        updateLines()
      }

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      nodeGeometry.dispose()
      glowGeometry.dispose()
      lineGeometries.forEach((g) => g.dispose())
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 opacity-70"
      aria-hidden
    />
  )
}
