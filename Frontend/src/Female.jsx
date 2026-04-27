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
  const gunRef = useRef()

  const { scene, animations } = useGLTF('/Female.glb')
  const { scene: gunScene } = useGLTF('/gun.glb')

  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions, names, mixer } = useAnimations(animations, clone)

  const currentAction = useRef()
  const direction = useRef(new THREE.Vector3())
  const isLocked = useRef(false)
  const shootCallback = useRef(() => {})
  const gunEquipped = useRef(false)

  // ---------------- ANIM MAP ----------------
  const animMap = useMemo(() => {
    const map = {}
    names.forEach((n) => {
      const name = n.toLowerCase()
      if (name.includes('idle')) map.idle = n
      if (name.includes('walk')) map.walk = n
      if (name.includes('run')) map.run = n
      if (name.includes('jumpimg')) map.jump = n
      if (name.includes('gun')) map.gun = n
      if (name.includes('shoot')) map.shoot = n
    })
    return map
  }, [names])

  // ---------------- PLAY ----------------
const playAnim = (name, loop = true, lock = false) => {
  const next = actions[name];
  if (!next) return;
  
  // If we are playing 'shoot', we allow it to interrupt itself for rapid fire
  if (currentAction.current === next && name !== animMap.shoot) return;

  currentAction.current?.fadeOut(0.2);

  next.reset().fadeIn(0.1)
    .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
    .play();

  next.clampWhenFinished = !loop;
  currentAction.current = next;
  isLocked.current = lock;

  // Cleanup previous listeners
  mixer.removeEventListener('finished', onFinish);
  if (!loop) {
    mixer.addEventListener('finished', onFinish);
  }
};

  const onFinish = () => {
    isLocked.current = false
    playAnim(animMap.idle)
  }

  
  // ---------------- ATTACH GUN ----------------
  useEffect(() => {
    if (!group.current || !gunScene) return

    const bone = group.current.getObjectByName('J_Sec_L_TipSleeve_end_03')

    if (bone) {
      const gun = gunScene.clone()

      gun.scale.set(0.15, 0.15, 0.15)
      gun.rotation.set(Math.PI / 2, 0, Math.PI / 2)
      gun.position.set(0, 0, 0)

      gun.visible = false

      bone.add(gun)
      gunRef.current = gun
    }
  }, [gunScene])

  // ---------------- EXPOSE ----------------
  useImperativeHandle(ref, () => ({
    move: (dir, isRunning) => {
      direction.current.copy(dir)

      if (isLocked.current) return

      if (dir.length() === 0) playAnim(animMap.idle)
      else playAnim(isRunning ? animMap.run : animMap.walk)
    },

    jump: () => {
      if (animMap.jump && !isLocked.current)
        playAnim(animMap.jump, false, true)
    },

    drawGun: () => {
      if (!animMap.gun || isLocked.current) return

      if (gunRef.current) gunRef.current.visible = true
      gunEquipped.current = true

      playAnim(animMap.gun, false, true)
    },

shoot: () => {
    // Force play shoot animation even if locked (unless it's a jump lock)
    if (!gunEquipped.current || !animMap.shoot) return;
    playAnim(animMap.shoot, false, true);
    shootCallback.current();
  },

    setShootCallback: (cb) => {
      shootCallback.current = cb
    },

    getGunWorldPosition: () => {
      if (!gunRef.current) return null
      return gunRef.current.getWorldPosition(new THREE.Vector3())
    },

    isGunEquipped: () => gunEquipped.current,

    getPosition: () => {
      return group.current.getWorldPosition(new THREE.Vector3())
    },
    lookAt: (targetVec) => {
    group.current.lookAt(targetVec.x, group.current.position.y, targetVec.z);
  }
  }))

  // ---------------- MOVEMENT ----------------
  useFrame(() => {
    if (!group.current) return

    if (direction.current.length() > 0) {
      const speed = 0.1

      group.current.position.x += direction.current.x * speed
      group.current.position.z += direction.current.z * speed

      const angle = Math.atan2(direction.current.x, direction.current.z)

      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        angle,
        0.15
      )
    }
  })

  useEffect(() => {
    if (animMap.idle) playAnim(animMap.idle)
  }, [animMap])

  return (
    <group ref={group} {...props}>
      <primitive object={clone} />
    </group>
  )
})