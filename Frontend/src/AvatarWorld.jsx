import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  ContactShadows,
  Html,
  Stars
} from '@react-three/drei'
import { Model } from './Female'
import * as THREE from 'three'

// ---------------- LOADER ----------------
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'red', fontWeight: 'bold', fontFamily: 'monospace' }}>
        LOADING AVATAR...
      </div>
    </Html>
  )
}

// ---------------- FLOWING LAVA ----------------
function FlowingLava() {
  const matRef = useRef()

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity =
        2 + Math.sin(clock.elapsedTime * 2) * 1
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <circleGeometry args={[15, 128]} />
      <meshStandardMaterial
        ref={matRef}
        color="#220000"
        emissive="#ff2200"
        emissiveIntensity={2}
      />
    </mesh>
  )
}

// ---------------- GROUND ----------------
function Ground() {
  return (
    <group position={[0, -1.5, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[10, 12, 2.5, 64]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>

      {[...Array(40)].map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 14,
            1.3,
            (Math.random() - 0.5) * 14
          ]}
        >
          <boxGeometry args={[Math.random() * 3, 0.05, 0.2]} />
          <meshStandardMaterial
            emissive="#ff3300"
            emissiveIntensity={4}
            color="#000"
          />
        </mesh>
      ))}

      <mesh position={[0, -3, 0]}>
        <coneGeometry args={[12, 8, 64]} />
        <meshStandardMaterial color="#111" roughness={1} />
      </mesh>
    </group>
  )
}

// ---------------- MAIN ----------------
export default function AvatarWorld() {
  const modelRef = useRef()
  const cameraRef = useRef()
  const [keys, setKeys] = useState({})

  // ---------------- KEY TRACK ----------------
  useEffect(() => {
    const down = (e) => setKeys((k) => ({ ...k, [e.code]: true }))
    const up = (e) => setKeys((k) => ({ ...k, [e.code]: false }))

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // ---------------- CAMERA RELATIVE MOVEMENT ----------------
  useEffect(() => {
    const dir = new THREE.Vector3()
    let running = false

    const update = () => {
      if (!modelRef.current || !cameraRef.current) return

      const cam = cameraRef.current

      const forward = new THREE.Vector3()
      cam.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()

      const right = new THREE.Vector3()
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      const moveDir = new THREE.Vector3()
      moveDir.addScaledVector(forward, -dir.z)
      moveDir.addScaledVector(right, dir.x)

      if (moveDir.length() > 0) moveDir.normalize()

      modelRef.current.move(moveDir, running)
    }

    const keyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          dir.z = -1
          break
        case 'KeyS':
        case 'ArrowDown':
          dir.z = 1
          break
        case 'KeyA':
        case 'ArrowLeft':
          dir.x = -1
          break
        case 'KeyD':
        case 'ArrowRight':
          dir.x = 1
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          running = true
          break
        case 'Space':
          modelRef.current?.jump()
          break
      }
      update()
    }

    const keyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
        case 'KeyS':
        case 'ArrowDown':
          dir.z = 0
          break
        case 'KeyA':
        case 'ArrowLeft':
        case 'KeyD':
        case 'ArrowRight':
          dir.x = 0
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          running = false
          break
      }
      update()
    }

    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)

    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
    }
  }, [])

  // ---------------- JOYSTICK ----------------
  const handleJoystickMove = (e) => {
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const x = (touch.clientX - centerX) / (rect.width / 2)
    const y = (touch.clientY - centerY) / (rect.height / 2)

    if (!cameraRef.current) return

    const cam = cameraRef.current

    const forward = new THREE.Vector3()
    cam.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    const moveDir = new THREE.Vector3()
    moveDir.addScaledVector(forward, -y)
    moveDir.addScaledVector(right, x)

    if (moveDir.length() > 0.1) {
      moveDir.normalize()
      modelRef.current?.move(moveDir, false)
    }
  }

  const handleJoystickEnd = () => {
    modelRef.current?.move(new THREE.Vector3(0, 0, 0), false)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* UI */}
      <div style={ui}>
        <button onClick={() => modelRef.current?.gun()} style={btn}>
          DRAW WEAPON
        </button>
        <div style={{ color: 'white', marginTop: 10, fontSize: 12 }}>
          WASD to Walk | SHIFT to Run | SPACE to Jump
        </div>
      </div>

      {/* JOYSTICK */}
      <div
        style={joystick}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        <div style={joystickInner} />
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 5, 12], fov: 55 }}
        onCreated={({ camera }) => (cameraRef.current = camera)}
      >
        <color attach="background" args={['#000']} />

        {/* LIGHTING (FIXED VISIBILITY) */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-5, 5, -5]} intensity={1} color="#88ccff" />
        <pointLight position={[0, 3, 0]} intensity={2} color="red" />

        {/* GALAXY */}
        <Stars radius={400} depth={100} count={20000} factor={7} fade speed={2} />

        <Suspense fallback={<Loader />}>
          <Model ref={modelRef} scale={1.8} position={[0, -0.2, 0]} />
        </Suspense>

        <Ground />
        <FlowingLava />

        <ContactShadows opacity={0.6} scale={30} blur={2} far={8} />

        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  )
}

// ---------------- STYLES ----------------
const ui = {
  position: 'absolute',
  top: 30,
  left: 30,
  zIndex: 10,
  pointerEvents: 'none'
}

const btn = {
  padding: '12px 24px',
  background: '#220000',
  color: 'white',
  border: '2px solid red',
  cursor: 'pointer',
  fontWeight: 'bold',
  pointerEvents: 'auto'
}

const joystick = {
  position: 'absolute',
  bottom: 50,
  left: 50,
  width: 120,
  height: 120,
  borderRadius: '50%',
  border: '2px solid rgba(255,0,0,0.5)',
  background: 'rgba(255,0,0,0.1)',
  zIndex: 10,
  touchAction: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const joystickInner = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'red',
  opacity: 0.6
}