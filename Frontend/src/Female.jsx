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

export const Model = forwardRef((props, ref) => {
  const group = useRef()

  const { scene, animations } = useGLTF('/Female.glb')

  // ✅ clone skeleton
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

  // ✅ bind animations correctly
  const { actions, names, mixer } = useAnimations(animations, clone)

  const currentAction = useRef()
  const direction = useRef(new THREE.Vector3())
  const isLocked = useRef(false)

  // ✅ ROBUST ANIMATION MAP (NO HARDCODING)
  const animMap = useMemo(() => {
    const map = {}

    names.forEach((n) => {
      const name = n.toLowerCase()

      if (name.includes('idle')) map.idle = n
      if (name.includes('walk')) map.walk = n
      if (name.includes('run')) map.run = n
      if (name.includes('jumpimg')) map.jump = n
      if (name.includes('gun')) map.gun = n
    })

    console.log("✅ Animation Map:", map)
    return map
  }, [names])

  // ✅ SAFE PLAY FUNCTION WITH LOCK
  const playAnim = (name, loop = true, lock = false) => {
    const next = actions[name]

    if (!next) {
      console.error("❌ Animation not found:", name)
      return
    }

    if (currentAction.current === next) return

    if (currentAction.current) {
      currentAction.current.fadeOut(0.2)
    }

    next.reset()
      .fadeIn(0.2)
      .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
      .play()

    next.clampWhenFinished = !loop

    currentAction.current = next
    isLocked.current = lock

    // ✅ unlock after one-shot animation
    if (!loop) {
      mixer.removeEventListener('finished', onFinish)
      mixer.addEventListener('finished', onFinish)
    }
  }

  const onFinish = () => {
    isLocked.current = false
    playAnim(animMap.idle)
  }

  // ✅ CONTROLS
  useImperativeHandle(ref, () => ({
    move: (dir, isRunning) => {
      direction.current.copy(dir)

      // ❌ don't override jump/gun
      if (isLocked.current) return

      if (dir.length() === 0) {
        playAnim(animMap.idle)
      } else {
        playAnim(isRunning ? animMap.run : animMap.walk)
      }
    },

    jump: () => {
      if (!animMap.jump || isLocked.current) return
      playAnim(animMap.jump, false, true)
    },

    gun: () => {
      if (!animMap.gun || isLocked.current) return
      playAnim(animMap.gun, false, true)
    }
  }))

  // movement
  useFrame(() => {
    if (direction.current.length() > 0) {
      const speed = 0.05

      group.current.position.x += direction.current.x * speed
      group.current.position.z += direction.current.z * speed

      const angle = Math.atan2(direction.current.x, direction.current.z)
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        angle,
        0.1
      )
    }
  })

  // initial animation
  useEffect(() => {
    if (names.length > 0 && animMap.idle) {
      playAnim(animMap.idle)
    }
  }, [names, animMap])

  return (
    <group ref={group} {...props}>
      <primitive object={clone} />
    </group>
  )
})

useGLTF.preload('/Female.glb')