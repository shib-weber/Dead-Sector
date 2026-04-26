import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  ContactShadows,
  Html,
  Stars,
  Environment
} from '@react-three/drei'
import * as THREE from 'three'

// Components
import { Model } from './Female'
import { Monster } from './Monster1'

// ---------------- LOADER ----------------
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'red', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center' }}>
        LOADING ASSETS...
      </div>
    </Html>
  )
}

// ---------------- FLOWING LAVA ----------------
function FlowingLava() {
  const matRef = useRef()
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 2) * 0.2
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <circleGeometry args={[18.5, 128]} />
      <meshStandardMaterial
        ref={matRef}
        color="#330000"
        emissive="#ff2200"
        emissiveIntensity={0.6} // reduced from 2+
      />
    </mesh>
  )
}

// ---------------- GROUND ----------------
function Ground() {
  return (
    <group position={[0, -1.5, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[15, 17, 2.5, 64]} />
        <meshStandardMaterial color="#1f0101" roughness={1} />
      </mesh>

      {[...Array(40)].map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 20,
            1.3,
            (Math.random() - 0.5) * 20
          ]}
        >
          <boxGeometry args={[Math.random() * 3, 0.05, 0.2]} />
          <meshStandardMaterial
            emissive="#d81515"
            emissiveIntensity={2}
            color="#000"
          />
        </mesh>
      ))}
    </group>
  )
}

// ---------------- RADAR LOGIC ----------------
function RadarLogic({ playerRef, monsterRef, setDots, monsterActive }) {
  useFrame(() => {
    if (playerRef.current) {
      const zoom = 2.0 
      const pPos = playerRef.current.position || new THREE.Vector3()
      
      let mData = { x: 0, y: 0 }
      if (monsterActive && monsterRef.current) {
        const mPos = monsterRef.current.position || new THREE.Vector3()
        mData = { x: mPos.x * zoom, y: mPos.z * zoom }
      }

      setDots({
        p: { x: pPos.x * zoom, y: pPos.z * zoom },
        m: mData
      })
    }
  })
  return null
}

// ---------------- MAIN COMPONENT ----------------
export default function AvatarWorld() {
  const modelRef = useRef()
  const monsterRef = useRef()
  const cameraRef = useRef()
  
  const [dots, setDots] = useState({ p: { x: 0, y: 0 }, m: { x: 0, y: 0 } })
  const [monsterActive, setMonsterActive] = useState(false)
  const [dungeonStatus, setDungeonStatus] = useState("closed") 

  const moveDirRef = useRef(new THREE.Vector3(0, 0, 0))
  const isRunningRef = useRef(false)

  // ---------------- KEYBOARD LOGIC ----------------
  useEffect(() => {
    const updateMovement = () => {
      if (!modelRef.current || !cameraRef.current) return
      
      const cam = cameraRef.current
      const forward = new THREE.Vector3()
      cam.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()

      const right = new THREE.Vector3()
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      const finalMove = new THREE.Vector3()
      finalMove.addScaledVector(forward, -moveDirRef.current.z)
      finalMove.addScaledVector(right, moveDirRef.current.x)

      if (finalMove.length() > 0) finalMove.normalize()
      modelRef.current.move(finalMove, isRunningRef.current)
    }

    const keyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveDirRef.current.z = -1; break
        case 'KeyS': case 'ArrowDown': moveDirRef.current.z = 1; break
        case 'KeyA': case 'ArrowLeft': moveDirRef.current.x = -1; break
        case 'KeyD': case 'ArrowRight': moveDirRef.current.x = 1; break
        case 'ShiftLeft': case 'ShiftRight': isRunningRef.current = true; break
        case 'Space': modelRef.current?.jump(); break
        case 'KeyM': handleSummon(); break
      }
      updateMovement()
    }

    const keyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': 
        case 'KeyS': case 'ArrowDown': moveDirRef.current.z = 0; break
        case 'KeyA': case 'ArrowLeft':
        case 'KeyD': case 'ArrowRight': moveDirRef.current.x = 0; break
        case 'ShiftLeft': case 'ShiftRight': isRunningRef.current = false; break
      }
      updateMovement()
    }

    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
    }
  }, [dungeonStatus])

  // ---------------- JOYSTICK ----------------
  const handleJoystickMove = (e) => {
    const touch = e.touches ? e.touches[0] : e
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

  const handleSummon = () => {
    if (dungeonStatus !== "closed") return
    setDungeonStatus("opening")
    setTimeout(() => {
      setMonsterActive(true)
      setDungeonStatus("active")
    }, 2000)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden', touchAction: 'none' }}>
      
      {/* RADAR UI */}
      <div style={radarContainer}>
        <div style={radarCircle}>
          <div style={radarSweep} />
          <div style={{ ...dotStyle, background: '#00ff00', left: `calc(50% + ${dots.p.x}px)`, top: `calc(50% + ${dots.p.y}px)` }} />
          {monsterActive && (
            <div style={{ ...dotStyle, background: '#ff0000', left: `calc(50% + ${dots.m.x}px)`, top: `calc(50% + ${dots.m.y}px)` }} />
          )}
        </div>
      </div>

      {/* BUTTON UI */}
      <div style={ui}>
        <button onClick={() => modelRef.current?.gun()} style={btn}>DRAW WEAPON</button>
        <button 
          onClick={handleSummon} 
          style={{ ...btn, marginLeft: '10px', borderColor: dungeonStatus === 'opening' ? 'orange' : 'red' }}
        >
          {dungeonStatus === "closed" && "OPEN DUNGEON (M)"}
          {dungeonStatus === "opening" && "DOOR OPENING..."}
          {dungeonStatus === "active" && "MONSTER UNLEASHED"}
        </button>
      </div>

      {/* JOYSTICK */}
      <div 
        style={joystick} 
        onPointerMove={handleJoystickMove}
        onPointerUp={handleJoystickEnd}
        onPointerLeave={handleJoystickEnd}
      >
        <div style={joystickInner} />
      </div>

      {/* CANVAS */}
      <Canvas
        shadows
        camera={{ position: [0, 8, 15], fov: 50 }}
        onCreated={({ camera, gl }) => {
          cameraRef.current = camera
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.6
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
      >
        <color attach="background" args={['#202020']} />

        {/* 🔥 ONLY CHANGE: BETTER LIGHTING */}
        <ambientLight intensity={1.2} />
        <hemisphereLight skyColor={"#ffffff"} groundColor={"#444"} intensity={1} />
        <directionalLight position={[10, 15, 10]} intensity={2} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={1.2} />

        <Environment preset="city" />

        <Stars radius={300} depth={60} count={15000} factor={6} fade speed={1} />

        <Suspense fallback={<Loader />}>
          <Model ref={modelRef} scale={1.8} position={[0, -0.2, 0]} />

          <RadarLogic 
            playerRef={modelRef} 
            monsterRef={monsterRef} 
            setDots={setDots} 
            monsterActive={monsterActive} 
          />

          {monsterActive && (
            <Monster 
              ref={monsterRef} 
              active={monsterActive} 
              playerRef={modelRef} 
              scale={4.5}
              position={[0, -0.2, -45]} 
            />
          )}
        </Suspense>

        <Ground />
        <FlowingLava />
        <ContactShadows opacity={0.6} scale={30} blur={2} far={10} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>

      <style>{`
        @keyframes sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ---------------- STYLES (UNCHANGED) ----------------
const ui = { position: 'absolute', top: 30, left: 30, zIndex: 10 }
const btn = { padding: '10px 20px', background: 'rgba(30,0,0,0.8)', color: 'white', border: '2px solid red', cursor: 'pointer', fontWeight: 'bold' }

const joystick = {
  position: 'absolute', bottom: 50, left: 50, width: 120, height: 120,
  borderRadius: '50%', border: '2px solid rgba(255,0,0,0.5)',
  background: 'rgba(255,0,0,0.1)', zIndex: 10, touchAction: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}

const joystickInner = { width: 40, height: 40, borderRadius: '50%', background: 'red', opacity: 0.6 }

const radarContainer = {
  position: 'absolute', top: '20px', right: '20px', zIndex: 100,
  padding: '10px', background: 'rgba(0, 0, 0, 0.7)', borderRadius: '10px', border: '1px solid #333'
}

const radarCircle = {
  position: 'relative', width: '140px', height: '140px', borderRadius: '50%',
  border: '2px solid #004400', background: 'radial-gradient(circle, #001100 0%, #000 100%)', overflow: 'hidden'
}

const radarSweep = {
  position: 'absolute', width: '100%', height: '100%',
  background: 'conic-gradient(from 0deg, rgba(0,255,0,0.3), transparent 90deg)',
  borderRadius: '50%', animation: 'sweep 3s linear infinite'
}

const dotStyle = {
  position: 'absolute', width: '8px', height: '8px', borderRadius: '50%',
  transform: 'translate(-50%, -50%)', transition: 'all 0.1s linear'
}