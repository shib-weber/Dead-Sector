import React, { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  ContactShadows,
  Html,
  Stars,
  Environment
} from '@react-three/drei'
import * as THREE from 'three'
import { Joystick } from 'react-joystick-component'

// Components
import { Model as Male } from './Male'
import { Model as Female } from './Female'
import { Model as Female2 } from './Female2'
import { Model as HotF } from './HotF'

import { Monster } from './Monster1'
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
// ---------------- LOADER ----------------
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'red', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center', width: '200px', background: 'black', padding: '10px', border: '1px solid red' }}>
        SYSTEM BOOTING...
      </div>
    </Html>
  )
}

// ---------------- LAVA ----------------
function FlowingLava() {
  const matRef = useRef()
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 2) * 0.2
    }
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <circleGeometry args={[20, 128]} />
      <meshStandardMaterial ref={matRef} color="#200" emissive="#ff2200" emissiveIntensity={0.6} />
    </mesh>
  )
}

// ---------------- GROUND ----------------
function Ground({modelType}) {
  // Define the number of rings and the gap between them
  const numRings = 4;
  const ringGap = 2; // Distance between each hexagonal ring
  const baseRadius = 4.8; // Starting inner radius

  return (
    <group position={modelType==='HotF'?[0, -1.5, 0]:[0, -1.5, 0]}>
      {/* Main Concrete Platform */}
      <mesh receiveShadow>
        <cylinderGeometry args={[15, 17, 2.5, 64]} />
        <meshStandardMaterial color="#555252" roughness={1} metalness={0.5} />
      </mesh>

      {/* Nested Hexagonal Rings */}
      {[...Array(numRings)].map((_, i) => {
        const radius = baseRadius + i * ringGap;
        return (
          <mesh 
            key={`hex-${i}`} 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 1.27, 0]}
          >
            {/* 6 segments creates the hexagonal shape */}
            <ringGeometry args={[radius, radius + 0.2, 6]} />
            <meshStandardMaterial 
              emissive="#ff0000" 
              emissiveIntensity={5 - i} // Fades intensity for outer rings
              color="#000" 
            />
          </mesh>
        );
      })}

      {/* Outer Border Glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.27, 0]}>
        <ringGeometry args={[14.5, 14.7, 64]} />
        <meshStandardMaterial emissive="#0022ff" emissiveIntensity={3} color="#000" />
      </mesh>
    </group>
  );
}

// ---------------- RADAR ----------------
function RadarLogic({ playerRef, monsterRefs, setDots, monsterActive,cameraRef }) {
useFrame(() => {
  if (!playerRef.current || !cameraRef.current) return;

  const pPos = playerRef.current.getPosition?.();
  if (!pPos) return;

  // ✅ ALWAYS CORRECT direction (camera-based)
  const forward = new THREE.Vector3();
  cameraRef.current.getWorldDirection(forward);

  forward.y = 0;
  forward.normalize();

  const monstersData = [];

  monsterRefs.current.forEach((m) => {
    if (!m) return;

    const mPos = m.getPosition?.();
    if (!mPos) return;

    monstersData.push({
      x: (mPos.x - pPos.x) * 2.5,
      y: (mPos.z - pPos.z) * 2.5
    });
  });

  setDots({
    p: {
      x: 0,
      y: 0,
      angle: Math.atan2(forward.x, -forward.z)
    },
    m: monstersData
  });
});

  return null;
}

// ---------------- GAME SYSTEMS ----------------
function GameSystems({ 
  isAiming, 
  modelRef, 
  monsterRefs, 
  bullets, 
  setBullets, 
  setMonsters,
  moveDirRef,        
  isRunningRef,
  modelType       
}) {
  const { camera, gl } = useThree();
  const rotation = useRef({ yaw: 0, pitch: 0 });
  useEffect(() => {
  if (!isMobile) return;

  let lastX = 0;
  let lastY = 0;
  let activeTouchId = null;

  const handleTouchStart = (e) => {
    const touch = e.touches[0];

    // Only right side controls camera
    if (touch.clientX < window.innerWidth / 2) return;

    activeTouchId = touch.identifier;
    lastX = touch.clientX;
    lastY = touch.clientY;
  };

  const handleTouchMove = (e) => {
    if (!isAiming) return;

    const touch = [...e.touches].find(t => t.identifier === activeTouchId);
    if (!touch) return;

    const dx = touch.clientX - lastX;
    const dy = touch.clientY - lastY;

    rotation.current.yaw -= dx * 0.005;
    rotation.current.pitch -= dy * 0.005;

    rotation.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, rotation.current.pitch));

    lastX = touch.clientX;
    lastY = touch.clientY;
  };

  const handleTouchEnd = () => {
    activeTouchId = null;
  };

  window.addEventListener('touchstart', handleTouchStart);
  window.addEventListener('touchmove', handleTouchMove);
  window.addEventListener('touchend', handleTouchEnd);

  return () => {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  };
}, [isAiming]);

  useEffect(() => {

    if (isMobile) return;
    const handleMouseMove = (e) => {
      if (!isAiming) return;
      rotation.current.yaw -= e.movementX * 0.002;
      rotation.current.pitch -= e.movementY * 0.002;
      rotation.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, rotation.current.pitch));
    };

    if (isAiming) {
      gl.domElement.requestPointerLock();
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
      window.removeEventListener('mousemove', handleMouseMove);
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isAiming, gl.domElement]);

  useFrame((state, delta) => {
    if (!modelRef.current) return;

    const playerPos = modelRef.current.getPosition();

    // ===== CAMERA + PLAYER ROTATION =====
    if (isAiming) {
      let offset;

if (modelType === "male") {
  offset = new THREE.Vector3(1.0, 2.4, 4.5); // 🔥 higher & farther
} else {
  offset = new THREE.Vector3(0.8, 1.8, 3.5);

  if (modelType === "male") {
  offset.x += 0.5; // move camera to right shoulder
}
}
      const rotMat = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ')
      );
      offset.applyMatrix4(rotMat);

      state.camera.position.lerp(playerPos.clone().add(offset), 0.2);
      state.camera.lookAt(playerPos.clone().setY(playerPos.y + 1.5));

      const forward = new THREE.Vector3();
      state.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const target = playerPos.clone().add(forward);
      modelRef.current.lookAt?.(target);
      modelRef.current.rotateY?.(Math.PI);
    }

    // ===== MOVEMENT UPDATE (JOYSTICK + KEYBOARD) =====
    const cam = state.camera;
    const forward = new THREE.Vector3(); cam.getWorldDirection(forward); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    // Combine inputs from moveDirRef (which handles both Joystick and Keys)
    const finalMove = new THREE.Vector3()
      .addScaledVector(forward, -moveDirRef.current.z) 
      .addScaledVector(right, moveDirRef.current.x);
    
    if (finalMove.length() > 0.01) {
       modelRef.current.move(finalMove.normalize(), isRunningRef.current);
    } else {
       modelRef.current.move(new THREE.Vector3(0,0,0), false);
    }

    // ===== BULLET MOVEMENT =====
if (bullets.length > 0) {
  setBullets(prev =>
    prev.map(b => {
      const velocity = b.direction.clone().multiplyScalar(80 * delta);
      const newPos = b.position.clone().add(velocity);
      const newLife = b.life + delta;

      let hit = false;

      monsterRefs.current.forEach((monster, i) => {
        if (!monster) return;

        const mPos = monster.getPosition();

        if (newPos.distanceTo(mPos) < 3.5) {
          const dead = monster.takeDamage(20);

          if (dead) {
            monsterRefs.current[i] = null;

            setMonsters(prev =>
              prev.filter((_, idx) => idx !== i)
            );
          }

          hit = true;
        }
      });

      if (hit || newLife > 3.0) return null;

      return { ...b, position: newPos, life: newLife };
    }).filter(Boolean)
  );
}
  });

  return (
    <group>
      {bullets.map((b) => (
        <mesh key={b.id} position={b.position}>
          <sphereGeometry args={[0.15, 16, 16]} />
          if(modelType==='male'){}
          <meshBasicMaterial color={modelType==='male'? "#ffa600 ": modelType === 'female' ? "#000dff " : modelType==='female2'? "#8cff00":"#ff0000"} />
          <pointLight color={modelType === 'male'?"#ffaa00":modelType === 'female' ? "#5900ff": modelType==='female2'?"#00ffbb":"#ff00a6"} intensity={15} distance={10} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------- MAIN COMPONENT ----------------
export default function AvatarWorld({ selectedModel }) {
  const modelRef = useRef();
  const monsterRefs = useRef([]);
const [monsters, setMonsters] = useState([]);
const [wave, setWave] = useState(1);
  const cameraRef = useRef();
  
  const [dots, setDots] = useState({
  p: { x: 0, y: 0, angle: 0 },
  m: []
});
  const [monsterActive, setMonsterActive] = useState(false);
  const [dungeonStatus, setDungeonStatus] = useState("closed"); 
  const [bullets, setBullets] = useState([]); 
  const [gameOver, setGameOver] = useState(false);
  const [isAiming, setIsAiming] = useState(false);
  const [monsterDead, setMonsterDead] = useState(false);
  const [waveMessage, setWaveMessage] = useState("");

  const moveDirRef = useRef(new THREE.Vector3(0, 0, 0));
  const isRunningRef = useRef(false);
  const PlayerModel = selectedModel === "female" ? Female : selectedModel==="male" ? Male :selectedModel==="female2"? Female2:HotF;

  const spawnBullet = useCallback(() => {
    if (!cameraRef.current || !modelRef.current || !isAiming) return;
    const dir = new THREE.Vector3();
    cameraRef.current.getWorldDirection(dir);
    dir.y += 0.25;
    dir.normalize();

    let spawnPos = modelRef.current.getGunWorldPosition?.();
    if (!spawnPos) {
      const pPos = modelRef.current.getPosition();
      spawnPos = pPos.clone().add(new THREE.Vector3(0, 1.6, 0)).add(dir.clone().multiplyScalar(1.2));
    }

    setBullets(prev => [
      ...prev,
      { id: Math.random(), position: spawnPos.clone(), direction: dir.clone(), life: 0 }
    ]);
  }, [isAiming]);

  const handleFire = (e) => {
    if (e) e.preventDefault();
    if (!isAiming || gameOver || monsterDead) return;
    modelRef.current?.shoot();
    spawnBullet();
  };
const handleSummon = () => {
  if (dungeonStatus !== "closed") return;

  setDungeonStatus("opening");

  setTimeout(() => {
    const count = wave;

    const newMonsters = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * 15;

      return {
        id: Math.random(),
        position: [
          Math.cos(angle) * radius,
          -0.2,
          Math.sin(angle) * radius
        ]
      };
    });

    monsterRefs.current = [];
    setMonsters(newMonsters);

    // 🔥 IMPORTANT
    setMonsterActive(true);

    setDungeonStatus("active");
  }, 1500);
};

  useEffect(() => {
    const mousedown = (e) => { if (e.button === 0) handleFire(e); };
    if (isAiming) window.addEventListener('mousedown', mousedown);
    return () => window.removeEventListener('mousedown', mousedown);
  }, [isAiming, spawnBullet]);

  // Keyboard Movement Integration
  useEffect(() => {
    const keyDown = (e) => {
      if (e.code === 'KeyW') moveDirRef.current.z = -1;
      if (e.code === 'KeyS') moveDirRef.current.z = 1;
      if (e.code === 'KeyA') moveDirRef.current.x = -1;
      if (e.code === 'KeyD') moveDirRef.current.x = 1;
      if (e.code === 'ShiftLeft') isRunningRef.current = true;
      if (e.code === 'Space') modelRef.current?.jump();
      if (e.code === 'KeyM') handleSummon();
    }
    
    
    const keyUp = (e) => {
      if (['KeyW', 'KeyS'].includes(e.code)) moveDirRef.current.z = 0;
      if (['KeyA', 'KeyD'].includes(e.code)) moveDirRef.current.x = 0;
      if (e.code === 'ShiftLeft') isRunningRef.current = false;
    }
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    return () => { window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); }
  }, []);
useEffect(() => {
  if (monsters.length === 0 && dungeonStatus === "active") {

    if (wave >= 3) {
      setMonsterDead(true);
      return;
    }

    setWaveMessage(`WAVE ${wave} CLEARED`);

    setTimeout(() => {
      setWaveMessage("SUMMONING NEXT WAVE...");

      setTimeout(() => {
        const nextWave = wave + 1;
        setWave(nextWave);

        // 🔥 AUTO SPAWN NEXT WAVE
        const newMonsters = Array.from({ length: nextWave }).map(() => {
          const angle = Math.random() * Math.PI * 2;
          const radius = 25 + Math.random() * 20;

          return {
            id: Math.random(),
            position: [
              Math.cos(angle) * radius,
              -0.2,
              Math.sin(angle) * radius
            ]
          };
        });

        monsterRefs.current = [];
        setMonsters(newMonsters);
        setMonsterActive(true);
        setDungeonStatus("active");

        setWaveMessage("");
      }, 2000);

    }, 2000);
  }
}, [monsters]);



  const handleGunOut = () => {
    if (gameOver || monsterDead) return;
    setIsAiming(!isAiming);
    modelRef.current?.drawGun(); 
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      
      {gameOver && <div style={overlayStyle}><h1 style={{color: 'red', fontSize: '3rem'}}>WASTED</h1><button onClick={() => window.location.reload()} style={btn}>RETRY</button></div>}
      {monsterDead && <div style={overlayStyle}><h1 style={{color: '#0f0', fontSize: '3rem'}}>TARGET NEUTRALIZED</h1><button onClick={() => window.location.reload()} style={btn}>YOU OWN</button></div>}

      {isAiming && !gameOver && !monsterDead && <div style={crosshair}><div style={innerCross} /></div>}

      <div style={radarContainer}>
        <div style={radarCircle}>
          <div style={radarSweep} />
<div
  style={{
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(-50%, -50%) rotate(${dots.p.angle}rad)`,
    pointerEvents: 'none'
  }}
>
  {/* 🔺 Triangle */}
  <div
    style={{
      width: 0,
      height: 0,
      borderLeft: '7px solid transparent',
      borderRight: '7px solid transparent',
      borderBottom: '14px solid #0f0',
      filter: 'drop-shadow(0 0 6px #0f0)'
    }}
  />

  {/* 🔥 Direction Beam */}
  <div
    style={{
      position: 'absolute',
      top: -60,   
      left: -18,
      width: 50,
      height: 60,
      background: 'linear-gradient(to top, rgba(0,255,0,0.4), transparent)',
      clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
      filter: 'blur(2px)',
      opacity: 0.8
    }}
  />
</div>
          {monsterActive && dots.m.map((m, i) => (
            <div
              key={i}
              style={{
                ...dotStyle,
                background: '#f00',
                left: `calc(50% + ${m.x}px)`,
                top: `calc(50% + ${m.y}px)`,
                boxShadow: '0 0 10px red'
              }}
            />
          ))}        
          </div>
      </div>

      <div style={ui}>
        <button onClick={handleGunOut} style={btn}>
  {isAiming ? (
    // 🟠 HOLSTER ICON (Backpack/Storage Concept)
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2h8a2 2 0 0 1 2 2v18H6V4a2 2 0 0 1 2-2z" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M12 6v2" />
    </svg>
  ) : (
    // 🔫 DRAW WEAPON (Detailed SMG/UMP Profile)
    <svg width="45" height="25" viewBox="0 0 200 80">
      <g fill="white">
        {/* Silencer/Barrel Tip */}
        <rect x="175" y="28" width="15" height="6" rx="1" />
        
        {/* Main Barrel & Handguard */}
        <rect x="100" y="25" width="75" height="12" rx="2" />
        
        {/* Receiver/Upper Body */}
        <rect x="60" y="20" width="60" height="22" rx="3" />
        
        {/* Magazine (Slightly curved/angled) */}
        <path d="M105 37 L115 37 L110 65 L100 65 Z" />
        
        {/* Pistol Grip */}
        <path d="M75 42 L90 42 L82 65 L67 65 Z" />
        
        {/* Stock (Skeletonized look) */}
        <path d="M60 25 L20 25 L15 50 L25 50 L30 35 L60 35 Z" />
        
        {/* Iron Sights */}
        <rect x="65" y="16" width="6" height="4" />
        <rect x="155" y="21" width="4" height="4" />
      </g>
    </svg>
  )}
</button>
        <button onClick={handleSummon} style={{ ...btn, marginLeft: 10 }}>{dungeonStatus === "closed" ? "SUMMON 👾" : "LIVE"}</button>
      </div>
              {waveMessage && (
          <div style={waveUI}>
            {waveMessage}
          </div>
        )}

      <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }} onCreated={({ camera }) => { cameraRef.current = camera }}>
        <color attach="background" args={['#020000']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        <Environment preset="night" />
        <Stars radius={150} depth={50} count={7000} factor={4} fade speed={1} />

        <Suspense fallback={<Loader />}>
          <PlayerModel
            ref={modelRef}
            scale={1.6}
            position={[0, selectedModel==='HotF'?3:-0.2, 0]}
            isAiming={isAiming}
          />
          <RadarLogic
            playerRef={modelRef}
            monsterRefs={monsterRefs}
            setDots={setDots}
            monsterActive={monsterActive}
            cameraRef={cameraRef}
          />
          <GameSystems 
            isAiming={isAiming} 
            modelRef={modelRef} 
            monsterRefs={monsterRefs}
            bullets={bullets} 
            setBullets={setBullets} 
            setMonsters={setMonsters}
            monsterActive={monsterActive} 
            setMonsterActive={setMonsterActive} 
            setMonsterDead={setMonsterDead} 
            moveDirRef={moveDirRef}
            isRunningRef={isRunningRef}   
            modelType={selectedModel}
          />
{monsters.map((m, i) => (
  <Monster
    key={m.id}
    ref={el => (monsterRefs.current[i] = el)}
    active={true}
    playerRef={modelRef}
    setGameOver={setGameOver}
    position={m.position}
    hp={100 + wave * 20} 
    scale={2.5}
  />
))}
        </Suspense>

        <Ground modelType={selectedModel}/>
        <FlowingLava />
        <ContactShadows opacity={0.8} scale={30} blur={2.5} far={10} />
        <OrbitControls enabled={!isAiming} enablePan={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>

      {!gameOver && !monsterDead && (
        <button onMouseDown={handleFire} style={fireBtn}><svg width="80" height="30" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
  <g>

    <path d="M150 10 Q190 40 150 70 L130 70 Q160 40 130 10 Z" fill="#c9a23a"/>

    <rect x="120" y="20" width="30" height="40" fill="#d4af37"/>

    <rect x="40" y="15" width="80" height="50" rx="6" fill="#b8860b"/>

    <rect x="20" y="20" width="20" height="40" rx="4" fill="#8b6508"/>

    <rect x="10" y="25" width="10" height="30" rx="2" fill="#6e4f05"/>

  </g>
</svg></button>
      )}

      {!gameOver && !monsterDead && (
        <div style={joystickContainer}>
          <Joystick
            size={100}
            baseColor="rgba(255,255,255,0.1)"
            stickColor="rgba(255,0,0,0.8)"
            move={(e) => {
              // x/y are provided by the component based on distance from center
              // We map Y to Z because Three.js Z is forward/back
              moveDirRef.current.x = (e.x || 0) / 50;
              moveDirRef.current.z = -(e.y || 0) / 50; 
              
              // Simple "run" logic if stick is pushed far
              const dist = Math.sqrt(e.x*e.x + e.y*e.y);
              isRunningRef.current = dist > 40;
            }}
            stop={() => {
              moveDirRef.current.set(0, 0, 0);
              isRunningRef.current = false;
            }}
          />
        </div>
      )}

      <style>{`@keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ---------------- STYLES ----------------
const ui = { position: 'absolute', top: 30, left: 30, zIndex: 10, display: 'flex' }
const btn = { padding: '12px 20px', background: '#000', color: 'white', border: '2px solid red', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }
const radarContainer = { position: 'absolute', top: 20, right: 20, zIndex: 100, padding: 10, background: 'rgba(0,0,0,0.85)', borderRadius: '50%', border: '1px solid #333' }
const radarCircle = { position: 'relative', width: 180, height: 180, borderRadius: '50%', border: '2px solid #040', background: 'radial-gradient(circle, #001100 0%, #000 100%)', overflow: 'hidden' }
const radarSweep = { position: 'absolute', width: '100%', height: '100%', background: 'conic-gradient(from 0deg, rgba(0,255,0,0.2), transparent 90deg)', animation: 'sweep 3s linear infinite' }
const dotStyle = { position: 'absolute', width: 8, height: 8, borderRadius: '50%', transform: 'translate(-50%, -50%)' }
const crosshair = { position: 'absolute', top: '25%', left: '49%', width: 34, height: 34, border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const innerCross = { width: 4, height: 4, background: 'red', borderRadius: '50%', boxShadow: '0 0 5px red' }
const overlayStyle = { position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: 'white', fontFamily: 'monospace' }
const fireBtn = { position: 'absolute', bottom: 30, right: 30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255, 0, 0, 0.35)', border: '2px solid rgba(255,255,255,0.6)', color: '#fff', fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 200, backdropFilter: 'blur(6px)', boxShadow: '0 0 15px rgba(255,0,0,0.6)', transition: '0.2s ease' }
const joystickContainer = { position: 'absolute', bottom: 30, left: 30, zIndex: 200 }
const waveUI = {
  position: 'absolute',
  top: '40%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'red',
  fontSize: '2rem',
  fontFamily: 'monospace',
  letterSpacing: '3px',
  textAlign: 'center',
  zIndex: 999,
  textShadow: '0 0 15px red'
}