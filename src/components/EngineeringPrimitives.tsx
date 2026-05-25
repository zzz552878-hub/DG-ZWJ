import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

interface TubePathProps {
  points: THREE.Vector3[];
  radius: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

export function TubePath({
  points,
  radius,
  color,
  emissive = "#000000",
  emissiveIntensity = 0,
  opacity = 1,
  onClick
}: TubePathProps) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 90, radius, 14, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow onClick={onClick}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={0.45}
        opacity={opacity}
        roughness={0.26}
        transparent={opacity < 1}
      />
    </mesh>
  );
}

interface CylinderBetweenProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
  color: string;
  opacity?: number;
  metalness?: number;
}

export function CylinderBetween({
  start,
  end,
  radius,
  color,
  opacity = 1,
  metalness = 0.35
}: CylinderBetweenProps) {
  const { midpoint, length, quaternion } = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const len = direction.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return { midpoint: mid, length: len, quaternion: quat };
  }, [end, start]);

  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 14]} />
      <meshStandardMaterial color={color} metalness={metalness} opacity={opacity} roughness={0.32} transparent={opacity < 1} />
    </mesh>
  );
}

export function EngineeringFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, -2.55, -0.45]} receiveShadow>
        <planeGeometry args={[12, 9]} />
        <meshStandardMaterial color="#1a2b35" roughness={0.86} metalness={0.05} />
      </mesh>
      <gridHelper args={[12, 24, "#47667a", "#233d4d"]} position={[0.6, -2.535, -0.45]} />
      {[-0.42, 0.42].map((z) => (
        <CylinderBetween
          key={z}
          start={new THREE.Vector3(-4.8, -2.49, z)}
          end={new THREE.Vector3(4.8, -2.49, z)}
          radius={0.025}
          color="#30383d"
          metalness={0.74}
        />
      ))}
      {[-2.8, -1.6, -0.4, 0.8, 2.0, 3.2].map((x) => (
        <mesh key={x} position={[x, -2.48, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.08, 1.18, 0.035]} />
          <meshStandardMaterial color="#4d3a2d" roughness={0.82} metalness={0.05} />
        </mesh>
      ))}
      {[
        [-2.2, -2.485, -2.15, 0.64, 0.22],
        [1.7, -2.484, -2.45, 0.8, 0.18],
        [-0.2, -2.484, 2.05, 0.55, 0.16]
      ].map((item, index) => (
        <mesh
          key={index}
          position={[item[0], item[1], item[2]] as [number, number, number]}
          rotation={[-Math.PI / 2, 0, index * 0.35]}
          scale={[item[3], item[4], 1] as [number, number, number]}
          receiveShadow
        >
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial color="#5a4c3e" opacity={0.42} roughness={1} transparent />
        </mesh>
      ))}
      <mesh position={[-4.65, -2.08, 1.85]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.52, 0.34, 0.025]} />
        <meshStandardMaterial color="#d9a72f" roughness={0.46} metalness={0.12} />
      </mesh>
      <mesh position={[-4.65, -2.08, 1.865]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.34, 0.045, 0.012]} />
        <meshStandardMaterial color="#1b252d" roughness={0.5} />
      </mesh>
    </group>
  );
}
