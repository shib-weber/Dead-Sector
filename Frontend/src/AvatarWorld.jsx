import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  ContactShadows,
  Html,
  Stars,
  Environment
} from '@react-three/drei'
import { Model } from './Female'
import * as THREE from 'three'

// Loader
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'red', fontWeight: 'bold', fontFamily: 'monospace' }}>
        LOADING AVATAR...
      </div>
    </Html>
  )
}

// Ground - Larger and better texture feel
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <circleGeometry args={[20, 64]} />
      <meshStandardMaterial color="#1d1c1c" roughness={0.8} />
    </mesh>
  )
}

export default function AvatarWorld() {
  const modelRef = useRef()
  const [keys, setKeys] = useState({})

  // Keyboard Input logic
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

  // Movement loop
useEffect(() => {
  const dir = new THREE.Vector3()
  let running = false

  const update = () => {
    if (!modelRef.current) return
    const moveDir = dir.clone()
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
        modelRef.current?.jump() // 🔥 only once
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

  // Handle Joystick Touch
  const handleJoystickMove = (e) => {
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    
    // Calculate normalized vector from center of joystick
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const x = (touch.clientX - centerX) / (rect.width / 2)
    const y = (touch.clientY - centerY) / (rect.height / 2)

    const dir = new THREE.Vector3(x, 0, y)
    if (dir.length() > 0.1) {
        dir.normalize()
        modelRef.current?.move(dir, false)
    }
  }

  const handleJoystickEnd = () => {
    // Reset to idle when letting go of joystick
    modelRef.current?.move(new THREE.Vector3(0, 0, 0), false)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      
      {/* UI Overlay */}
      <div style={ui}>
        <button 
            onClick={() => modelRef.current?.gun()} 
            style={btn}
            onMouseEnter={(e) => e.target.style.background = 'red'}
            onMouseLeave={(e) => e.target.style.background = '#220000'}
        >
          DRAW WEAPON
        </button>
        <div style={{color: 'white', marginTop: '10px', fontSize: '12px'}}>
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
        camera={{ position: [0, 3, 6], fov: 45 }} // Pulled back slightly for better visibility
      >
        <color attach="background" args={['#050505']} />
        
        {/* LIGHTING - Essential for visibility */}
        <ambientLight intensity={0.5} />
        <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <directionalLight position={[-2, 5, 2]} intensity={1} />
        
        {/* Environment adds realistic reflections to the model materials */}
        <Environment preset="city" />

        <Suspense fallback={<Loader />}>
          <Model ref={modelRef} scale={1.5} position={[0, -1, 0]} />
        </Suspense>

        <Ground />

        <ContactShadows 
            opacity={0.5} 
            scale={15} 
            blur={2} 
            far={4.5} 
        />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <OrbitControls 
            makeDefault 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2.1} // Prevent looking under the floor
        />
      </Canvas>
    </div>
  )
}

// --- STYLES ---

const ui = {
  position: 'absolute',
  top: 30,
  left: 30,
  zIndex: 10,
  pointerEvents: 'none' // Allows clicking through the div but not buttons
}

const btn = {
  padding: '12px 24px',
  background: '#220000',
  color: 'white',
  border: '2px solid red',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: '0.2s',
  pointerEvents: 'auto'
}

const joystick = {
  position: 'absolute',
  bottom: 50,
  left: 50,
  width: 120,
  height: 120,
  borderRadius: '50%',
  border: '2px solid rgba(255, 0, 0, 0.5)',
  background: 'rgba(255, 0, 0, 0.1)',
  zIndex: 10,
  touchAction: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const joystickInner = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'red',
    opacity: 0.6
}