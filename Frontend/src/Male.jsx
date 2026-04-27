import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo
} from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

export const Model = forwardRef((props, ref) => {
  const group = useRef()
  const gunRef = useRef()

  // Load models
  const { scene, animations } = useGLTF('/Male.glb')
  const { scene: gunScene } = useGLTF('/gun.glb')

  // Clone for multi-instance support and get nodes/materials
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const { actions, names, mixer } = useAnimations(animations, group)

  // Refs for state
  const currentAction = useRef()
  const direction = useRef(new THREE.Vector3())
  const isLocked = useRef(false)
  const isShooting = useRef(false)
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
      if (name.includes('jump')) map.jump = n
      if (name.includes('gun')) map.gun = n
      if (name.includes('shoot')) map.shoot = n 
    })
    return map
  }, [names])

  // ---------------- PLAY LOGIC ----------------
  const playAnim = (name, loop = true, lock = false) => {
    const next = actions[name]
    if (!next) return
    if (currentAction.current === next && name !== animMap.shoot) return

    currentAction.current?.fadeOut(0.2)

    next
      .reset()
      .fadeIn(0.1)
      .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
      .play()

    next.clampWhenFinished = !loop
    currentAction.current = next
    isLocked.current = lock

    mixer.removeEventListener('finished', onFinish)
    if (!loop) mixer.addEventListener('finished', onFinish)
  }

  const onFinish = () => {
    isLocked.current = false
    isShooting.current = false
    playAnim(animMap.idle)
  }

  // ---------------- ATTACH GUN ----------------
  useEffect(() => {
    if (!group.current || !gunScene) return
    // Note: Verify if Male uses the same bone name as Female
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

  // ---------------- EXPOSE METHODS ----------------
  useImperativeHandle(ref, () => ({
    move: (dir, isRunning) => {
      direction.current.copy(dir)
      if (isLocked.current || isShooting.current) return

      if (dir.length() === 0) playAnim(animMap.idle)
      else playAnim(isRunning ? animMap.run : animMap.walk)
    },
    jump: () => {
      if (animMap.jump && !isLocked.current && !isShooting.current)
        playAnim(animMap.jump, false, true)
    },
    drawGun: () => {
      if (!animMap.gun || isLocked.current) return
      if (gunRef.current) gunRef.current.visible = true
      gunEquipped.current = true
      playAnim(animMap.gun, false, true)
    },
    shoot: () => {
      if (!animMap.shoot || isLocked.current) return
      isShooting.current = true
      playAnim(animMap.shoot, false, true)
      shootCallback.current?.()
    },
    setShootCallback: (cb) => { shootCallback.current = cb },
    getGunWorldPosition: () => gunRef.current?.getWorldPosition(new THREE.Vector3()),
    isGunEquipped: () => gunEquipped.current,
    getPosition: () => group.current?.getWorldPosition(new THREE.Vector3()),
    lookAt: (targetVec) => {
      group.current.lookAt(targetVec.x, group.current.position.y, targetVec.z)
    }
  }))

  // ---------------- MOVEMENT ----------------
  useFrame(() => {
    if (!group.current) return
    if (direction.current.length() > 0 && !props.isAiming) {
      const speed = 0.1
      group.current.position.x += direction.current.x * speed
      group.current.position.z += direction.current.z * speed
      const angle = Math.atan2(direction.current.x, direction.current.z)
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, angle, 0.15)
    } else if (props.isAiming) {
      group.current.position.x += direction.current.x * 0.05
      group.current.position.z += direction.current.z * 0.05
    }
  })

  useEffect(() => {
    if (animMap.idle) playAnim(animMap.idle)
  }, [animMap])

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Main_reg">
          <primitive object={nodes.Root} />
          <group name="Body">
            <skinnedMesh name="Body_(merged)" geometry={nodes['Body_(merged)'].geometry} material={materials['N00_000_00_Body_00_SKIN (Instance)']} skeleton={nodes['Body_(merged)'].skeleton} />
            <skinnedMesh name="Body_(merged)_1" geometry={nodes['Body_(merged)_1'].geometry} material={materials['N00_000_00_HairBack_00_HAIR (Instance)']} skeleton={nodes['Body_(merged)_1'].skeleton} />
            <skinnedMesh name="Body_(merged)_2" geometry={nodes['Body_(merged)_2'].geometry} material={materials['N00_007_01_Tops_01_CLOTH_01 (Instance)']} skeleton={nodes['Body_(merged)_2'].skeleton} />
            <skinnedMesh name="Body_(merged)_3" geometry={nodes['Body_(merged)_3'].geometry} material={materials['N00_010_01_Onepiece_00_CLOTH (Instance)']} skeleton={nodes['Body_(merged)_3'].skeleton} />
            <skinnedMesh name="Body_(merged)_4" geometry={nodes['Body_(merged)_4'].geometry} material={materials['N00_007_01_Tops_01_CLOTH_02 (Instance)']} skeleton={nodes['Body_(merged)_4'].skeleton} />
            <skinnedMesh name="Body_(merged)_5" geometry={nodes['Body_(merged)_5'].geometry} material={materials['N00_008_01_Shoes_01_CLOTH (Instance)']} skeleton={nodes['Body_(merged)_5'].skeleton} />
          </group>
          <skinnedMesh name="Hair" geometry={nodes.Hair.geometry} material={materials['N00_000_Hair_00_HAIR (Instance)']} skeleton={nodes.Hair.skeleton} />
          <group name="Face">
            <skinnedMesh name="Face_(merged)(Clone)" geometry={nodes['Face_(merged)(Clone)'].geometry} material={materials['N00_000_00_FaceMouth_00_FACE (Instance)']} skeleton={nodes['Face_(merged)(Clone)'].skeleton} morphTargetDictionary={nodes['Face_(merged)(Clone)'].morphTargetDictionary} morphTargetInfluences={nodes['Face_(merged)(Clone)'].morphTargetInfluences} />
            <skinnedMesh name="Face_(merged)(Clone)_1" geometry={nodes['Face_(merged)(Clone)_1'].geometry} material={materials['N00_000_00_EyeIris_00_EYE (Instance)']} skeleton={nodes['Face_(merged)(Clone)_1'].skeleton} morphTargetDictionary={nodes['Face_(merged)(Clone)_1'].morphTargetDictionary} morphTargetInfluences={nodes['Face_(merged)(Clone)_1'].morphTargetInfluences} />
            <skinnedMesh name="Face_(merged)(Clone)_2" geometry={nodes['Face_(merged)(Clone)_2'].geometry} material={materials['N00_000_00_EyeHighlight_00_EYE (Instance)']} skeleton={nodes['Face_(merged)(Clone)_2'].skeleton} morphTargetDictionary={nodes['Face_(merged)(Clone)_2'].morphTargetDictionary} morphTargetInfluences={nodes['Face_(merged)(Clone)_2'].morphTargetInfluences} />
            <skinnedMesh name="Face_(merged)(Clone)_3" geometry={nodes['Face_(merged)(Clone)_3'].geometry} material={materials['N00_000_00_Face_00_SKIN (Instance)']} skeleton={nodes['Face_(merged)(Clone)_3'].skeleton} morphTargetDictionary={nodes['Face_(merged)(Clone)_3'].morphTargetDictionary} morphTargetInfluences={nodes['Face_(merged)(Clone)_3'].morphTargetInfluences} />
            <skinnedMesh name="Face_(merged)(Clone)_4" geometry={nodes['Face_(merged)(Clone)_4'].geometry} material={materials['N00_000_00_EyeWhite_00_EYE (Instance)']} skeleton={nodes['Face_(merged)(Clone)_4'].skeleton} morphTargetDictionary={nodes['Face_(merged)(Clone)_4'].morphTargetDictionary} morphTargetInfluences={nodes['Face_(merged)(Clone)_4'].morphTargetInfluences} />
            <skinnedMesh name="Face_(merged)(Clone)_5" geometry={nodes['Face_(merged)(Clone)_5'].geometry} material={materials['N00_000_00_FaceBrow_00_FACE (Instance)']} skeleton={nodes['Face_(merged)(Clone)_5'].skeleton} morphTargetDictionary={nodes['Face_(merged)(Clone)_5'].morphTargetDictionary} morphTargetInfluences={nodes['Face_(merged)(Clone)_5'].morphTargetInfluences} />
            <skinnedMesh name="Face_(merged)(Clone)_6" geometry={nodes['Face_(merged)(Clone)_6'].geometry} material={materials['N00_000_00_FaceEyeline_00_FACE (Instance)']} skeleton={nodes['Face_(merged)(Clone)_6'].skeleton} morphTargetDictionary={nodes['Face_(merged)(Clone)_6'].morphTargetDictionary} morphTargetInfluences={nodes['Face_(merged)(Clone)_6'].morphTargetInfluences} />
          </group>
        </group>
      </group>
    </group>
  )
})

useGLTF.preload('/Male.glb')
useGLTF.preload('/gun.glb')