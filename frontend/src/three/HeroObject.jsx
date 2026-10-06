import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { getInterpolatedState } from './scrollKeyframes';

export default function HeroObject({ scrollProgress }) {
  const groupRef = useRef();
  const capMeshRef = useRef();
  const tasselRef = useRef();
  const orbitGroupRef = useRef();

  // Damped targets
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetRot = useRef(new THREE.Euler(0, 0, 0));
  const targetScale = useRef(new THREE.Vector3(1, 1, 1));
  const targetColor = useRef(new THREE.Color('#990000'));

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const currentState = getInterpolatedState(scrollProgress);

    // Apply gentle idle float
    const idleY = Math.sin(time * 1.8) * 0.08;
    const idleRotY = Math.sin(time * 0.9) * 0.04;
    const idleRotZ = Math.cos(time * 1.2) * 0.03;

    // Target transforms
    targetPos.current.set(
      currentState.position[0],
      currentState.position[1] + idleY,
      currentState.position[2]
    );
    targetRot.current.set(
      currentState.rotation[0] + idleRotZ,
      currentState.rotation[1] + idleRotY,
      currentState.rotation[2]
    );
    targetScale.current.set(
      currentState.scale[0],
      currentState.scale[1],
      currentState.scale[2]
    );
    targetColor.current.set(currentState.color);

    if (groupRef.current) {
      // Lerp position, rotation, scale
      groupRef.current.position.lerp(targetPos.current, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRot.current.x, 0.1);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot.current.y, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRot.current.z, 0.1);
      groupRef.current.scale.lerp(targetScale.current, 0.1);
    }

    // Dynamic tassel pendulum sway
    if (tasselRef.current) {
      tasselRef.current.rotation.z = Math.sin(time * 3.0) * 0.15;
    }

    // Role orbit spin
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = time * 1.2;
    }
  });

  const state = getInterpolatedState(scrollProgress);
  const clayColor = state.color;
  const splitAmount = state.split;

  return (
    <group ref={groupRef}>
      {/* MAIN GRADUATION CAP GEOMETRY */}
      <group visible={splitAmount < 0.95}>
        {/* Mortarboard Flat Top */}
        <RoundedBox args={[2.5, 0.16, 2.5]} radius={0.06} smoothness={4} position={[0, 0.35, 0]}>
          <meshStandardMaterial
            color={clayColor}
            roughness={0.82}
            metalness={0.05}
          />
        </RoundedBox>

        {/* Skull Cap Base */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.9, 0.75, 0.6, 32]} />
          <meshStandardMaterial
            color={clayColor}
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>

        {/* Cap Button on Top in Regal Symbiosis Gold */}
        <mesh position={[0, 0.48, 0]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial
            color="#D4AF37"
            roughness={0.65}
            metalness={0.25}
          />
        </mesh>

        {/* Tassel Cord & Dangling Fringe (Regal Symbiosis Gold #D4AF37) */}
        <group ref={tasselRef} position={[0, 0.46, 0]}>
          {/* Cord Ribbon */}
          <mesh position={[0.7, -0.15, 0.7]} rotation={[0.4, 0, -0.6]}>
            <cylinderGeometry args={[0.035, 0.035, 1.2, 12]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.65} metalness={0.2} />
          </mesh>
          {/* Tassel End Puff */}
          <mesh position={[1.25, -0.65, 1.25]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh position={[1.25, -0.85, 1.25]}>
            <cylinderGeometry args={[0.1, 0.15, 0.35, 16]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.75} metalness={0.2} />
          </mesh>
        </group>
      </group>

      {/* 4 ORBITING CLAY BLOBS (SIU Red & Gold Stakeholder Blobs) */}
      {splitAmount > 0.05 && (
        <group ref={orbitGroupRef} position={[0, 0.2, 0]}>
          {/* Student Blob (SIU Deep Red) */}
          <mesh position={[Math.cos(0) * (1.8 * splitAmount), 0, Math.sin(0) * (1.8 * splitAmount)]}>
            <sphereGeometry args={[0.38, 24, 24]} />
            <meshStandardMaterial color="#990000" roughness={0.82} />
          </mesh>
          {/* Guide Blob (Symbiosis Regal Gold) */}
          <mesh position={[Math.cos(Math.PI * 0.5) * (1.8 * splitAmount), 0, Math.sin(Math.PI * 0.5) * (1.8 * splitAmount)]}>
            <sphereGeometry args={[0.42, 24, 24]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.75} metalness={0.15} />
          </mesh>
          {/* Coordinator Blob (Deep Crimson Maroon) */}
          <mesh position={[Math.cos(Math.PI) * (1.8 * splitAmount), 0, Math.sin(Math.PI) * (1.8 * splitAmount)]}>
            <sphereGeometry args={[0.46, 24, 24]} />
            <meshStandardMaterial color="#7A0000" roughness={0.82} />
          </mesh>
          {/* Panel Blob (Warm Terracotta Rose) */}
          <mesh position={[Math.cos(Math.PI * 1.5) * (1.8 * splitAmount), 0, Math.sin(Math.PI * 1.5) * (1.8 * splitAmount)]}>
            <sphereGeometry args={[0.36, 24, 24]} />
            <meshStandardMaterial color="#C2410C" roughness={0.82} />
          </mesh>
        </group>
      )}
    </group>
  );
}
