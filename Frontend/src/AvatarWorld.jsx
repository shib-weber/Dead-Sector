import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Html, Stars } from '@react-three/drei'
import { Model } from './FinalG'

// Loader
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'red' }}>Loading...</div>
    </Html>
  )
}

// Ground
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <circleGeometry args={[3, 64]} />
      <meshStandardMaterial color="#3b0000" />
    </mesh>
  )
}

// Evil Eyes
function EvilEyes() {
  return (
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            Math.random() * 3,
            -Math.random() * 10 - 2
          ]}
        >
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
    </>
  )
}

export default function AvatarWorld() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'black',
        overflow: 'hidden'
      }}
    >
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 45 }}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Fog */}
        <fog attach="fog" args={['#1a0000', 3, 12]} />

        {/* LIGHTING (VISIBLE MODEL) */}
        <ambientLight intensity={0.6} />
        <spotLight
          position={[0, 5, 3]}
          angle={0.4}
          intensity={4}
          penumbra={1}
        />
        <directionalLight position={[2, 2, 2]} intensity={1.5} />

        {/* Red environment lights */}
        <pointLight position={[-3, 1, -2]} intensity={2} color="red" />
        <pointLight position={[3, 1, -2]} intensity={2} color="darkred" />

        {/* MODEL */}
        <Suspense fallback={<Loader />}>
          <Model scale={1.5} position={[0, -1, 0]} />
        </Suspense>

        <Ground />

        <ContactShadows position={[0, -1, 0]} opacity={0.7} scale={6} />

        <EvilEyes />

        <Stars />

        {/* 🔥 GUARANTEED WORKING CONTROLS */}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}