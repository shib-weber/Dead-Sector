import React from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Radar({ playerRef, monsterRef, setDots }) {
  useFrame(() => {
    if (playerRef.current && monsterRef.current) {
      // Zoom scales the 3D world to fit the small 2D radar circle
      const zoom = 2.0 
      
      const pPos = playerRef.current.position || new THREE.Vector3()
      const mPos = monsterRef.current.position || new THREE.Vector3()

      setDots({
        p: { x: pPos.x * zoom, y: pPos.z * zoom },
        m: { x: mPos.x * zoom, y: mPos.z * zoom }
      })
    }
  })
  return null
}