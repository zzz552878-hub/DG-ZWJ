import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { modelSources } from "../data/modelSources";
import type { ComponentId, OpacitySettings, Parameters, PartId, RiskMode, ViewMode } from "../types";
import { classifyRisk, normalize } from "../utils/engineering";
import { CylinderBetween } from "./EngineeringPrimitives";
import { ModelLoader } from "./ModelLoader";
import { SceneHotspot } from "./SceneHotspot";

interface TBMModelProps {
  selected: ComponentId;
  explosion: number;
  viewMode: ViewMode;
  opacity: OpacitySettings;
  parameters: Parameters;
  riskMode: RiskMode;
  isPlaying: boolean;
  highlightedParts: PartId[];
  operationProgress: number;
  onSelect: (id: ComponentId) => void;
}

const segmentCount = 7;
const ringPositions = [0.92, 1.43, 1.94, 2.45, 2.96, 3.47];
const segmentTheta = (Math.PI * 2) / segmentCount;

function offset(value: [number, number, number], explosion: number): [number, number, number] {
  return [value[0] * explosion, value[1] * explosion, value[2] * explosion];
}

function selectPart(onSelect: (id: ComponentId) => void, id: ComponentId) {
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(id);
  };
}

function materialBoost(selected: ComponentId, id: ComponentId) {
  return selected === id ? 0.62 : 0;
}

function partBoost(highlightedParts: PartId[], partId: PartId) {
  return highlightedParts.includes(partId) ? 0.68 : 0;
}

function dimOpacity(base: number, highlightedParts: PartId[], partId: PartId) {
  if (!highlightedParts.length || highlightedParts.includes(partId)) return base;
  return Math.max(0.18, base * 0.58);
}

function groutColor(riskMode: RiskMode) {
  if (riskMode === "high") return "#d8c08d";
  if (riskMode === "low") return "#9db7c8";
  return "#bccdd4";
}

function coneQuaternion(start: THREE.Vector3, end: THREE.Vector3) {
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
}

function CutawayArrow({
  start,
  end,
  label
}: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}) {
  const startVector = new THREE.Vector3(...start);
  const endVector = new THREE.Vector3(...end);
  return (
    <group>
      <CylinderBetween start={startVector} end={endVector} radius={0.01} color="#b9f1ff" opacity={0.88} metalness={0.1} />
      <mesh position={endVector} quaternion={coneQuaternion(startVector, endVector)}>
        <coneGeometry args={[0.045, 0.14, 16]} />
        <meshBasicMaterial color="#b9f1ff" />
      </mesh>
      <Text position={start} fontSize={0.115} color="#eaf8ff" anchorX="center" maxWidth={1.05}>
        {label}
      </Text>
    </group>
  );
}

function SegmentRing({
  x,
  ringIndex,
  selected,
  opacity,
  operation
}: {
  x: number;
  ringIndex: number;
  selected: ComponentId;
  opacity: number;
  operation: boolean;
}) {
  const pulse = operation && ringIndex === Math.min(ringPositions.length - 1, Math.floor((Date.now() / 1000) % ringPositions.length));

  return (
    <group position={[x, 0, 0]}>
      {Array.from({ length: segmentCount }, (_, segmentIndex) => {
        const theta = segmentIndex * segmentTheta + 0.018;
        const centerTheta = theta + segmentTheta / 2;
        const y = Math.cos(centerTheta) * 1.64;
        const z = Math.sin(centerTheta) * 1.64;
        const isKeySegment = segmentIndex === 0;
        return (
          <group key={segmentIndex}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[2.0, 2.0, 0.46, 18, 1, true, theta, segmentTheta - 0.036]} />
              <meshStandardMaterial
                color={isKeySegment ? "#c4b58e" : pulse ? "#dad6c9" : "#b9b8b0"}
                emissive="#69e1ff"
                emissiveIntensity={selected === "segmentRing" ? 0.28 : pulse ? 0.1 : 0}
                metalness={0.02}
                opacity={opacity}
                roughness={0.94}
                transparent={opacity < 1}
              />
            </mesh>

            <mesh position={[0.236, y, z]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.012, 18]} />
              <meshStandardMaterial color="#333a3b" roughness={0.78} />
            </mesh>
            <mesh position={[-0.236, y, z]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.012, 18]} />
              <meshStandardMaterial color="#333a3b" roughness={0.78} />
            </mesh>
            <mesh position={[0, Math.cos(centerTheta) * 1.84, Math.sin(centerTheta) * 1.84]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.014, 16]} />
              <meshStandardMaterial color="#23323a" emissive="#304b5a" emissiveIntensity={0.1} roughness={0.7} />
            </mesh>
            <mesh position={[0.01, Math.cos(centerTheta) * 1.55, Math.sin(centerTheta) * 1.55]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.02, isKeySegment ? 0.22 : 0.16, isKeySegment ? 0.1 : 0.075]} />
              <meshStandardMaterial color="#626761" opacity={0.42} roughness={0.96} transparent />
            </mesh>
            {[0.28, 0.58, 0.78].map((factor, patchIndex) => (
              <mesh
                key={factor}
                position={[
                  0.18 - patchIndex * 0.17,
                  Math.cos(theta + segmentTheta * factor) * 1.93,
                  Math.sin(theta + segmentTheta * factor) * 1.93
                ]}
                rotation={[0, Math.PI / 2, 0]}
              >
                <boxGeometry args={[0.012, 0.065, 0.028]} />
                <meshStandardMaterial color={patchIndex % 2 === 0 ? "#8f918a" : "#d0cdc1"} opacity={0.24} roughness={1} transparent />
              </mesh>
            ))}
          </group>
        );
      })}

      {Array.from({ length: segmentCount }, (_, boundaryIndex) => {
        const angle = boundaryIndex * segmentTheta;
        const y = Math.cos(angle) * 2.01;
        const z = Math.sin(angle) * 2.01;
        return (
          <CylinderBetween
            key={boundaryIndex}
            start={new THREE.Vector3(-0.23, y, z)}
            end={new THREE.Vector3(0.23, y, z)}
            radius={0.008}
            color="#3b4242"
            metalness={0.08}
          />
        );
      })}

      {[-0.235, 0.235].map((edge) => (
        <group key={edge} position={[edge, 0, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[2.006, 0.01, 8, 112]} />
            <meshStandardMaterial color="#303637" roughness={0.72} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1.78, 0.012, 8, 112]} />
            <meshStandardMaterial color="#2a3132" roughness={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function TBMModel({
  selected,
  explosion,
  viewMode,
  opacity,
  parameters,
  riskMode,
  isPlaying,
  highlightedParts,
  operationProgress,
  onSelect
}: TBMModelProps) {
  const shieldRef = useRef<THREE.Group>(null);
  const risk = classifyRisk(parameters, riskMode);
  const cutaway = viewMode === "cutaway";
  const operation = viewMode === "operation";
  const soilTheta = cutaway ? Math.PI * 1.5 : Math.PI * 2;
  const soilThetaStart = cutaway ? Math.PI * 0.18 : 0;
  const groutIntensity = 0.15 + normalize(parameters.pressure, 0.1, 0.75) * 0.75;

  const brushSegments = useMemo(
    () =>
      [0.46, 0.64, 0.82].flatMap((x, ringIndex) =>
        Array.from({ length: 72 }, (_, index) => {
          const angle = (index / 72) * Math.PI * 2;
          const lean = ringIndex * 0.035;
          return {
            start: new THREE.Vector3(x, Math.cos(angle) * 2.15, Math.sin(angle) * 2.15),
            end: new THREE.Vector3(x + lean, Math.cos(angle + 0.018) * 1.88, Math.sin(angle + 0.018) * 1.88)
          };
        })
      ),
    []
  );

  const soilParticles = useMemo(
    () =>
      Array.from({ length: 110 }, (_, index) => {
        const t = index * 12.9898;
        const x = -2.85 + ((Math.sin(t) * 43758.5453) % 1) * 6.9;
        const angle = ((Math.sin(t * 1.91) + 1) / 2) * Math.PI * 1.42 + Math.PI * 0.2;
        const radius = 3.02 + ((Math.cos(t * 0.74) + 1) / 2) * 0.12;
        return {
          position: [x, Math.cos(angle) * radius, Math.sin(angle) * radius] as [number, number, number],
          scale: 0.012 + ((index % 5) + 1) * 0.006
        };
      }),
    []
  );

  useFrame((state) => {
    if (shieldRef.current) {
      const advance = isPlaying || operation ? Math.sin(state.clock.elapsedTime * 0.62) * 0.05 : 0;
      shieldRef.current.position.x = -0.16 * normalize(parameters.advanceSpeed, 15, 65) + advance;
    }
  });

  return (
    <group>
      <group position={offset([0, -0.44, 0], explosion * 0.35)} onClick={selectPart(onSelect, "soilLayer")}>
        {[
          { x: -1.65, width: 2.4, color: "#766047" },
          { x: 0.72, width: 2.34, color: "#8a7357" },
          { x: 3.04, width: 2.3, color: "#67513d" }
        ].map((layer) => (
          <mesh key={layer.x} rotation={[0, 0, Math.PI / 2]} position={[layer.x, 0, 0]} receiveShadow>
            <cylinderGeometry args={[3.12, 3.12, layer.width, 96, 1, true, soilThetaStart, soilTheta]} />
            <meshStandardMaterial
              color={layer.color}
              metalness={0.02}
              opacity={Math.min(opacity.soil, cutaway ? 0.38 : opacity.soil)}
              roughness={0.98}
              transparent
            />
          </mesh>
        ))}
        {soilParticles.map((particle, index) => (
          <mesh key={index} position={particle.position}>
            <sphereGeometry args={[particle.scale, 8, 6]} />
            <meshStandardMaterial color={index % 3 === 0 ? "#a18360" : "#5f4a38"} roughness={1} />
          </mesh>
        ))}
        <mesh position={[1.25, -2.93, 0]} receiveShadow>
          <boxGeometry args={[8.6, 0.46, 6.55]} />
          <meshStandardMaterial color="#594533" opacity={0.78} roughness={0.95} transparent />
        </mesh>
        {cutaway ? (
          <mesh position={[1.08, 0, 0.03]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[6.3, 5.5]} />
            <meshStandardMaterial color="#b8d8e1" opacity={0.12} roughness={0.6} side={THREE.DoubleSide} transparent />
          </mesh>
        ) : null}
      </group>

      <group ref={shieldRef} position={offset([-0.95, 0.08, 0.1], explosion * 0.82)} onClick={selectPart(onSelect, "shieldShell")}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[2.34, 2.34, 2.65, 112, 1, true]} />
          <meshStandardMaterial
            color="#667781"
            emissive="#173646"
            emissiveIntensity={materialBoost(selected, "shieldShell") + partBoost(highlightedParts, "shieldTail") * 0.28}
            metalness={0.82}
            opacity={dimOpacity(Math.max(0.32, opacity.shield), highlightedParts, "shieldTail")}
            roughness={0.48}
            transparent={opacity.shield < 1}
          />
        </mesh>
        {[-2.12, -1.26, -0.42, 0.34].map((x) => (
          <mesh key={x} rotation={[0, Math.PI / 2, 0]} position={[x, 0, 0]}>
            <torusGeometry args={[2.35, 0.036, 10, 112]} />
            <meshStandardMaterial color="#8b9aa2" metalness={0.72} roughness={0.34} />
          </mesh>
        ))}
        {Array.from({ length: 8 }, (_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          return (
            <CylinderBetween
              key={index}
              start={new THREE.Vector3(-2.2, Math.cos(angle) * 2.36, Math.sin(angle) * 2.36)}
              end={new THREE.Vector3(0.35, Math.cos(angle) * 2.36, Math.sin(angle) * 2.36)}
              radius={0.018}
              color="#a5b0b7"
              metalness={0.7}
            />
          );
        })}
        {Array.from({ length: 10 }, (_, index) => (
          <mesh key={index} position={[-1.92 + index * 0.22, 2.22, -0.42 + (index % 2) * 0.1]} rotation={[0.2, 0, 0.1]}>
            <boxGeometry args={[0.13, 0.008, 0.32]} />
            <meshStandardMaterial color="#3b454b" opacity={0.42} roughness={0.9} transparent />
          </mesh>
        ))}
      </group>

      <ModelLoader
        src={modelSources.shieldTail}
        position={offset([0.42, 0.12, -0.06], explosion * 0.68)}
        onClick={selectPart(onSelect, "shieldTail")}
        fallback={
          <>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[2.28, 2.28, 0.96, 112, 1, true]} />
              <meshStandardMaterial
                color="#465966"
                emissive="#2d748f"
                emissiveIntensity={materialBoost(selected, "shieldTail") + partBoost(highlightedParts, "shieldTail")}
                metalness={0.82}
                opacity={dimOpacity(Math.min(0.94, opacity.shield + 0.04), highlightedParts, "shieldTail")}
                roughness={0.38}
                transparent
              />
            </mesh>
            {[-0.02, 0.5].map((x) => (
              <mesh key={x} rotation={[0, Math.PI / 2, 0]} position={[x, 0, 0]}>
                <torusGeometry args={[2.16, 0.055, 12, 112]} />
                <meshStandardMaterial color="#98a5a9" metalness={0.7} roughness={0.28} />
              </mesh>
            ))}
          </>
        }
      />

      <group position={offset([0.16, 0.34, 0.02], explosion * 1.05)} onClick={selectPart(onSelect, "tailBrush")}>
        {[0.46, 0.64, 0.82].map((x) => (
          <group key={x}>
            <mesh rotation={[0, Math.PI / 2, 0]} position={[x, 0, 0]}>
              <torusGeometry args={[2.1, 0.038, 12, 112]} />
              <meshStandardMaterial
                color="#222a2c"
                emissive="#b98731"
                emissiveIntensity={materialBoost(selected, "tailBrush") * 0.72 + partBoost(highlightedParts, "tailBrush")}
                metalness={0.45}
                roughness={0.62}
              />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]} position={[x + 0.075, 0, 0]}>
              <torusGeometry args={[1.98, 0.025, 10, 112]} />
              <meshStandardMaterial color="#8d682b" emissive="#8d682b" emissiveIntensity={0.18} roughness={0.44} />
            </mesh>
          </group>
        ))}
        {brushSegments.map((segment, index) => (
          <CylinderBetween key={index} start={segment.start} end={segment.end} radius={0.0085} color="#151a1b" metalness={0.25} />
        ))}
      </group>

      <ModelLoader
        src={modelSources.segmentRing}
        position={offset([0.74, 0.2, 0.18], explosion * 0.7)}
        onClick={selectPart(onSelect, "segmentRing")}
        fallback={
          <>
            {ringPositions.map((x, ringIndex) => (
              <SegmentRing
                key={x}
                x={x + operationProgress * 0.08}
                ringIndex={ringIndex}
                selected={selected}
                opacity={dimOpacity(opacity.segment, highlightedParts, "segmentRing")}
                operation={operation}
              />
            ))}
          </>
        }
      />

      <group position={offset([0.86, -0.02, 0.05], explosion * 0.5)} onClick={selectPart(onSelect, "annularGap")}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[2.25, 0, 0]}>
          <cylinderGeometry args={[2.34, 2.34, 3.25, 112, 1, true, cutaway ? Math.PI * 0.18 : 0, cutaway ? Math.PI * 1.54 : Math.PI * 2]} />
          <meshStandardMaterial
            color="#eef1ed"
            emissive="#b9f1ff"
            emissiveIntensity={selected === "annularGap" ? 0.22 : 0.04 + partBoost(highlightedParts, "segmentGap") * 0.5}
            opacity={dimOpacity(cutaway ? 0.22 : 0.1, highlightedParts, "segmentGap")}
            roughness={0.72}
            transparent
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0.74, 0, 0]}>
          <torusGeometry args={[2.29, 0.022, 10, 112]} />
          <meshStandardMaterial color="#dfe8ec" emissive="#77e4ff" emissiveIntensity={0.34} transparent opacity={0.58} />
        </mesh>
      </group>

      <group position={offset([1.05, 0.02, -0.04], explosion * 0.4)} onClick={selectPart(onSelect, "groutLayer")}>
        {(risk.mode === "low"
          ? [
              [Math.PI * 0.18, Math.PI * 0.55],
              [Math.PI * 0.9, Math.PI * 0.42],
              [Math.PI * 1.55, Math.PI * 0.36]
            ]
          : [[cutaway ? Math.PI * 0.22 : 0, cutaway ? Math.PI * 1.45 : Math.PI * 2]]
        ).map(([start, length], index) => (
          <mesh key={index} rotation={[0, 0, Math.PI / 2]} position={[2.3, 0, 0]}>
            <cylinderGeometry args={[2.22, 2.22, 2.9, 112, 1, true, start, length]} />
            <meshStandardMaterial
              color={groutColor(risk.mode)}
              emissive={groutColor(risk.mode)}
              emissiveIntensity={groutIntensity + partBoost(highlightedParts, "groutLayer") * 0.7}
              opacity={dimOpacity(Math.min(0.62, opacity.grout), highlightedParts, "groutLayer") * Math.max(0.32, operationProgress)}
              roughness={0.32}
              transparent
            />
          </mesh>
        ))}

        {risk.mode === "low" ? (
          <>
            <Text position={[2.42, 1.35, 1.35]} fontSize={0.11} color="#ff9aa5" anchorX="center" maxWidth={1.2}>
              局部空洞 / 填充不足
            </Text>
            <mesh position={[2.28, 1.04, 1.05]}>
              <sphereGeometry args={[0.14, 20, 16]} />
              <meshStandardMaterial color="#061521" emissive="#ff6f7c" emissiveIntensity={0.45} opacity={0.76} transparent />
            </mesh>
          </>
        ) : null}

        {risk.mode === "high" ? (
          <>
            <mesh position={[2.58, 2.02, -1.42]} rotation={[0.7, 0, -0.45]}>
              <sphereGeometry args={[0.24, 24, 20]} />
              <meshStandardMaterial color="#d7bb80" emissive="#ffbb55" emissiveIntensity={0.85} opacity={0.74} transparent />
            </mesh>
            <Text position={[2.85, 2.34, -1.56]} fontSize={0.11} color="#ffd36b" anchorX="center" maxWidth={1.2}>
              外溢 / 隆起风险
            </Text>
          </>
        ) : null}
      </group>

      {cutaway ? (
        <group position={[2.94, 0, 0]}>
          {[2.01, 2.24, 2.98].map((radius, index) => (
            <mesh key={radius} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[radius, index === 1 ? 0.028 : 0.018, 8, 112]} />
              <meshBasicMaterial color={index === 1 ? "#b9f1ff" : index === 0 ? "#f4f7f8" : "#b78f69"} />
            </mesh>
          ))}
          <CutawayArrow start={[0.02, 2.9, 0.52]} end={[0.02, 2.27, 0.2]} label="盾尾空隙" />
          <CutawayArrow start={[0.02, -2.72, 0.72]} end={[0.02, -2.02, 0.18]} label="管片外侧" />
          <CutawayArrow start={[0.02, 2.15, -1.52]} end={[0.02, 1.58, -1.08]} label="同步注浆口" />
          <CutawayArrow start={[0.02, -1.95, -1.72]} end={[0.02, -1.55, -1.2]} label="浆液填充层" />
          <CutawayArrow start={[0.02, 3.22, -0.96]} end={[0.02, 2.78, -0.72]} label="外侧地层" />
        </group>
      ) : null}

      <SceneHotspot id="annularGap" label="管片外侧空隙" position={[2.3, 2.55, 0.62]} active={selected === "annularGap"} onSelect={onSelect} />
      <SceneHotspot id="groutLayer" label="浆液填充层" position={[2.58, -1.72, 1.45]} active={selected === "groutLayer"} onSelect={onSelect} />
      <SceneHotspot id="tailBrush" label="盾尾密封区" position={[0.72, 2.25, -0.85]} active={selected === "tailBrush"} onSelect={onSelect} />
    </group>
  );
}
