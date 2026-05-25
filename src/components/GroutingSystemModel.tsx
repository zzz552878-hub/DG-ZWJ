import { Html, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { modelSources } from "../data/modelSources";
import type { ComponentId, Parameters, PartId, RiskMode } from "../types";
import { normalize } from "../utils/engineering";
import { CylinderBetween, TubePath } from "./EngineeringPrimitives";
import { FlowParticles } from "./FlowParticles";
import { ModelLoader } from "./ModelLoader";
import { SceneHotspot } from "./SceneHotspot";

interface GroutingSystemModelProps {
  selected: ComponentId;
  explosion: number;
  parameters: Parameters;
  riskMode: RiskMode;
  isPlaying: boolean;
  highlightedParts: PartId[];
  operationProgress: number;
  onSelect: (id: ComponentId) => void;
}

function offset(value: [number, number, number], explosion: number): [number, number, number] {
  return [value[0] * explosion, value[1] * explosion, value[2] * explosion];
}

function selectPart(onSelect: (id: ComponentId) => void, id: ComponentId) {
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(id);
  };
}

function glow(selected: ComponentId, id: ComponentId) {
  return selected === id ? 0.72 : 0;
}

function partBoost(highlightedParts: PartId[], partId: PartId) {
  return highlightedParts.includes(partId) ? 0.78 : 0;
}

function dimOpacity(base: number, highlightedParts: PartId[], partId: PartId) {
  if (!highlightedParts.length || highlightedParts.includes(partId)) return base;
  return Math.max(0.28, base * 0.64);
}

function slurryColor(riskMode: RiskMode) {
  if (riskMode === "high") return "#d7bd82";
  if (riskMode === "low") return "#a8bcc8";
  return "#c6d6dc";
}

function Gauge({
  position,
  value,
  selected,
  onClick
}: {
  position: [number, number, number];
  value: string;
  selected: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <group position={position} onClick={onClick}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.05, 40]} />
        <meshStandardMaterial
          color="#f3f5ef"
          emissive="#b9f1ff"
          emissiveIntensity={selected ? 0.55 : 0.12}
          metalness={0.18}
          roughness={0.26}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, -0.6]} position={[0, 0.032, 0]}>
        <boxGeometry args={[0.012, 0.12, 0.012]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => {
        const angle = -2.25 + index * 0.56;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.155, 0.035, Math.sin(angle) * 0.155]} rotation={[Math.PI / 2, 0, -angle]}>
            <boxGeometry args={[0.01, index % 2 === 0 ? 0.035 : 0.024, 0.006]} />
            <meshStandardMaterial color="#1e2528" roughness={0.5} />
          </mesh>
        );
      })}
      <Html position={[0, 0.18, 0.05]} center distanceFactor={9}>
        <div className="gauge-label">{value}</div>
      </Html>
    </group>
  );
}

function Flange({ position, radius = 0.15 }: { position: [number, number, number]; radius?: number }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.014, 8, 28]} />
        <meshStandardMaterial color="#343d42" metalness={0.62} roughness={0.36} />
      </mesh>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = (index / 6) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.025, 8]} />
            <meshStandardMaterial color="#171b1e" metalness={0.7} roughness={0.32} />
          </mesh>
        );
      })}
    </group>
  );
}

function GuardRail({ x, z, width }: { x: number; z: number; width: number }) {
  return (
    <group>
      <CylinderBetween start={new THREE.Vector3(x - width / 2, -1.02, z)} end={new THREE.Vector3(x + width / 2, -1.02, z)} radius={0.018} color="#d9a72f" metalness={0.36} />
      <CylinderBetween start={new THREE.Vector3(x - width / 2, -1.32, z)} end={new THREE.Vector3(x - width / 2, -1.02, z)} radius={0.016} color="#d9a72f" metalness={0.36} />
      <CylinderBetween start={new THREE.Vector3(x + width / 2, -1.32, z)} end={new THREE.Vector3(x + width / 2, -1.02, z)} radius={0.016} color="#d9a72f" metalness={0.36} />
    </group>
  );
}

function DirectionArrow({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <coneGeometry args={[0.07, 0.2, 18]} />
      <meshStandardMaterial color="#c8d6d9" emissive="#a8c8cf" emissiveIntensity={0.16} roughness={0.52} />
    </mesh>
  );
}

export function GroutingSystemModel({
  selected,
  explosion,
  parameters,
  riskMode,
  isPlaying,
  highlightedParts,
  operationProgress,
  onSelect
}: GroutingSystemModelProps) {
  const mixerRef = useRef<THREE.Group>(null);
  const pumpStrokeRef = useRef<THREE.Group>(null);

  const ports = useMemo(() => {
    const angles = Array.from({ length: 8 }, (_, index) => (index / 8) * Math.PI * 2 + Math.PI / 10);
    return angles.map((angle) => new THREE.Vector3(0.84, Math.cos(angle) * 2.13, Math.sin(angle) * 2.13));
  }, []);

  const paths = useMemo(() => {
    const mixToStorage = [
      new THREE.Vector3(-4.3, -1.38, -4.08),
      new THREE.Vector3(-3.72, -1.35, -4.08),
      new THREE.Vector3(-3.22, -1.34, -4.08)
    ];
    const storageToPump = [
      new THREE.Vector3(-2.65, -1.36, -4.08),
      new THREE.Vector3(-2.05, -1.36, -4.08),
      new THREE.Vector3(-1.55, -1.5, -4.08)
    ];
    const pumpToValve = [
      new THREE.Vector3(-0.75, -1.42, -4.05),
      new THREE.Vector3(-0.25, -1.35, -3.88),
      new THREE.Vector3(0.2, -1.08, -3.62)
    ];
    const valveToRing = [
      new THREE.Vector3(0.2, -1.08, -3.62),
      new THREE.Vector3(0.48, -0.55, -3.12),
      new THREE.Vector3(0.68, -0.08, -2.42),
      new THREE.Vector3(0.72, -1.38, -1.62)
    ];
    const branchPaths = ports.map((port) => {
      const manifold = new THREE.Vector3(0.72, port.y * 0.88, port.z * 0.88);
      return [
        new THREE.Vector3(0.72, -1.38, -1.62),
        new THREE.Vector3(0.72, manifold.y, manifold.z),
        new THREE.Vector3(port.x, port.y, port.z)
      ];
    });
    return { mixToStorage, storageToPump, pumpToValve, valveToRing, branchPaths };
  }, [ports]);

  const allFlowPaths = useMemo(
    () => [paths.mixToStorage, paths.storageToPump, paths.pumpToValve, paths.valveToRing, ...paths.branchPaths],
    [paths]
  );

  const flowGlow = 0.12 + normalize(parameters.flow, 120, 420) * 0.8 + (isPlaying ? 0.35 : 0);
  const liquid = slurryColor(riskMode);
  const materialStage = normalize(operationProgress, 0, 0.12);
  const storageStage = normalize(operationProgress, 0.25, 0.35);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.rotation.y = operationProgress > 0 ? operationProgress * Math.PI * 24 : mixerRef.current.rotation.y + delta * 0.25;
    }
    if (pumpStrokeRef.current) {
      const stroke = Math.sin(operationProgress * Math.PI * 32) * 0.08 * (operationProgress > 0.35 ? 1 : 0.2);
      pumpStrokeRef.current.children.forEach((child, index) => {
        child.position.x = stroke * (index % 2 === 0 ? 1 : -1);
      });
    }
  });

  return (
    <group>
      <group visible={operationProgress < 0.16 || highlightedParts.includes("rawMaterials")}>
        {["#c8c2aa", "#9a8a6d", "#d6d0bd", "#9eb2bd", "#f1d085"].map((color, index) => (
          <mesh
            key={color}
            position={[-5.12 + materialStage * 0.7 + index * 0.08, -0.72 - index * 0.03, -4.08 + (index - 2) * 0.08]}
            castShadow
          >
            <sphereGeometry args={[0.04 + index * 0.003, 12, 8]} />
            <meshStandardMaterial color={color} emissive={highlightedParts.includes("rawMaterials") ? "#ffd36b" : "#000"} emissiveIntensity={highlightedParts.includes("rawMaterials") ? 0.35 : 0} roughness={0.9} />
          </mesh>
        ))}
      </group>

      <ModelLoader
        src={modelSources.mixingTank}
        position={offset([-1.42, 0.12, -0.88], explosion)}
        onClick={selectPart(onSelect, "mixingTank")}
        fallback={
          <>
            <mesh position={[-4.35, -1.55, -4.08]} castShadow receiveShadow>
              <cylinderGeometry args={[0.62, 0.7, 1.78, 56]} />
              <meshStandardMaterial
                color="#c6d1d2"
                emissive="#7fdaf0"
                emissiveIntensity={glow(selected, "mixingTank") * 0.55 + partBoost(highlightedParts, "mixingTank")}
                metalness={0.5}
                opacity={dimOpacity(1, highlightedParts, "mixingTank")}
                roughness={0.42}
                transparent={highlightedParts.length > 0}
              />
            </mesh>
            <mesh position={[-4.35, -0.54, -4.08]} castShadow>
              <cylinderGeometry args={[0.24, 0.32, 0.25, 32]} />
              <meshStandardMaterial color="#354955" emissive="#69e1ff" emissiveIntensity={partBoost(highlightedParts, "mixingMotor") * 0.6} metalness={0.64} roughness={0.28} />
            </mesh>
            <mesh position={[-4.78, -0.72, -4.08]} rotation={[0, 0, -0.45]} castShadow>
              <cylinderGeometry args={[0.18, 0.3, 0.38, 4]} />
              <meshStandardMaterial color="#73818a" metalness={0.36} roughness={0.46} />
            </mesh>
            <group ref={mixerRef} position={[-4.35, -1.55, -4.08]}>
              <CylinderBetween start={new THREE.Vector3(0, 0.84, 0)} end={new THREE.Vector3(0, -0.72, 0)} radius={0.026} color="#202a2e" metalness={0.5} />
              {[-0.45, -0.12, 0.2].map((y) =>
                [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].map((angle) => (
                  <mesh key={`${y}-${angle}`} position={[Math.cos(angle) * 0.18, y, Math.sin(angle) * 0.18]} rotation={[0, angle, 0.24]}>
                    <boxGeometry args={[0.48, 0.036, 0.1]} />
                    <meshStandardMaterial color="#1d333d" emissive="#ffd36b" emissiveIntensity={partBoost(highlightedParts, "mixingShaft") * 0.45} metalness={0.48} roughness={0.38} />
                  </mesh>
                ))
              )}
            </group>
            {[-4.8, -3.9].map((x) => (
              <CylinderBetween key={x} start={new THREE.Vector3(x, -2.45, -3.65)} end={new THREE.Vector3(x, -1.98, -3.65)} radius={0.028} color="#6c777d" metalness={0.45} />
            ))}
            <Text position={[-4.35, -2.62, -4.08]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#dff8ff" anchorX="center">
              搅拌制浆系统
            </Text>
          </>
        }
      />

      <ModelLoader
        src={modelSources.slurryTank}
        position={offset([-0.72, 0.05, -0.82], explosion)}
        onClick={selectPart(onSelect, "storageTank")}
        fallback={
          <>
            <mesh position={[-2.72, -1.48, -4.08]} castShadow receiveShadow>
              <cylinderGeometry args={[0.64, 0.64, 1.62, 56]} />
              <meshStandardMaterial
                color="#aebabc"
                emissive="#73d8f0"
                emissiveIntensity={glow(selected, "storageTank") * 0.45 + partBoost(highlightedParts, "slurryTank")}
                metalness={0.45}
                opacity={dimOpacity(1, highlightedParts, "slurryTank")}
                roughness={0.5}
                transparent={highlightedParts.length > 0}
              />
            </mesh>
            <mesh position={[-2.72, -0.56, -4.08]}>
              <sphereGeometry args={[0.64, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#c8d2d3" metalness={0.38} roughness={0.42} />
            </mesh>
            <mesh position={[-2.16, -1.45, -4.07]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.025, 24]} />
              <meshStandardMaterial color="#d9eef2" emissive="#b9f1ff" emissiveIntensity={0.15} opacity={0.65} transparent />
            </mesh>
            <CylinderBetween start={new THREE.Vector3(-2.08, -2.05, -3.94)} end={new THREE.Vector3(-2.08, -0.92, -3.94)} radius={0.018} color="#b9f1ff" opacity={0.64} metalness={0.08} />
            <mesh position={[-2.72, -1.92, -4.08]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.34 + storageStage * 0.24, 0.03, 10, 56]} />
              <meshStandardMaterial color={liquid} emissive={liquid} emissiveIntensity={0.16} opacity={0.48} transparent />
            </mesh>
            <Text position={[-2.72, -2.58, -4.08]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#dff8ff" anchorX="center">
              储浆罐
            </Text>
          </>
        }
      />

      <ModelLoader
        src={modelSources.groutPump}
        position={offset([0.12, -0.08, -1.0], explosion)}
        onClick={selectPart(onSelect, "groutPump")}
        fallback={
          <>
            <mesh position={[-1.05, -2.21, -4.04]} castShadow receiveShadow>
              <boxGeometry args={[1.78, 0.26, 0.86]} />
              <meshStandardMaterial color="#253944" metalness={0.55} roughness={0.42} />
            </mesh>
            <mesh position={[-1.44, -1.62, -4.04]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.28, 0.74, 36]} />
              <meshStandardMaterial color="#334b58" metalness={0.62} roughness={0.35} />
            </mesh>
            <mesh position={[-0.5, -1.62, -4.04]} castShadow receiveShadow>
              <boxGeometry args={[0.72, 0.48, 0.54]} />
              <meshStandardMaterial color="#546b76" emissive="#7edff2" emissiveIntensity={glow(selected, "groutPump") * 0.6 + partBoost(highlightedParts, "groutPump")} metalness={0.62} roughness={0.32} />
            </mesh>
            <mesh position={[-0.92, -1.62, -4.04]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.32, 28]} />
              <meshStandardMaterial color="#1f2528" metalness={0.7} roughness={0.28} />
            </mesh>
            <group ref={pumpStrokeRef} position={[-0.48, -1.62, -4.04]}>
              {[-0.16, 0.16].map((z) => (
                <mesh key={z} position={[0, 0.08, z]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.055, 0.055, 0.62, 24]} />
                  <meshStandardMaterial color="#dce8e9" metalness={0.78} roughness={0.2} />
                </mesh>
              ))}
            </group>
            <Text position={[-1.05, -2.58, -4.04]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#dff8ff" anchorX="center">
              注浆泵 / 电机 / 联轴器
            </Text>
          </>
        }
      />

      <ModelLoader
        src={modelSources.valveGroup}
        position={offset([0.58, 0.0, -0.88], explosion * 0.82)}
        onClick={selectPart(onSelect, "valve")}
        fallback={
          <>
            <mesh position={[0.2, -1.08, -3.62]} castShadow>
              <boxGeometry args={[0.52, 0.22, 0.28]} />
              <meshStandardMaterial color="#30383d" emissive="#ffd36b" emissiveIntensity={glow(selected, "valve") * 0.35 + partBoost(highlightedParts, "valveGroup")} metalness={0.66} roughness={0.36} />
            </mesh>
            {[-0.18, 0.02, 0.22].map((dx, index) => (
              <group key={dx} position={[0.2 + dx, -0.92, -3.62 + (index - 1) * 0.08]}>
                <mesh>
                  <sphereGeometry args={[0.105, 20, 16]} />
                  <meshStandardMaterial color="#2a3033" metalness={0.62} roughness={0.32} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.16, 0.014, 8, 32]} />
                  <meshStandardMaterial color="#d9a72f" metalness={0.45} roughness={0.28} />
                </mesh>
              </group>
            ))}
            <Text position={[0.2, -0.65, -3.62]} fontSize={0.12} color="#ffd36b" anchorX="center">
              分配阀组
            </Text>
          </>
        }
      />

      <ModelLoader
        src={modelSources.controlCabinet}
        position={offset([0.35, -0.02, -1.1], explosion)}
        onClick={selectPart(onSelect, "controlCabinet")}
        fallback={
          <>
            <mesh position={[-0.08, -1.62, -4.82]} castShadow receiveShadow>
              <boxGeometry args={[0.58, 1.12, 0.24]} />
              <meshStandardMaterial color="#1b2c37" emissive="#2a6c83" emissiveIntensity={glow(selected, "controlCabinet") * 0.55 + partBoost(highlightedParts, "controlCabinet")} metalness={0.42} roughness={0.44} />
            </mesh>
            <mesh position={[-0.08, -1.32, -4.69]}>
              <boxGeometry args={[0.38, 0.24, 0.014]} />
              <meshStandardMaterial color="#061925" emissive="#65ddf7" emissiveIntensity={0.55} roughness={0.2} />
            </mesh>
            {[-0.22, -0.08, 0.06, 0.2].map((x, index) => (
              <mesh key={x} position={[x, -1.76, -4.68]}>
                <sphereGeometry args={[0.035, 14, 10]} />
                <meshStandardMaterial color={index % 2 === 0 ? "#7ee2a8" : "#ffd36b"} emissive={index % 2 === 0 ? "#7ee2a8" : "#ffd36b"} emissiveIntensity={0.55} />
              </mesh>
            ))}
            <Text position={[-0.08, -0.92, -4.66]} fontSize={0.105} color="#dff8ff" anchorX="center">
              注浆控制柜
            </Text>
          </>
        }
      />

      <ModelLoader
        src={modelSources.groutPipeline}
        position={offset([0, 0.54, -0.42], explosion * 0.55)}
        onClick={selectPart(onSelect, "pipeline")}
        fallback={
          <>
            <TubePath points={paths.mixToStorage} radius={0.065} color="#151a1d" emissive={liquid} emissiveIntensity={flowGlow * 0.18 + partBoost(highlightedParts, "mainPipeline") * 0.35} onClick={selectPart(onSelect, "pipeline")} />
            <TubePath points={paths.storageToPump} radius={0.07} color="#151a1d" emissive={liquid} emissiveIntensity={flowGlow * 0.24 + partBoost(highlightedParts, "mainPipeline") * 0.35} onClick={selectPart(onSelect, "pipeline")} />
            <TubePath points={paths.pumpToValve} radius={0.082} color="#1d86b7" emissive={liquid} emissiveIntensity={flowGlow * 0.44 + partBoost(highlightedParts, "mainPipeline") * 0.45} onClick={selectPart(onSelect, "pipeline")} />
            <TubePath points={paths.valveToRing} radius={0.07} color="#1d86b7" emissive={liquid} emissiveIntensity={flowGlow * 0.5 + partBoost(highlightedParts, "mainPipeline") * 0.45} onClick={selectPart(onSelect, "pipeline")} />
            <mesh rotation={[0, Math.PI / 2, 0]} position={[0.72, 0, 0]}>
              <torusGeometry args={[2.13, 0.046, 12, 128]} />
              <meshStandardMaterial color="#1d86b7" emissive={liquid} emissiveIntensity={flowGlow * 0.3 + partBoost(highlightedParts, "branchPipelines") * 0.4} metalness={0.48} roughness={0.36} />
            </mesh>
            {paths.branchPaths.map((path, index) => (
              <TubePath key={index} points={path} radius={0.038} color="#121719" emissive={liquid} emissiveIntensity={flowGlow * 0.28 + partBoost(highlightedParts, "branchPipelines") * 0.4} onClick={selectPart(onSelect, "pipeline")} />
            ))}
            <DirectionArrow position={[-2.02, -1.36, -4.08]} rotation={[0, 0, -Math.PI / 2]} />
            <DirectionArrow position={[-0.18, -1.2, -3.74]} rotation={[0.35, 0.3, -Math.PI / 2]} />
            <DirectionArrow position={[0.58, -0.62, -2.95]} rotation={[0.62, 0, -0.2]} />
            <DirectionArrow position={[0.74, 1.28, 0.98]} rotation={[0.15, 0, -0.9]} />
            {[
              [-3.22, -1.34, -4.08],
              [-1.55, -1.5, -4.08],
              [-0.75, -1.42, -4.05],
              [0.2, -1.08, -3.62]
            ].map((position, index) => (
              <Flange key={index} position={position as [number, number, number]} />
            ))}
          </>
        }
      />
      <group position={offset([0, 0.54, -0.42], explosion * 0.55)}>
        <FlowParticles paths={allFlowPaths} isPlaying={isPlaying} operationProgress={operationProgress} parameters={parameters} riskMode={riskMode} />
      </group>

      <group position={offset([0.34, 0.42, -0.58], explosion)} onClick={selectPart(onSelect, "pressureGauge")}>
        <Gauge position={[-0.08, -0.92, -3.78]} value={`${parameters.pressure.toFixed(2)} MPa`} selected={selected === "pressureGauge" || highlightedParts.includes("pressureGauge")} onClick={selectPart(onSelect, "pressureGauge")} />
        <Gauge position={[0.64, -0.16, -2.52]} value={`${Math.max(0.05, parameters.pressure - 0.03).toFixed(2)} MPa`} selected={selected === "pressureGauge" || highlightedParts.includes("pressureGauge")} onClick={selectPart(onSelect, "pressureGauge")} />
      </group>

      <group position={offset([0.22, 0.5, -0.62], explosion)} onClick={selectPart(onSelect, "flowMeter")}>
        <mesh position={[-0.32, -1.22, -3.86]} rotation={[0.25, 0.95, 1.42]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.48, 30]} />
          <meshStandardMaterial color="#c7edf2" emissive="#b9f1ff" emissiveIntensity={glow(selected, "flowMeter") + 0.12 + partBoost(highlightedParts, "flowMeter")} opacity={0.48} roughness={0.16} transparent />
        </mesh>
        <Html position={[-0.32, -0.86, -3.72]} center distanceFactor={9}>
          <div className="gauge-label">{Math.round(parameters.flow)} L/min</div>
        </Html>
      </group>

      <group position={offset([0.12, 0.18, 0.52], explosion * 0.55)} onClick={selectPart(onSelect, "injectionPort")}>
        {ports.map((port, index) => {
          const inner = new THREE.Vector3(0.72, port.y * 0.96, port.z * 0.96);
          const outer = new THREE.Vector3(port.x + 0.16, port.y * 1.05, port.z * 1.05);
          const valvePos = new THREE.Vector3(0.72, port.y * 0.78, port.z * 0.78);
          return (
            <group key={index}>
              <CylinderBetween start={inner} end={port} radius={0.04} color="#1d86b7" metalness={0.55} />
              <CylinderBetween start={port} end={outer} radius={0.05} color="#20262a" metalness={0.45} />
              <mesh position={valvePos} castShadow>
                <sphereGeometry args={[0.055, 16, 12]} />
                <meshStandardMaterial color="#2b3134" metalness={0.62} roughness={0.34} />
              </mesh>
              <mesh position={[valvePos.x, valvePos.y * 1.01, valvePos.z * 1.01]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.09, 0.008, 8, 20]} />
                <meshStandardMaterial color="#d9a72f" metalness={0.42} roughness={0.32} />
              </mesh>
              <mesh position={port} castShadow>
                <sphereGeometry args={[0.085, 20, 16]} />
                <meshStandardMaterial color="#30383d" emissive={selected === "injectionPort" || highlightedParts.includes("groutPorts") ? "#ffd36b" : "#000"} emissiveIntensity={selected === "injectionPort" || highlightedParts.includes("groutPorts") ? 0.7 : 0} metalness={0.58} roughness={0.34} />
              </mesh>
              <mesh position={outer} castShadow>
                <coneGeometry args={[0.09, 0.22, 18]} />
                <meshStandardMaterial color={liquid} emissive={liquid} emissiveIntensity={0.18} roughness={0.38} opacity={0.84} transparent />
              </mesh>
            </group>
          );
        })}
      </group>

      <group>
        <mesh position={[-2.55, -2.46, -4.04]} receiveShadow>
          <boxGeometry args={[4.2, 0.06, 1.18]} />
          <meshStandardMaterial color="#263943" metalness={0.36} roughness={0.56} />
        </mesh>
        <GuardRail x={-3.52} z={-3.44} width={1.8} />
        <GuardRail x={-1.15} z={-3.44} width={1.8} />
        {[-3.9, -2.55, -1.18, 0.3].map((x) => (
          <CylinderBetween key={x} start={new THREE.Vector3(x, -2.46, -3.5)} end={new THREE.Vector3(x, -2.46, -4.58)} radius={0.018} color="#465865" metalness={0.45} />
        ))}
      </group>

      <SceneHotspot id="mixingTank" label="搅拌罐" position={[-4.35, 0.08, -4.08]} active={selected === "mixingTank"} onSelect={onSelect} />
      <SceneHotspot id="storageTank" label="储浆罐" position={[-2.72, 0.1, -4.08]} active={selected === "storageTank"} onSelect={onSelect} />
      <SceneHotspot id="groutPump" label="注浆泵" position={[-1.02, -0.68, -4.04]} active={selected === "groutPump"} onSelect={onSelect} />
      <SceneHotspot id="pipeline" label="输浆管路" position={[-0.18, -0.5, -3.34]} active={selected === "pipeline"} onSelect={onSelect} />
      <SceneHotspot id="valve" label="分配阀组" position={[0.24, -0.52, -3.5]} active={selected === "valve"} onSelect={onSelect} />
      <SceneHotspot id="controlCabinet" label="控制柜" position={[-0.08, -0.78, -4.82]} active={selected === "controlCabinet"} onSelect={onSelect} />
      <SceneHotspot id="injectionPort" label="盾尾注浆口" position={[0.94, 2.18, 1.0]} active={selected === "injectionPort"} onSelect={onSelect} />
    </group>
  );
}
