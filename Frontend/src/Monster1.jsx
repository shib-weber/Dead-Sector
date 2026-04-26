import React, { useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useGraph, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

export const Monster = forwardRef(({ playerRef, active, ...props }, ref) => {
  const group = useRef()
  useImperativeHandle(ref, () => group.current)

  const { scene, animations } = useGLTF('/Monster1.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    if (active && actions) {
      const anim = actions[Object.keys(actions)[0]]
      if (anim) anim.reset().fadeIn(0.5).play()
    }
  }, [active, actions])

  useFrame((state, delta) => {
    if (!active || !group.current || !playerRef.current) return

    const monsterPos = group.current.position
    const playerPos = new THREE.Vector3()
    
    // Check if we exposed the internal group in Female.js
    const target = playerRef.current.group || playerRef.current
    if (target.getWorldPosition) {
      target.getWorldPosition(playerPos)
    } else {
      playerPos.copy(target.position)
    }

    const direction = new THREE.Vector3().subVectors(playerPos, monsterPos)
    direction.y = 0 
    const distance = direction.length()

    if (distance > 1.6) {
      direction.normalize()
      // Smooth linear translation
      monsterPos.addScaledVector(direction, delta * 7) 
      // Face the player directly without lerping rotation to avoid "slurring"
      group.current.lookAt(playerPos.x, monsterPos.y, playerPos.z)
    }
  })

  if (!active) return null

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        <primitive object={nodes.mixamorigHips} />
        <skinnedMesh geometry={nodes.MutantMesh.geometry} material={materials.mutant_M} skeleton={nodes.MutantMesh.skeleton} castShadow />
      </group>
    </group>
  )
})