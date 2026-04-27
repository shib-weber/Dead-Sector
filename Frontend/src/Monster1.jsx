import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo
} from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

export const Monster = forwardRef(({ playerRef, setGameOver, active, ...props }, ref) => {
  const group = useRef()

  const { scene, animations } = useGLTF('/Monster1.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

  const { actions, names, mixer } = useAnimations(animations, clone)

  const currentAction = useRef()

  // -------- FIND RUN ANIMATION --------
  const animMap = useMemo(() => {
    const map = {}
    names.forEach((n) => {
      const name = n.toLowerCase()
      if (name.includes('run')) map.run = n
      if (name.includes('walk') && !map.run) map.run = n // fallback
      if (name.includes('idle')) map.idle = n
    })
    return map
  }, [names])

  // -------- PLAY ANIMATION --------
  const playAnim = (name, loop = true) => {
    const next = actions[name]
    if (!next) return

    if (currentAction.current === next) return

    currentAction.current?.fadeOut(0.2)

    next.reset()
      .fadeIn(0.2)
      .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
      .play()

    currentAction.current = next
  }

  // -------- FORCE RUN ANIMATION WHEN ACTIVE --------
  useEffect(() => {
    if (!actions || !names.length) return
    if (!active) return

    const runAnimName =
      names.find(n => n.toLowerCase().includes('run')) ||
      names.find(n => n.toLowerCase().includes('walk')) ||
      names[0] // fallback

    if (runAnimName && actions[runAnimName]) {
      const runAction = actions[runAnimName]
      runAction.reset()
      runAction.fadeIn(0.2)
      runAction.setLoop(THREE.LoopRepeat)
      runAction.play()

      currentAction.current = runAction
    }
  }, [actions, names, active])

  // -------- EXPOSE --------
  useImperativeHandle(ref, () => ({
    getPosition: () => {
      return group.current.getWorldPosition(new THREE.Vector3())
    }
  }))

  // -------- AI MOVEMENT --------
  useFrame((_, delta) => {
    if (!group.current || !playerRef.current || !active) return

    const playerPos = playerRef.current.getPosition()
    const monsterPos = group.current.position.clone() // ✅ IMPORTANT FIX

    // Direction to player
    const dir = new THREE.Vector3()
      .subVectors(playerPos, monsterPos)
      .normalize()

    // Move toward player
    const speed = 10 // 🔥 increased for visible movement
    group.current.position.add(dir.multiplyScalar(speed * delta))

    // Rotate toward player
    const angle = Math.atan2(dir.x, dir.z)
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      angle,
      0.2
    )

    // -------- GAME OVER CHECK --------
    const distance = monsterPos.distanceTo(playerPos)

    if (distance < 2.5) {
      setGameOver(true)
    }
  })

  return (
    <group ref={group} {...props}>
      <primitive object={clone} />
    </group>
  )
})