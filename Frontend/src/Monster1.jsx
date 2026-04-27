import React, {
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

export const Monster = forwardRef(
  ({ playerRef, setGameOver, active, ...props }, ref) => {
    const group = useRef()

    const { scene, animations } = useGLTF('/Monster1.glb')
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { actions } = useAnimations(animations, group)

    const health = useRef(100)

    // ---------------- EXPOSE ----------------
    useImperativeHandle(ref, () => ({
      takeDamage: (dmg) => {
        health.current -= dmg
        return health.current <= 0
      },

      getPosition: () => {
        return group.current
          ? group.current.getWorldPosition(new THREE.Vector3())
          : new THREE.Vector3()
      }
    }))

    // ---------------- RESET HEALTH ----------------
    useEffect(() => {
      if (active) {
        health.current = 100
      }
    }, [active])

    // ---------------- ANIMATION ----------------
    useEffect(() => {
      if (active && actions && Object.keys(actions).length > 0) {
        const anim = actions[Object.keys(actions)[0]]
        anim?.reset().fadeIn(0.5).play()
      }
    }, [active, actions])

    // ---------------- AI ----------------
    useFrame((_, delta) => {
      // ✅ SAFETY CHECKS (VERY IMPORTANT)
      if (!active || !group.current || !playerRef.current) return

      const mPos = group.current.position

      // ✅ CORRECT WAY (uses your Female.jsx API)
      const pPos = playerRef.current.getPosition()

      if (!pPos) return

      const dir = new THREE.Vector3().subVectors(pPos, mPos)
      dir.y = 0

      const dist = dir.length()

      // 💀 GAME OVER
      if (dist < 1.5) {
        setGameOver(true)
        return
      }

      // 🏃 CHASE PLAYER
      if (dist > 1.5) {
        dir.normalize()

        mPos.addScaledVector(dir, delta * 7)

        group.current.lookAt(pPos.x, mPos.y, pPos.z)
      }
    })

    if (!active) return null

    return (
      <group ref={group} {...props} dispose={null}>
        <primitive object={clone} scale={0.5} />
      </group>
    )
  }
)