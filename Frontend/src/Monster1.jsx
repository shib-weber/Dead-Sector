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
export const Monster = forwardRef(({ playerRef, setGameOver, active, hp = 100, onHit, ...props }, ref) => {
  const group = useRef()
  const hpRef = useRef(hp)

  const { scene, animations } = useGLTF('/Monster1.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions, names } = useAnimations(animations, clone)

  const currentAction = useRef()

  // -------- ANIMATION --------
  useEffect(() => {
    if (!actions || !names.length || !active) return

    const runAnim =
      names.find(n => n.toLowerCase().includes('run')) ||
      names.find(n => n.toLowerCase().includes('walk')) ||
      names[0]

    actions[runAnim]?.reset().fadeIn(0.2).play()
    currentAction.current = actions[runAnim]
  }, [actions, names, active])

  // -------- EXPOSE --------
  useImperativeHandle(ref, () => ({
    getPosition: () => group.current.getWorldPosition(new THREE.Vector3()),

    takeDamage: (dmg) => {
      hpRef.current -= dmg
      if (onHit) onHit(hpRef.current)
      return hpRef.current <= 0
    }
  }))

  // -------- MOVEMENT --------
  useFrame((_, delta) => {
    if (!group.current || !playerRef.current || !active) return

    const playerPos = playerRef.current.getPosition()
    const monsterPos = group.current.position.clone()

    const dir = new THREE.Vector3()
      .subVectors(playerPos, monsterPos)
      .normalize()

    // 🔻 REDUCED SPEED (IMPORTANT)
    const speed = 4   // was 10 → now slower
    group.current.position.add(dir.multiplyScalar(speed * delta))

    // Rotation
    const angle = Math.atan2(dir.x, dir.z)
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      angle,
      0.2
    )

    // Game over
    if (monsterPos.distanceTo(playerPos) < 2.5) {
      setGameOver(true)
    }
  })

  return (
    <group ref={group} {...props}>
      <primitive object={clone} />

      {/* 🔴 HP BAR */}
      <mesh position={[0, 4, 0]}>
        <planeGeometry args={[2, 0.2]} />
        <meshBasicMaterial color="black" />
      </mesh>

      <mesh position={[0, 4, 0.01]} scale={[hpRef.current / hp, 1, 1]}>
        <planeGeometry args={[2, 0.2]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </group>
  )
})