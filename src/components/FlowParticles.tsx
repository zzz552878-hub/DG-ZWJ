import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Parameters, RiskMode } from "../types";
import { normalize } from "../utils/engineering";

interface FlowParticlesProps {
  paths: THREE.Vector3[][];
  isPlaying: boolean;
  operationProgress: number;
  parameters: Parameters;
  riskMode: RiskMode;
}

const dummy = new THREE.Object3D();

export function FlowParticles({ paths, isPlaying, operationProgress, parameters, riskMode }: FlowParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const curves = useMemo(() => paths.map((points) => new THREE.CatmullRomCurve3(points)), [paths]);

  const particles = useMemo(() => {
    const items: Array<{ pathIndex: number; offset: number; scale: number }> = [];
    curves.forEach((_, pathIndex) => {
      const count = pathIndex === 0 ? 26 : 8;
      for (let i = 0; i < count; i += 1) {
        items.push({ pathIndex, offset: i / count, scale: 0.65 + ((i + pathIndex) % 4) * 0.12 });
      }
    });
    return items;
  }, [curves]);

  const color = riskMode === "high" ? "#d8bf86" : riskMode === "low" ? "#9db9c8" : "#c7d8dc";
  const emissive = riskMode === "high" ? "#a87932" : "#7fb6c6";
  const speed = 0.08 + normalize(parameters.flow, 120, 420) * 0.28 + normalize(parameters.pressure, 0.1, 0.75) * 0.12;

  useFrame((_, delta) => {
    timeRef.current += delta * (isPlaying ? speed : 0.01);
    const mesh = meshRef.current;
    if (!mesh) return;

    particles.forEach((particle, index) => {
      const curve = curves[particle.pathIndex];
      const stageFlow = normalize(operationProgress, 0.35, 0.82);
      const t = (stageFlow * 1.8 + timeRef.current + particle.offset) % 1;
      const point = curve.getPointAt(t);
      dummy.position.copy(point);
      dummy.scale.setScalar(0.06 * particle.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]} castShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.55} roughness={0.28} />
    </instancedMesh>
  );
}
